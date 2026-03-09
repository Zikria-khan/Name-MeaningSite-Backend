const mongoose = require("mongoose");

/**
 * Article Schema for MongoDB
 * Migrated from Supabase articles table
 */
const articleSchema = new mongoose.Schema(
  {
    // Original Supabase ID (for migration tracking)
    supabase_id: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined
    },
    
    // Core fields
    slug: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
    subtitle: {
      type: String,
    },
    author: {
      type: String,
      default: "NameVerse Team",
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    tags: [{
      type: String,
    }],
    
    // SEO fields
    seo_title: String,
    seo_description: String,
    seo_keywords: [String],
    
    // Content
    cover_image_url: String,
    excerpt: String,
    content: String,
    read_time_minutes: Number,
    name_links: [String], // Links to names mentioned in article
    
    // Status
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
      index: true,
    },
    
    // Engagement metrics
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    
    // Timestamps
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Indexes for fast queries
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ title: "text", subtitle: "text", excerpt: "text", content: "text", tags: "text" }); // Text search

module.exports = mongoose.model("Article", articleSchema);

