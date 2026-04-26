const mongoose = require('mongoose');
const fs = require('fs');
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

// Store test results for JSON export
const testResults = {
  testRunDate: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  },
  filters: {},
  filterTests: {},
  errors: []
};

describe('Filter Comprehensive Tests', () => {
  beforeAll(async () => {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected for testing');
  }, 60000);

  afterAll(async () => {
    // Save test results to JSON file
    fs.writeFileSync(
      path.join(__dirname, 'test-filters-results.json'),
      JSON.stringify(testResults, null, 2)
    );
    console.log('Test results saved to test-filters-results.json');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }, 60000);

  describe.each(RELIGIONS)('Filter Tests for %s religion', (religion) => {
    let filters;
    let model;

    beforeAll(async () => {
      // Get available filters for this religion
      filters = await namesController.getFilters(religion);
      model = models[religion];
    }, 30000);

    test('should retrieve filters successfully', () => {
      expect(filters.success).toBe(true);
      expect(filters.religion).toBe(religion);
      expect(filters.data).toHaveProperty('letters');
      expect(filters.data).toHaveProperty('genders');
      expect(filters.data).toHaveProperty('origins');
      expect(filters.data).toHaveProperty('categories');
      expect(filters.data).toHaveProperty('themes');
      expect(filters.data).toHaveProperty('total_names');
      expect(filters.data.total_names).toBeGreaterThan(0);
    });

    test('should return results for first letter filter', async () => {
      if (filters.data.letters.length > 0) {
        const letter = filters.data.letters[0];
        const result = await namesController.getNamesByReligion(religion, {
          startsWith: letter,
          limit: 10
        });

        expect(result.success).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        // Verify all returned names start with the letter
        result.data.forEach(name => {
          expect(name.name.toUpperCase().startsWith(letter.toUpperCase())).toBe(true);
        });

        // Verify count matches direct database query
        const directCount = await model.countDocuments({
          name: { $regex: `^${letter}`, $options: 'i' },
          $or: [
            { category: { $exists: false } },
            { category: { $size: 0 } },
            { category: { $not: { $regex: '\\badult\\b', $options: 'i' } } }
          ]
        });

        expect(result.pagination.totalCount).toBe(directCount);
      }
    }, 10000);

    test('should return results for first gender filter', async () => {
      if (filters.data.genders.length > 0) {
        const gender = filters.data.genders[0];
        const result = await namesController.getNamesByReligion(religion, {
          gender: gender,
          limit: 10
        });

        expect(result.success).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        // Verify all returned names have the correct gender
        result.data.forEach(name => {
          expect(name.gender).toMatch(new RegExp(`\\b${gender}\\b`, 'i'));
        });

        // Verify count matches direct database query
        const directCount = await model.countDocuments({
          gender: { $regex: `\\b${gender}\\b`, $options: 'i' },
          $or: [
            { category: { $exists: false } },
            { category: { $size: 0 } },
            { category: { $not: { $regex: '\\badult\\b', $options: 'i' } } }
          ]
        });

        expect(result.pagination.totalCount).toBe(directCount);
      }
    }, 10000);

    test('should return results for first origin filter', async () => {
      if (filters.data.origins.length > 0) {
        const origin = filters.data.origins[0];
        const result = await namesController.getNamesByReligion(religion, {
          origin: origin,
          limit: 10
        });

        expect(result.success).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        // Verify all returned names have the correct origin
        result.data.forEach(name => {
          expect(name.origin).toMatch(new RegExp(`\\b${origin}\\b`, 'i'));
        });

        // Verify count matches direct database query
        const directCount = await model.countDocuments({
          origin: { $regex: `\\b${origin}\\b`, $options: 'i' },
          $or: [
            { category: { $exists: false } },
            { category: { $size: 0 } },
            { category: { $not: { $regex: '\\badult\\b', $options: 'i' } } }
          ]
        });

        expect(result.pagination.totalCount).toBe(directCount);
      }
    }, 10000);

    test('should return results for category filter with 2-3 words', async () => {
      if (filters.data.categories.length >= 2) {
        // Create a category filter with 2 words
        const categoryWords = filters.data.categories.slice(0, 2);
        const categoryParam = encodeURIComponent(categoryWords.join(' '));
        const result = await namesController.getNamesByReligion(religion, {
          category: categoryParam,
          limit: 10
        });

        expect(result.success).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        // Verify all returned names contain all the category words
        result.data.forEach(name => {
          categoryWords.forEach(word => {
            const categoryMatch = name.category && name.category.some(cat =>
              cat.toLowerCase().includes(word.toLowerCase())
            );
            expect(categoryMatch).toBe(true);
          });
        });

        // Verify count matches direct database query
        const queryConditions = categoryWords.map(word => ({
          category: { $regex: `\\b${word}\\b`, $options: 'i' }
        }));

        const directCount = await model.countDocuments({
          $and: queryConditions.concat([
            {
              $or: [
                { category: { $exists: false } },
                { category: { $size: 0 } },
                { category: { $not: { $regex: '\\badult\\b', $options: 'i' } } }
              ]
            }
          ])
        });

        expect(result.pagination.totalCount).toBe(directCount);
      }
    }, 10000);

    test('should return results for first theme filter', async () => {
      if (filters.data.themes.length > 0) {
        const theme = filters.data.themes[0];
        const result = await namesController.getNamesByReligion(religion, {
          theme: theme,
          limit: 10
        });

        expect(result.success).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        // Verify all returned names contain the theme
        result.data.forEach(name => {
          expect(name.themes).toContain(theme);
        });

        // Verify count matches direct database query
        const directCount = await model.countDocuments({
          themes: { $regex: theme, $options: 'i' },
          $or: [
            { category: { $exists: false } },
            { category: { $size: 0 } },
            { category: { $not: { $regex: '\\badult\\b', $options: 'i' } } }
          ]
        });

        expect(result.pagination.totalCount).toBe(directCount);
      }
    }, 10000);

    test('should handle multiple filters correctly', async () => {
      if (filters.data.genders.length > 0 && filters.data.origins.length > 0) {
        const result = await namesController.getNamesByReligion(religion, {
          gender: filters.data.genders[0],
          origin: filters.data.origins[0],
          limit: 10
        });

        expect(result.success).toBe(true);

        // Verify all results match both filters
        result.data.forEach(name => {
          expect(name.gender).toMatch(new RegExp(`\\b${filters.data.genders[0]}\\b`, 'i'));
          expect(name.origin).toMatch(new RegExp(`\\b${filters.data.origins[0]}\\b`, 'i'));
        });

        // Verify count matches direct database query
        const directCount = await model.countDocuments({
          gender: { $regex: `\\b${filters.data.genders[0]}\\b`, $options: 'i' },
          origin: { $regex: `\\b${filters.data.origins[0]}\\b`, $options: 'i' },
          $or: [
            { category: { $exists: false } },
            { category: { $size: 0 } },
            { category: { $not: { $regex: '\\badult\\b', $options: 'i' } } }
          ]
        });

        expect(result.pagination.totalCount).toBe(directCount);
      }
    }, 10000);

    test('should not miss names when applying filters', async () => {
      // Test pagination - ensure all names are accessible
      const page1 = await namesController.getNamesByReligion(religion, { limit: 50, page: 1 });
      const page2 = await namesController.getNamesByReligion(religion, { limit: 50, page: 2 });

      expect(page1.success).toBe(true);
      expect(page2.success).toBe(true);

      // Ensure no overlap between pages
      const page1Names = new Set(page1.data.map(n => n.name));
      const page2Names = new Set(page2.data.map(n => n.name));
      const overlap = [...page1Names].filter(name => page2Names.has(name));

      expect(overlap.length).toBe(0);

      // Test with sorting - ensure both asc and desc work
      const ascResult = await namesController.getNamesByReligion(religion, {
        limit: 100,
        sort: 'asc'
      });
      const descResult = await namesController.getNamesByReligion(religion, {
        limit: 100,
        sort: 'desc'
      });

      expect(ascResult.success).toBe(true);
      expect(descResult.success).toBe(true);

      // Check that first names are correctly ordered
      expect(ascResult.data[0].name.toLowerCase() <= ascResult.data[1].name.toLowerCase()).toBe(true);
      expect(descResult.data[0].name.toLowerCase() >= descResult.data[1].name.toLowerCase()).toBe(true);
    }, 15000);

    test('should exclude names with forbidden category words', async () => {
      // Get names that should be excluded
      const excludedNames = await model.find({
        category: { $regex: '\\badult\\b', $options: 'i' }
      }).lean();

      if (excludedNames.length > 0) {
        // Get names via controller
        const controllerResult = await namesController.getNamesByReligion(religion, { limit: 1000 });
        const controllerNames = new Set(controllerResult.data.map(n => n.name));

        // Check that no excluded names are in the results
        const leakedNames = excludedNames.filter(name => controllerNames.has(name.name));
        expect(leakedNames.length).toBe(0);
      }
    }, 10000);
  });

  test('should have consistent filter structure across religions', async () => {
    const results = {};

    for (const religion of RELIGIONS) {
      results[religion] = await namesController.getFilters(religion);
    }

    // All should have the same structure
    RELIGIONS.forEach(religion => {
      expect(results[religion].success).toBe(true);
      expect(results[religion].data).toHaveProperty('letters');
      expect(results[religion].data).toHaveProperty('genders');
      expect(results[religion].data).toHaveProperty('origins');
      expect(results[religion].data).toHaveProperty('categories');
      expect(results[religion].data).toHaveProperty('themes');
      expect(results[religion].data).toHaveProperty('total_names');
    });
  }, 60000);
});