/**
 * Comprehensive Filter Testing System - Optimized Version
 * Uses MongoDB aggregation pipeline for fast filtering
 * Tests all filter categories and origins, counts names per filter value
 * Saves results to a JSON file
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const IslamicModel = require('./models/IslamicModel');
const ChristianModel = require('./models/ChristianModel');
const HinduModel = require('./models/HinduModel');

const models = {
  islamic: IslamicModel,
  christian: ChristianModel,
  hindu: HinduModel
};

// Word to exclude from categories
const DEFAULT_EXCLUDED_CATEGORY_WORDS = ['adult'];

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
}

/**
 * Build MongoDB match stage to exclude names with forbidden category words
 */
function buildExclusionMatch(excludeWords = DEFAULT_EXCLUDED_CATEGORY_WORDS) {
  if (!excludeWords || excludeWords.length === 0) return {};
  
  const wordConditions = excludeWords.map(word => ({
    category: { $not: { $regex: `\\b${word}\\b`, $options: 'i' } }
  }));
  
  return {
    $or: [
      { category: { $exists: false } },
      { category: { $size: 0 } },
      { $and: wordConditions }
    ]
  };
}

/**
 * Get category word counts using aggregation (fast)
 */
async function getCategoryWordCounts(Model, excludeWords = DEFAULT_EXCLUDED_CATEGORY_WORDS) {
  const exclusionMatch = buildExclusionMatch(excludeWords);
  
  const pipeline = [
    { $match: exclusionMatch },
    { $match: { category: { $exists: true, $ne: [] } } },
    { $unwind: '$category' },
    { $group: { _id: { $toLower: '$category' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  
  const results = await Model.aggregate(pipeline);
  
  const wordCounts = {};
  for (const r of results) {
    if (r._id && r._id.trim()) {
      wordCounts[r._id.trim()] = r.count;
    }
  }
  
  return wordCounts;
}

/**
 * Get origin counts using aggregation (fast)
 */
async function getOriginCounts(Model, excludeWords = DEFAULT_EXCLUDED_CATEGORY_WORDS) {
  const exclusionMatch = buildExclusionMatch(excludeWords);
  
  const pipeline = [
    { $match: exclusionMatch },
    { $match: { origin: { $exists: true, $ne: null, $ne: '' } } },
    { $group: { _id: '$origin', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  
  const results = await Model.aggregate(pipeline);
  
  const originCounts = {};
  for (const r of results) {
    if (r._id && r._id.trim()) {
      originCounts[r._id.trim()] = r.count;
    }
  }
  
  return originCounts;
}

/**
 * Get gender counts using aggregation (fast)
 */
async function getGenderCounts(Model, excludeWords = DEFAULT_EXCLUDED_CATEGORY_WORDS) {
  const exclusionMatch = buildExclusionMatch(excludeWords);
  
  const pipeline = [
    { $match: exclusionMatch },
    { $match: { gender: { $exists: true, $ne: null, $ne: '' } } },
    { $group: { _id: '$gender', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  
  const results = await Model.aggregate(pipeline);
  
  const genderCounts = {};
  for (const r of results) {
    if (r._id && r._id.trim()) {
      genderCounts[r._id.trim()] = r.count;
    }
  }
  
  return genderCounts;
}

/**
 * Get theme counts using aggregation (fast)
 */
async function getThemeCounts(Model, excludeWords = DEFAULT_EXCLUDED_CATEGORY_WORDS) {
  const exclusionMatch = buildExclusionMatch(excludeWords);
  
  const pipeline = [
    { $match: exclusionMatch },
    { $match: { themes: { $exists: true, $ne: [] } } },
    { $unwind: '$themes' },
    { $group: { _id: '$themes', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  
  const results = await Model.aggregate(pipeline);
  
  const themeCounts = {};
  for (const r of results) {
    if (r._id && r._id.trim()) {
      themeCounts[r._id.trim()] = r.count;
    }
  }
  
  return themeCounts;
}

/**
 * Get total names count using aggregation (fast)
 */
async function getTotalNames(Model, excludeWords = DEFAULT_EXCLUDED_CATEGORY_WORDS) {
  const exclusionMatch = buildExclusionMatch(excludeWords);
  return await Model.countDocuments(exclusionMatch);
}

/**
 * Test all filters for a specific religion
 */
async function testReligionFilters(religion) {
  const Model = models[religion.toLowerCase()];
  if (!Model) {
    throw new Error(`Invalid religion: ${religion}`);
  }
  
  console.log(`\n📊 Testing ${religion.toUpperCase()}...`);
  
  const [
    categoryWordCounts,
    originCounts,
    genderCounts,
    themeCounts,
    totalNames
  ] = await Promise.all([
    getCategoryWordCounts(Model),
    getOriginCounts(Model),
    getGenderCounts(Model),
    getThemeCounts(Model),
    getTotalNames(Model)
  ]);
  
  // Convert to sorted arrays
  const categories = Object.entries(categoryWordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
  
  const origins = Object.entries(originCounts)
    .map(([origin, count]) => ({ origin, count }))
    .sort((a, b) => b.count - a.count);
  
  const genders = Object.entries(genderCounts)
    .map(([gender, count]) => ({ gender, count }))
    .sort((a, b) => b.count - a.count);
  
  const themes = Object.entries(themeCounts)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);
  
  console.log(`   ✅ ${religion}: ${totalNames} names, ${categories.length} category words, ${origins.length} origins`);
  
  return {
    religion,
    totalNames,
    categories: {
      totalUniqueWords: categories.length,
      items: categories
    },
    origins: {
      totalUnique: origins.length,
      items: origins
    },
    genders: {
      totalUnique: genders.length,
      items: genders
    },
    themes: {
      totalUnique: themes.length,
      items: themes
    }
  };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Comprehensive Filter Test (Optimized)\n');
  console.log('='.repeat(50));
  
  await connectDB();
  
  const religions = ['islamic', 'christian', 'hindu'];
  const results = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCategories: 0,
      totalOrigins: 0,
      totalGenders: 0,
      totalThemes: 0,
      totalNamesAllReligions: 0
    },
    religions: []
  };
  
  for (const religion of religions) {
    try {
      const result = await testReligionFilters(religion);
      results.religions.push(result);
      
      // Add to summary
      results.summary.totalCategories += result.categories.totalUniqueWords;
      results.summary.totalOrigins += result.origins.totalUnique;
      results.summary.totalGenders += result.genders.totalUnique;
      results.summary.totalThemes += result.themes.totalUnique;
      results.summary.totalNamesAllReligions += result.totalNames;
      
    } catch (error) {
      console.error(`❌ Error testing ${religion}:`, error.message);
    }
  }
  
  // Calculate totals (sum of all counts)
  let totalCategoryCount = 0;
  let totalOriginCount = 0;
  
  for (const r of results.religions) {
    for (const c of r.categories.items) {
      totalCategoryCount += c.count;
    }
    for (const o of r.origins.items) {
      totalOriginCount += o.count;
    }
  }
  
  results.summary.totalCategoryWordOccurrences = totalCategoryCount;
  results.summary.totalOriginOccurrences = totalOriginCount;
  
  // Save to JSON file
  const fs = require('fs');
  const outputPath = './filter-counts-results.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('📈 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Names: ${results.summary.totalNamesAllReligions}`);
  console.log(`Total Category Words: ${results.summary.totalCategories} (${totalCategoryCount} total occurrences)`);
  console.log(`Total Origins: ${results.summary.totalOrigins} (${totalOriginCount} total occurrences)`);
  console.log(`Total Genders: ${results.summary.totalGenders}`);
  console.log(`Total Themes: ${results.summary.totalThemes}`);
  console.log(`\n✅ Results saved to: ${outputPath}`);
  
  await mongoose.disconnect();
  console.log('👋 MongoDB Disconnected');
  
  return results;
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal Error:', error);
  process.exit(1);
});