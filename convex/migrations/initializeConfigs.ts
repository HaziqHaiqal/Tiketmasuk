import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const initializeDefaultConfigs = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if configs already exist to avoid duplicates
    const existingConfigs = await ctx.db.query("system_configs").collect();
    if (existingConfigs.length > 0) {
      console.log("Configurations already exist, skipping initialization");
      return { message: "Configurations already exist" };
    }

    const now = Date.now();
    const systemUserId = "system" as Id<"users">; // Placeholder for system user

    // 1. Malaysian States Configuration
    await ctx.db.insert("system_configs", {
      config_key: "malaysian_states",
      category: "location",
      name: "Malaysian States",
      description: "List of all Malaysian states and federal territories",
      config_data: {
        states: [
          "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
          "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak",
          "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"
        ]
      },
      is_active: true,
      is_system_config: true,
      version: 1,
      editable_by_admin: true,
      editable_by_organizer: false,
      created_at: now,
    });

    // 2. Event Categories Configuration
    await ctx.db.insert("system_configs", {
      config_key: "event_categories",
      category: "event",
      name: "Event Categories",
      description: "Available event categories for classification",
      config_data: {
        categories: [
          { key: "sports", name: "Sports", description: "Sports and fitness events" },
          { key: "music", name: "Music", description: "Concerts and music events" },
          { key: "food", name: "Food & Dining", description: "Food festivals and dining events" },
          { key: "travel", name: "Travel", description: "Travel and tourism events" },
          { key: "technology", name: "Technology", description: "Tech conferences and workshops" },
          { key: "arts", name: "Arts & Culture", description: "Art exhibitions and cultural events" },
          { key: "business", name: "Business", description: "Business and networking events" },
          { key: "education", name: "Education", description: "Educational workshops and seminars" },
          { key: "health", name: "Health & Wellness", description: "Health and wellness events" },
          { key: "entertainment", name: "Entertainment", description: "Entertainment and shows" }
        ]
      },
      is_active: true,
      is_system_config: true,
      version: 1,
      editable_by_admin: true,
      editable_by_organizer: true,
      created_at: now,
    });

    // 3. User Roles Configuration
    await ctx.db.insert("system_configs", {
      config_key: "user_roles",
      category: "user",
      name: "User Roles",
      description: "Available user roles and their configurations",
      config_data: {
        roles: ["customer", "organizer", "admin"],
        roleInfo: {
          customer: {
            name: "Customer",
            description: "Browse and book events",
            color: "blue",
            icon: "👤",
            permissions: ["view_events", "book_tickets", "manage_profile"]
          },
          organizer: {
            name: "Organizer",
            description: "Create and manage events",
            color: "purple",
            icon: "🎪",
            permissions: ["create_events", "manage_events", "view_analytics", "manage_bookings"]
          },
          admin: {
            name: "Admin",
            description: "Manage platform and users",
            color: "red",
            icon: "⚙️",
            permissions: ["manage_users", "manage_configs", "view_all_data", "moderate_content"]
          }
        }
      },
      is_active: true,
      is_system_config: true,
      version: 1,
      editable_by_admin: true,
      editable_by_organizer: false,
      created_at: now,
    });

    // 4. Organizer Types Configuration
    await ctx.db.insert("system_configs", {
      config_key: "organizer_types",
      category: "user",
      name: "Organizer Types",
      description: "Available organizer types for registration",
      config_data: {
        types: [
          { key: "individual", name: "Individual", description: "Individual event organizer" },
          { key: "business", name: "Business", description: "Business or company" },
          { key: "organization", name: "Organization", description: "Non-profit organization" },
          { key: "group", name: "Group", description: "Community group or club" }
        ]
      },
      is_active: true,
      is_system_config: false,
      version: 1,
      editable_by_admin: true,
      editable_by_organizer: false,
      created_at: now,
    });

    // 5. Event Status Configuration
    await ctx.db.insert("system_configs", {
      config_key: "event_statuses",
      category: "event",
      name: "Event Statuses",
      description: "Available event statuses and their configurations",
      config_data: {
        statuses: [
          { key: "draft", name: "Draft", description: "Event is being created", color: "gray" },
          { key: "pending", name: "Pending Review", description: "Waiting for admin approval", color: "yellow" },
          { key: "approved", name: "Approved", description: "Admin approved, ready to publish", color: "green" },
          { key: "rejected", name: "Rejected", description: "Admin rejected", color: "red" },
          { key: "published", name: "Published", description: "Live and visible to public", color: "blue" },
          { key: "cancelled", name: "Cancelled", description: "Event cancelled", color: "red" },
          { key: "postponed", name: "Postponed", description: "Event postponed", color: "orange" },
          { key: "sold_out", name: "Sold Out", description: "All tickets sold", color: "purple" },
          { key: "completed", name: "Completed", description: "Event finished", color: "green" }
        ]
      },
      is_active: true,
      is_system_config: true,
      version: 1,
      editable_by_admin: true,
      editable_by_organizer: false,
      created_at: now,
    });

    // 6. Venue Types Configuration
    await ctx.db.insert("system_configs", {
      config_key: "venue_types",
      category: "venue",
      name: "Venue Types",
      description: "Available venue types for events",
      config_data: {
        types: [
          { key: "conference_center", name: "Conference Center", icon: "🏢" },
          { key: "hotel", name: "Hotel", icon: "🏨" },
          { key: "restaurant", name: "Restaurant", icon: "🍽️" },
          { key: "outdoor", name: "Outdoor", icon: "🌳" },
          { key: "theater", name: "Theater", icon: "🎭" },
          { key: "stadium", name: "Stadium", icon: "🏟️" },
          { key: "club", name: "Club", icon: "🎵" },
          { key: "gallery", name: "Gallery", icon: "🖼️" },
          { key: "other", name: "Other", icon: "📍" }
        ]
      },
      is_active: true,
      is_system_config: false,
      version: 1,
      editable_by_admin: true,
      editable_by_organizer: true,
      created_at: now,
    });

    // 7. Event Template Categories Configuration
    await ctx.db.insert("system_configs", {
      config_key: "event_template_categories",
      category: "event",
      name: "Event Template Categories",
      description: "Categories for event templates",
      config_data: {
        categories: [
          "Conference",
          "Workshop",
          "Seminar",
          "Networking",
          "Entertainment",
          "Sports",
          "Cultural",
          "Educational",
          "Corporate",
          "Community"
        ]
      },
      is_active: true,
      is_system_config: false,
      version: 1,
      editable_by_admin: true,
      editable_by_organizer: true,
      created_at: now,
    });

    // 8. Gender Options Configuration
    await ctx.db.insert("system_configs", {
      config_key: "gender_options",
      category: "user",
      name: "Gender Options",
      description: "Available gender options for user profiles",
      config_data: {
        options: [
          { key: "male", name: "Male" },
          { key: "female", name: "Female" },
          { key: "other", name: "Other" },
          { key: "prefer_not_to_say", name: "Prefer not to say" }
        ]
      },
      is_active: true,
      is_system_config: false,
      version: 1,
      editable_by_admin: true,
      editable_by_organizer: false,
      created_at: now,
    });

    // 9. Platform Settings Configuration
    await ctx.db.insert("system_configs", {
      config_key: "platform_settings",
      category: "system",
      name: "Platform Settings",
      description: "General platform configuration settings",
      config_data: {
        currency: "MYR",
        timezone: "Asia/Kuala_Lumpur",
        language: "en",
        date_format: "DD/MM/YYYY",
        time_format: "24h",
        max_file_size: 10485760, // 10MB
        supported_file_types: ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
        max_events_per_organizer: 100,
        max_tickets_per_booking: 10,
        booking_timeout_minutes: 15
      },
      is_active: true,
      is_system_config: true,
      version: 1,
      editable_by_admin: true,
      editable_by_organizer: false,
      created_at: now,
    });

    // 10. Online Platform Options Configuration
    await ctx.db.insert("system_configs", {
      config_key: "online_platforms",
      category: "event",
      name: "Online Event Platforms",
      description: "Available online platforms for virtual events",
      config_data: {
        platforms: [
          { key: "zoom", name: "Zoom", icon: "💻" },
          { key: "teams", name: "Microsoft Teams", icon: "📹" },
          { key: "youtube", name: "YouTube Live", icon: "📺" },
          { key: "facebook", name: "Facebook Live", icon: "📱" },
          { key: "custom", name: "Custom Platform", icon: "🌐" }
        ]
      },
      is_active: true,
      is_system_config: false,
      version: 1,
      editable_by_admin: true,
      editable_by_organizer: true,
      created_at: now,
    });

    return { 
      message: "Default configurations initialized successfully",
      count: 10
    };
  },
}); 