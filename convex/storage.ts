import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

/**
 * Updates an event with the given storage ID for the uploaded image.
 * This function should be called after a successful image upload.
 */
export const updateEventImage = mutation({
  args: {
    event_id: v.id("events"),
    storage_id: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.event_id, {
      image_storage_id: args.storage_id,
      updated_at: Date.now(),
    });
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

export const deleteImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await ctx.storage.delete(storageId);
  },
});

export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
  },
});
