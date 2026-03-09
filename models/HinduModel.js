const mongoose = require('mongoose');

const hinduNameSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  slug: { type: String, required: true },

  language: [String],
  gender: String,
  origin: String,
  religion: { type: String, default: "Hinduism" },
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
  in_sanskrit: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_hindi: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_tamil: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_telugu: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_marathi: {
    name: String,
    meaning: String,
    long_meaning: String
  },
  in_bengali: {
    name: String,
    meaning: String,
    long_meaning: String
  },

  pronunciation: {
    english: String,
    hindi: String,
    ipa: String
  },

  celebrity_usage: [String],
  related_names: [String],
  similar_sounding_names: [String],
  social_tags: [String],

  // Name variations and popularity
  name_variations: [String], // Different spellings: ["Krishna", "Krshna", "Krsna"]
  popularity_score: { type: Number, default: 0, min: 0, max: 100 }, // Overall popularity score
  popularity_by_region: [
    {
      region: String,        // e.g. "India", "Nepal", "Tamil Nadu", "Maharashtra"
      country_code: String,  // e.g. "IN", "NP"
      score: Number,         // Popularity score in that region (0-100)
      rank: Number,          // Rank in that region (optional)
      year: Number           // Year of data (optional)
    }
  ],

  // Vedic reference for Hindu names
  vedic_reference: {
    is_vedic: Boolean,
    root_origin: String,
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

  seo: mongoose.Schema.Types.Mixed,
  share_options: mongoose.Schema.Types.Mixed,
  monetization: mongoose.Schema.Types.Mixed,

  created_at: String,
  updated_at: String
});

module.exports = mongoose.model('HinduName', hinduNameSchema);
