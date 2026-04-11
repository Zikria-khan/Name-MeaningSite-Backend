const mongoose = require('mongoose');

const islamicNameSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  slug: { type: String, required: true },
  language: [String],
  gender: String,
  origin: String,
  religion: { type: String, default: "Islam" },
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

  in_arabic: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_urdu: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_hindi: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_pashto: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_english: {
    name: String,
    meaning: String,
    long_meaning: String
  },

  meanings_by_language: {
    type: Map,
    of: new mongoose.Schema({
      name: String,
      meaning: String,
      long_meaning: String,
    }, { _id: false })
  },

  pronunciation: {
    english: String,
    urdu: String,
    hindi: String,
    pashto: String,
    ipa: String
  },

  celebrity_usage: [String],
  related_names: [String],
  similar_sounding_names: [String],
  social_tags: [String],

  // Name variations and popularity
  name_variations: [String], // Different spellings: ["Muhammad", "Mohammed", "Mohamed"]
  popularity_score: { type: Number, default: 0, min: 0, max: 100 }, // Overall popularity score
  popularity_by_region: [
    {
      region: String,        // e.g. "Saudi Arabia", "Pakistan", "UAE"
      country_code: String,  // e.g. "SA", "PK", "AE"
      score: Number,         // Popularity score in that region (0-100)
      rank: Number,          // Rank in that region (optional)
      year: Number           // Year of data (optional)
    }
  ],

  seo: {
    title: String,
    meta_description: String,
    description_paragraph: String,
    faq: [
      {
        q: String,
        a: String
      }
    ]
  },

  share_options: {
    facebook: Boolean,
    whatsapp: Boolean,
    copy_button: Boolean,
    copy_text: String
  },

  monetization: {
    propush_trigger: Boolean,
    exit_ad_enabled: Boolean,
    ads_enabled: Boolean
  },

  cultural_impact: { type: String, default: "" },
  spiritual_significance: { type: String, default: "" },

  islamic_reference: {
    is_quranic: Boolean,
    surah: String,
    verse: String,
    hadith_reference: String,
    note: String
  },
  historical_references: [
    {
      reference: String,
      time_period: String,
      context: String
    }
  ],


  modern_usage: {
    trends: [String],
    platforms: [String],
    modern_context: String
  },

  name_in_real_life: {
    person_name: String,
    location: String,
    story: String
  },

  // Enhanced user stories collection
  user_stories: [
    {
      person_name: String,
      location: String,
      country: String,
      story: String,
      rating: { type: Number, min: 1, max: 5 }, // Story rating
      verified: { type: Boolean, default: false }, // Admin verified
      submitted_at: { type: Date, default: Date.now },
      likes: { type: Number, default: 0 }
    }
  ],

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
  
  created_at: String,
  updated_at: String
});

// ✅ EXPORT the model
module.exports = mongoose.model("IslamicName", islamicNameSchema);
