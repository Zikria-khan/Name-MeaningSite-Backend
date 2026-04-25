const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const namesController = require('./src/controllers/namesController');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });
  console.log('MongoDB connected');
}

async function testFilters() {
  try {
    await connectDB();
    const religions = ['islamic', 'christian', 'hindu'];
    const allResults = {};

    for (const religion of religions) {
      console.log(`\n========== Testing ${religion} ==========`);

      // 1. Test getFilters
      console.log(`\n--- getFilters for ${religion} ---`);
      const filters = await namesController.getFilters(religion);
      console.log(`Total names (after exclusion): ${filters.data.total_names}`);
      console.log(`Letters count: ${filters.data.letters.length}`);
      console.log(`Genders: [${filters.data.genders.join(', ')}]`);
      console.log(`Origins count: ${filters.data.origins.length}`);
      console.log(`Themes count: ${filters.data.themes.length}`);
      console.log(`Categories count: ${filters.data.categories.length}`);
      console.log(`Categories: [${filters.data.categories.slice(0, 10).join(', ')}${filters.data.categories.length > 10 ? '...' : ''}]`);

      // Save filters result
      allResults[`${religion}_filters`] = filters.data;

      // 2. Verify each filter value has >100 names by spot-checking with aggregation
      console.log(`\n--- Verifying filter counts for ${religion} ---`);

      const modelName = religion.charAt(0).toUpperCase() + religion.slice(1);
      const Model = require(`./models/${modelName}Model`);

      // Check a sample category count
      if (filters.data.categories.length > 0) {
        const sampleCategory = filters.data.categories[0];
        const catCount = await Model.countDocuments({
          category: { $regex: `\\b${sampleCategory}\\b`, $options: 'i' },
          $or: [
            { category: { $exists: false } },
            { category: { $size: 0 } },
            { category: { $not: { $regex: `\\badult\\b`, $options: 'i' } } }
          ]
        });
        console.log(`Sample category "${sampleCategory}" count: ${catCount} (should be > 100)`);
      }

      // Check a sample origin count
      if (filters.data.origins.length > 0) {
        const sampleOrigin = filters.data.origins[0];
        const origCount = await Model.countDocuments({
          origin: { $regex: `^${sampleOrigin}$`, $options: 'i' },
          $or: [
            { category: { $exists: false } },
            { category: { $size: 0 } },
            { category: { $not: { $regex: `\\badult\\b`, $options: 'i' } } }
          ]
        });
        console.log(`Sample origin "${sampleOrigin}" count: ${origCount} (should be > 100)`);
      }

      // 3. Test that names with "adult" in category are excluded from getNamesByReligion
      console.log(`\n--- Testing category word exclusion for ${religion} ---`);
      const adultNames = await Model.find({
        category: { $regex: `\\badult\\b`, $options: 'i' }
      }).limit(5).lean();

      console.log(`Names with 'adult' category found in DB: ${adultNames.length}`);
      if (adultNames.length > 0) {
        console.log(`Sample adult-tagged names: [${adultNames.map(n => n.name).join(', ')}]`);
      }

      // Fetch names with default exclusion
      const namesResult = await namesController.getNamesByReligion(religion, { limit: 100 });
      const fetchedNames = namesResult.data.map(n => n.name);

      // Check if any adult-tagged names leaked through
      const leaked = adultNames.filter(n => fetchedNames.includes(n.name));
      if (leaked.length > 0) {
        console.log(`❌ LEAKED adult names in getNamesByReligion: [${leaked.map(n => n.name).join(', ')}]`);
      } else {
        console.log(`✅ No adult-tagged names leaked into getNamesByReligion results`);
      }

      // 4. Test getNamesByReligion with explicit excludeCategoryWords
      console.log(`\n--- Testing custom exclusion words for ${religion} ---`);
      const customResult = await namesController.getNamesByReligion(religion, {
        limit: 50,
        excludeCategoryWords: ['adult', 'test']
      });
      console.log(`Custom exclusion returned ${customResult.count} names`);

      allResults[`${religion}_names_test`] = {
        adultTaggedNamesInDB: adultNames.map(n => n.name),
        leakedAdultNames: leaked.map(n => n.name),
        defaultExclusionCount: namesResult.count,
        customExclusionCount: customResult.count
      };
    }

    // Save all results
    fs.writeFileSync('filters_test_results.json', JSON.stringify(allResults, null, 2));
    console.log('\n✅ All tests completed. Results saved to filters_test_results.json');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testFilters();
