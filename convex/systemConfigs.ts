import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================================================
// CONFIGURATION QUERIES
// ============================================================================

export const getConfig = query({
  args: { config_key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("system_configs")
      .withIndex("by_config_key", (q) => q.eq("config_key", args.config_key))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    return config;
  },
});

export const getConfigsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("system_configs")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

export const getAllConfigs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();

    const isAdmin = userRoles.some(role => role.role === "admin");
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    return await ctx.db
      .query("system_configs")
      .collect();
  },
});

export const getEditableConfigs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();

    const isAdmin = userRoles.some(role => role.role === "admin");
    const isOrganizer = userRoles.some(role => role.role === "organizer");

    let query = ctx.db.query("system_configs").filter((q) => q.eq(q.field("is_active"), true));

    if (isAdmin) {
      // Admins can see all editable configs
      query = query.filter((q) => q.eq(q.field("editable_by_admin"), true));
    } else if (isOrganizer) {
      // Organizers can see organizer-editable configs
      query = query.filter((q) => q.eq(q.field("editable_by_organizer"), true));
    } else {
      // Regular users can't edit configs
      return [];
    }

    return await query.collect();
  },
});

// ============================================================================
// CONFIGURATION MUTATIONS
// ============================================================================

export const createConfig = mutation({
  args: {
    config_key: v.string(),
    category: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    config_data: v.any(),
    is_system_config: v.optional(v.boolean()),
    editable_by_admin: v.optional(v.boolean()),
    editable_by_organizer: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check user roles
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();

    const isAdmin = userRoles.some(role => role.role === "admin");
    const isOrganizer = userRoles.some(role => role.role === "organizer");

    // Admins can create any config, organizers can create non-system configs
    if (!isAdmin && !isOrganizer) {
      throw new Error("Admin or organizer access required");
    }

    // Only admins can create system configs
    if (args.is_system_config && !isAdmin) {
      throw new Error("Only admins can create system configurations");
    }

    // Check if config key already exists
    const existingConfig = await ctx.db
      .query("system_configs")
      .withIndex("by_config_key", (q) => q.eq("config_key", args.config_key))
      .first();

    if (existingConfig) {
      throw new Error("Configuration key already exists");
    }

    const configId = await ctx.db.insert("system_configs", {
      config_key: args.config_key,
      category: args.category,
      name: args.name,
      description: args.description,
      config_data: args.config_data,
      is_active: true,
      is_system_config: args.is_system_config ?? false,
      version: 1,
      editable_by_admin: args.editable_by_admin ?? true,
      editable_by_organizer: args.editable_by_organizer ?? false,
      created_at: Date.now(),
      created_by: identity.subject as Id<"users">,
    });

    // Log the creation
    await ctx.db.insert("config_history", {
      config_id: configId,
      config_key: args.config_key,
      action: "created",
      new_data: args.config_data,
      changed_by: identity.subject as Id<"users">,
      changed_at: Date.now(),
      version_after: 1,
    });

    return configId;
  },
});

