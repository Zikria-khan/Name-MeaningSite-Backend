const mongoose = require('mongoose');


const christianNameSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  slug: { type: String, required: true },

  language: [String],
  gender: String,
  origin: String,
  religion: { type: String, default: 'Christianity' },
  category: [String],
  themes: [String],

  short_meaning: String,
  long_meaning: String,
  spiritual_meaning: String,
  emotional_traits: [String],
  hidden_personality_traits: [String],

  lucky_number: Number,
  lucky_day: String,
  lucky_colors: [String],
  lucky_stone: String,
  life_path_number: Number,
  numerology_meaning: String,

  meanings_by_language: {
    type: Map,
    of: new mongoose.Schema({
      name: String,
      meaning: String,
      long_meaning: String,
    }, { _id: false })
  },

  // Per-language detailed meanings
  in_hebrew: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_greek: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_latin: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_english: {
    name: String,
    meaning: String,
    long_meaning: String
  },

  pronunciation: {
    english: String,
    biblical: String,
    ipa: String
  },

  celebrity_usage: [String],
  related_names: [String],
  similar_sounding_names: [String],
  social_tags: [String],

  // Name variations and popularity
  name_variations: [String], // Different spellings: ["Catherine", "Katherine", "Kathryn"]
  popularity_score: { type: Number, default: 0, min: 0, max: 100 }, // Overall popularity score
  popularity_by_region: [
    {
      region: String,        // e.g. "United States", "United Kingdom", "Italy"
      country_code: String,  // e.g. "US", "UK", "IT"
      score: Number,         // Popularity score in that region (0-100)
      rank: Number,          // Rank in that region (optional)
      year: Number           // Year of data (optional)
    }
  ],

  // Biblical reference
  biblical_reference: {
    is_biblical: Boolean,
    origin_scripture: String,
    verse_reference: String,
    note: String
  },

  // Saint reference
  saint_reference: {
    is_saint_name: Boolean,
    saint_name: String,
    note: String
  },


  // ✅ New fields added (Spiritual/Cultural)
  cultural_impact: {
    type: String,
    default: ""
  },
  spiritual_significance: {
    type: String,
    default: ""
  },

  // ✅ New: Historical reference usage
  historical_references: [
    {
      reference: String,
      time_period: String, // e.g. "Abbasid Caliphate", "Mughal Era"
      context: String      // e.g. "Used by scholars during..."
    }
  ],

  // ✅ New: Modern usage insight
  modern_usage: {
    trends: [String],       // e.g. ["Popular in UAE", "Top in 2023"]
    platforms: [String],    // e.g. ["Instagram", "YouTube"]
    modern_context: String  // Optional paragraph
  },

  // ✅ New: User submitted stories
  name_in_real_life: {
    person_name: String,
    location: String,
    story: String
  },

  spiritual_symbolism: String,

  // ✅ New fields for E-A-T and SEO
  sources: [{
    url: { type: String },
    title: { type: String },
    description: { type: String },
    _id: false
  }],
  seo_meta: {
    title: { type: String },
    description: { type: String },
    keywords: [String]
  },
  last_reviewed: { type: Date },

  seo: mongoose.Schema.Types.Mixed,
  share_options: mongoose.Schema.Types.Mixed,
  monetization: mongoose.Schema.Types.Mixed,

  created_at: String,
  updated_at: String,
});

module.exports = mongoose.model('ChristianName', christianNameSchema);
