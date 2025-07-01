import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Simplified accessibility functions that work with current schema
// Note: accessibility_settings table doesn't exist in current schema, so these are stubs

export const getUserAccessibilitySettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Return default settings since accessibility_settings table doesn't exist in schema
    return {
      fontSize: "medium",
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: false,
    };
  },
});

export const updateAccessibilitySettings = mutation({
  args: {
    fontSize: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
    highContrast: v.optional(v.boolean()),
    reducedMotion: v.optional(v.boolean()),
    screenReader: v.optional(v.boolean()),
    keyboardNavigation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // For now, just return the args since we don't have accessibility_settings table
    return {
      fontSize: args.fontSize || "medium",
      highContrast: args.highContrast || false,
      reducedMotion: args.reducedMotion || false,
      screenReader: args.screenReader || false,
      keyboardNavigation: args.keyboardNavigation || false,
    };
  },
});

export const submitAccessibilityFeedback = mutation({
  args: {
    feedback_type: v.union(v.literal("bug"), v.literal("suggestion"), v.literal("other")),
    description: v.string(),
    user_id: v.id("users"),
  },
  handler: async (ctx, request) => {
    // Get user information from the users table
    const user = await ctx.db.get(request.user_id);
    if (!user) {
      throw new Error("User not found");
    }

    // For now, just log the feedback since we don't have accessibility_feedback table
    console.log("Accessibility feedback:", {
      feedback_type: request.feedback_type,
      description: request.description,
      user_info: {
        name: user.name || "Unknown",
        email: user.email || "Unknown",
      },
    });

    return { success: true };
  },
});

export const getAccessibilityPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Return default preferences
    return {
      fontSize: "medium",
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: false,
      voiceNavigation: false,
      colorBlindSupport: false,
    };
  },
});

export const updateAccessibilityPreferences = mutation({
  args: {
    fontSize: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
    highContrast: v.optional(v.boolean()),
    reducedMotion: v.optional(v.boolean()),
    screenReader: v.optional(v.boolean()),
    keyboardNavigation: v.optional(v.boolean()),
    voiceNavigation: v.optional(v.boolean()),
    colorBlindSupport: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // For now, just log the preferences since we don't have accessibility_settings table
    console.log("Accessibility preferences updated:", args);
    return { success: true, message: "Accessibility preferences not implemented yet" };
  },
});

export const getAccessibilityReport = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Return default report
    return {
      total_users_with_accessibility_needs: 0,
      most_used_features: [],
      feedback_summary: {
        total_feedback: 0,
        bugs: 0,
        suggestions: 0,
        other: 0
      },
      compliance_score: 85 // Default compliance score
    };
  },
});

export const logAccessibilityUsage = mutation({
  args: {
    feature: v.string(),
    action: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // For now, just log the usage since we don't have accessibility_usage table
    console.log("Accessibility feature usage:", args);
    return { success: true };
  },
});

export const getAccessibilityHelp = query({
  args: {},
  handler: async (ctx) => {
    // Return default help content
    return {
      features: [
        {
          name: "Font Size",
          description: "Adjust text size for better readability",
          howTo: "Use the font size controls in settings"
        },
        {
          name: "High Contrast",
          description: "Increase color contrast for better visibility",
          howTo: "Toggle high contrast mode in accessibility settings"
        },
        {
          name: "Reduced Motion",
          description: "Minimize animations and transitions",
          howTo: "Enable reduced motion in accessibility settings"
        },
        {
          name: "Screen Reader",
          description: "Optimize for screen reader compatibility",
          howTo: "Enable screen reader mode in accessibility settings"
        },
        {
          name: "Keyboard Navigation",
          description: "Navigate using keyboard only",
          howTo: "Use Tab, Enter, and arrow keys to navigate"
        }
      ],
      shortcuts: [
        { key: "Tab", description: "Navigate to next element" },
        { key: "Shift + Tab", description: "Navigate to previous element" },
        { key: "Enter", description: "Activate button or link" },
        { key: "Space", description: "Toggle checkbox or button" },
        { key: "Escape", description: "Close modal or dropdown" }
      ]
    };
  },
}); 