export const updateConfig = mutation({
  args: {
    config_id: v.id("system_configs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    config_data: v.optional(v.any()),
    change_reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const config = await ctx.db.get(args.config_id);
    if (!config) {
      throw new Error("Configuration not found");
    }

    // Check permissions
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();

    const isAdmin = userRoles.some(role => role.role === "admin");
    const isOrganizer = userRoles.some(role => role.role === "organizer");

    const canEdit = (isAdmin && config.editable_by_admin) || 
                   (isOrganizer && config.editable_by_organizer);

    if (!canEdit) {
      throw new Error("Permission denied");
    }

    const oldData = config.config_data;
    const newVersion = config.version + 1;

    // Update the configuration
    await ctx.db.patch(args.config_id, {
      ...(args.name && { name: args.name }),
      ...(args.description && { description: args.description }),
      ...(args.config_data && { config_data: args.config_data }),
      version: newVersion,
      updated_at: Date.now(),
      updated_by: identity.subject as Id<"users">,
    });

    // Log the change
    await ctx.db.insert("config_history", {
      config_id: args.config_id,
      config_key: config.config_key,
      action: "updated",
      old_data: oldData,
      new_data: args.config_data || oldData,
      change_reason: args.change_reason,
      changed_by: identity.subject as Id<"users">,
      changed_at: Date.now(),
      version_before: config.version,
      version_after: newVersion,
    });

    return await ctx.db.get(args.config_id);
  },
});

export const deleteConfig = mutation({
  args: {
    config_id: v.id("system_configs"),
    change_reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const config = await ctx.db.get(args.config_id);
    if (!config) {
      throw new Error("Configuration not found");
    }

    // Check user roles and permissions
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();

    const isAdmin = userRoles.some(role => role.role === "admin");
    const isOrganizer = userRoles.some(role => role.role === "organizer");

    // Check permissions
    const canDelete = (isAdmin && config.editable_by_admin) || 
                     (isOrganizer && config.editable_by_organizer && !config.is_system_config);

    if (!canDelete) {
      throw new Error("Permission denied. You cannot delete this configuration.");
    }

    // Don't allow deletion of system configs by non-admins
    if (config.is_system_config && !isAdmin) {
      throw new Error("Cannot delete system configuration");
    }

    // Log the deletion before deleting
    await ctx.db.insert("config_history", {
      config_id: args.config_id,
      config_key: config.config_key,
      action: "deleted",
      old_data: config.config_data,
      change_reason: args.change_reason,
      changed_by: identity.subject as Id<"users">,
      changed_at: Date.now(),
      version_before: config.version,
      version_after: config.version,
    });

    await ctx.db.delete(args.config_id);
    return { success: true };
  },
});

export const toggleConfigActive = mutation({
  args: {
    config_id: v.id("system_configs"),
    change_reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const config = await ctx.db.get(args.config_id);
    if (!config) {
      throw new Error("Configuration not found");
    }

    // Check user roles and permissions
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();

    const isAdmin = userRoles.some(role => role.role === "admin");
    const isOrganizer = userRoles.some(role => role.role === "organizer");

    // Check permissions
    const canToggle = (isAdmin && config.editable_by_admin) || 
                     (isOrganizer && config.editable_by_organizer);

    if (!canToggle) {
      throw new Error("Permission denied. You cannot modify this configuration.");
    }

    const newActiveState = !config.is_active;
    const newVersion = config.version + 1;

    await ctx.db.patch(args.config_id, {
      is_active: newActiveState,
      version: newVersion,
      updated_at: Date.now(),
      updated_by: identity.subject as Id<"users">,
    });

    // Log the change
    await ctx.db.insert("config_history", {
      config_id: args.config_id,
      config_key: config.config_key,
      action: newActiveState ? "activated" : "deactivated",
      change_reason: args.change_reason,
      changed_by: identity.subject as Id<"users">,
      changed_at: Date.now(),
      version_before: config.version,
      version_after: newVersion,
    });

    return await ctx.db.get(args.config_id);
  },
});

// ============================================================================
// CONFIGURATION HISTORY
// ============================================================================

export const getConfigHistory = query({
  args: { config_id: v.id("system_configs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const config = await ctx.db.get(args.config_id);
    if (!config) {
      throw new Error("Configuration not found");
    }

    // Check user roles and permissions
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();

    const isAdmin = userRoles.some(role => role.role === "admin");
    const isOrganizer = userRoles.some(role => role.role === "organizer");

    // Check permissions - users can view history of configs they can edit
    const canViewHistory = (isAdmin && config.editable_by_admin) || 
                          (isOrganizer && config.editable_by_organizer);

    if (!canViewHistory) {
      throw new Error("Permission denied. You cannot view history for this configuration.");
    }

    return await ctx.db
      .query("config_history")
      .withIndex("by_config", (q) => q.eq("config_id", args.config_id))
      .order("desc")
      .collect();
  },
});

// ============================================================================
// HELPER FUNCTIONS FOR DYNAMIC CONFIGURATION
// ============================================================================

export const getMalaysianStates = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("system_configs")
      .withIndex("by_config_key", (q) => q.eq("config_key", "malaysian_states"))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    if (!config) {
      // Return fallback hardcoded values if config not found
      return [
        "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
        "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak",
        "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"
      ];
    }
    
    return config.config_data.states || [];
  },
});

export const getEventCategories = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("system_configs")
      .withIndex("by_config_key", (q) => q.eq("config_key", "event_categories"))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    if (!config) {
      // Return fallback hardcoded values if config not found
      return [
        "sports", "music", "food", "travel", "technology",
        "arts", "business", "education", "health", "entertainment"
      ];
    }
    
    return config.config_data.categories || [];
  },
});

export const getUserRoleConfigs = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("system_configs")
      .withIndex("by_config_key", (q) => q.eq("config_key", "user_roles"))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    if (!config) {
      // Return fallback hardcoded values if config not found
      return {
        roles: ["customer", "organizer", "admin"],
        roleInfo: {
          customer: { name: "Customer", description: "Browse and book events", color: "blue", icon: "👤" },
          organizer: { name: "Organizer", description: "Create and manage events", color: "purple", icon: "🎪" },
          admin: { name: "Admin", description: "Manage platform and users", color: "red", icon: "⚙️" }
        }
      };
    }
    
    return config.config_data;
  },
});

export const getOrganizerTypes = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("system_configs")
      .withIndex("by_config_key", (q) => q.eq("config_key", "organizer_types"))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    if (!config) {
      // Return fallback hardcoded values if config not found
      return ["individual", "business"];
    }
    
    return config.config_data.types || [];
  },
}); 