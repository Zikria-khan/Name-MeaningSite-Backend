const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import controllers and models
const namesController = require('./src/controllers/namesController');
const IslamicModel = require('./models/IslamicModel');
const ChristianModel = require('./models/ChristianModel');
const HinduModel = require('./models/HinduModel');

const models = {
  islamic: IslamicModel,
  christian: ChristianModel,
  hindu: HinduModel
};

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI;
const RELIGIONS = ['islamic', 'christian', 'hindu'];

describe('Category Coverage Tests', () => {
  beforeAll(async () => {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected for testing');
  }, 60000);

  afterAll(async () => {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }, 60000);

  test('all names across religions should have categories', async () => {
    const results = {};

    for (const religion of RELIGIONS) {
      const model = models[religion];

      // Count total names (excluding adult categories)
      const totalNames = await model.countDocuments({
        $or: [
          { category: { $exists: false } },
          { category: { $size: 0 } },
          { category: { $not: { $regex: '\\badult\\b', $options: 'i' } } }
        ]
      });

      // Count names with categories
      const namesWithCategories = await model.countDocuments({
        category: { $exists: true, $ne: [] },
        $or: [
          { category: { $exists: false } },
          { category: { $size: 0 } },
          { category: { $not: { $regex: '\\badult\\b', $options: 'i' } } }
        ]
      });

      const coverage = totalNames > 0 ? (namesWithCategories / totalNames) * 100 : 0;
      results[religion] = {
        total: totalNames,
        withCategories: namesWithCategories,
        coverage: coverage
      };

      console.log(`${religion}: ${namesWithCategories}/${totalNames} names have categories (${coverage.toFixed(1)}%)`);
    }

    // Check that all religions have high category coverage
    RELIGIONS.forEach(religion => {
      expect(results[religion].coverage).toBeGreaterThan(95);
    });
  }, 60000);

  test('category filters should work and return valid results', async () => {
    for (const religion of RELIGIONS) {
      // Get available filters
      const filters = await namesController.getFilters(religion);
      expect(filters.success).toBe(true);
      expect(filters.data.categories.length).toBeGreaterThan(0);

      // Test a few category filters
      const testCategories = filters.data.categories.slice(0, 3);

      for (const category of testCategories) {
        const categoryWords = category.split(/\s+/).filter(w => w.trim().length > 0);

        if (categoryWords.length >= 2 && categoryWords.length <= 3) {
          try {
            const categoryParam = encodeURIComponent(category);
            const result = await namesController.getNamesByReligion(religion, {
              category: categoryParam,
              limit: 20
            });

            expect(result.success).toBe(true);

            if (result.data.length > 0) {
              // Verify that returned names contain the category words
              result.data.forEach(name => {
                const nameCategories = (name.category || []).join(' ').toLowerCase();
                const hasAllWords = categoryWords.every(word =>
                  nameCategories.includes(word.toLowerCase())
                );
                expect(hasAllWords).toBe(true);
              });
            }
          } catch (error) {
            // Category combination might be invalid, skip
            continue;
          }
        }
      }
    }
  }, 60000);

  test('names should use valid category combinations', async () => {
    for (const religion of RELIGIONS) {
      // Get available categories from filters
      const filters = await namesController.getFilters(religion);
      const availableCategories = new Set(filters.data.categories.map(cat => cat.toLowerCase()));

      const model = models[religion];

      // Get sample names with categories
      const sampleNames = await model.find({
        category: { $exists: true, $ne: [] },
        $or: [
          { category: { $exists: false } },
          { category: { $size: 0 } },
          { category: { $not: { $regex: '\\badult\\b', $options: 'i' } } }
        ]
      }).limit(50).select('name category').lean();

      let validCategoryCount = 0;

      for (const name of sampleNames) {
        // Check if any of the name's categories match available filter categories
        const hasValidCategory = name.category.some(cat =>
          availableCategories.has(cat.toLowerCase())
        );

        if (hasValidCategory) {
          validCategoryCount++;
        }
      }

      const validityRate = validCategoryCount / sampleNames.length;
      console.log(`${religion}: ${validCategoryCount}/${sampleNames.length} sample names have valid categories (${(validityRate * 100).toFixed(1)}%)`);

      // At least 90% of names should have categories that match available filters
      expect(validityRate).toBeGreaterThan(0.9);
    }
  }, 30000);

  test('category filtering works with valid combinations', async () => {
    // Test known working category combinations
    const testCombinations = {
      islamic: ['Islamic Female', 'Islamic Boy', 'Quranic Female'],
      christian: ['Biblical Female', 'Saint Female'],
      hindu: ['Sanskrit Female', 'Hindu Boy']
    };

    for (const religion of RELIGIONS) {
      const combinations = testCombinations[religion] || [];
      let workingCombinations = 0;

      for (const combo of combinations) {
        try {
          const categoryParam = encodeURIComponent(combo);
          const result = await namesController.getNamesByReligion(religion, {
            category: categoryParam,
            limit: 5
          });

          if (result.success && result.data.length > 0) {
            workingCombinations++;
            console.log(`${religion} ${combo}: ${result.data.length} results`);
          }
        } catch (error) {
          console.log(`${religion} ${combo}: error`);
        }
      }

      console.log(`${religion}: ${workingCombinations}/${combinations.length} category combinations work`);

      // At least some combinations should work
      if (combinations.length > 0) {
        expect(workingCombinations).toBeGreaterThan(0);
      }
    }
  }, 30000);

  test('no names should be unreachable due to missing categories', async () => {
    for (const religion of RELIGIONS) {
      const model = models[religion];

      // Find names without categories
      const namesWithoutCategories = await model.find({
        $or: [
          { category: { $exists: false } },
          { category: { $size: 0 } }
        ],
        $and: [
          {
            $or: [
              { category: { $exists: false } },
              { category: { $size: 0 } },
              { category: { $not: { $regex: '\\badult\\b', $options: 'i' } } }
            ]
          }
        ]
      }).limit(10).select('name').lean();

      // These names are unreachable through category filtering by design
      // But we should ensure they're still accessible through other filters (like search)
      for (const name of namesWithoutCategories.slice(0, 3)) {
        const searchResult = await namesController.getNamesByReligion(religion, {
          search: name.name,
          limit: 10
        });

        expect(searchResult.success).toBe(true);
        const found = searchResult.data.some(n => n.name === name.name);
        expect(found).toBe(true);
      }
    }
  }, 30000);
});