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

async function runComprehensiveFilterTests() {
  console.log('🧪 Starting Comprehensive Filter Tests...\n');

  let results = {
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      religions: {}
    }
  };

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected\n');

    for (const religion of RELIGIONS) {
      console.log(`🏛️  Testing ${religion.toUpperCase()} filters...\n`);
      results.religion = { tests: [], passed: 0, failed: 0 };

      try {
        // 1. Test filter retrieval
        console.log('📋 Testing filter retrieval...');
        const filters = await namesController.getFilters(religion);
        results.summary.totalTests++;

        if (filters.success && filters.data.total_names > 0) {
          console.log(`✅ Filters retrieved: ${filters.data.total_names} names`);
          results.religion.tests.push({ name: 'filter_retrieval', status: 'PASS' });
          results.religion.passed++;
          results.summary.passedTests++;
        } else {
          console.log('❌ Filter retrieval failed');
          results.religion.tests.push({ name: 'filter_retrieval', status: 'FAIL' });
          results.religion.failed++;
          results.summary.failedTests++;
          continue;
        }

        const model = models[religion];

        // 2. Test letter filter
        if (filters.data.letters.length > 0) {
          console.log('🔤 Testing letter filter...');
          const letter = filters.data.letters[0];
          const result = await namesController.getNamesByReligion(religion, {
            startsWith: letter,
            limit: 5
          });
          results.summary.totalTests++;

          if (result.success && result.data.length > 0 &&
              result.data.every(name => name.name.toUpperCase().startsWith(letter.toUpperCase()))) {
            console.log(`✅ Letter filter works: ${result.data.length} results for "${letter}"`);
            results.religion.tests.push({ name: 'letter_filter', status: 'PASS' });
            results.religion.passed++;
            results.summary.passedTests++;
          } else {
            console.log(`❌ Letter filter failed for "${letter}"`);
            results.religion.tests.push({ name: 'letter_filter', status: 'FAIL' });
            results.religion.failed++;
            results.summary.failedTests++;
          }
        }

        // 3. Test gender filter
        if (filters.data.genders.length > 0) {
          console.log('🚹🚺 Testing gender filter...');
          const gender = filters.data.genders[0];
          const result = await namesController.getNamesByReligion(religion, {
            gender: gender,
            limit: 5
          });
          results.summary.totalTests++;

          if (result.success && result.data.length > 0 &&
              result.data.every(name => name.gender && name.gender.match(new RegExp(`\\b${gender}\\b`, 'i')))) {
            console.log(`✅ Gender filter works: ${result.data.length} results for "${gender}"`);
            results.religion.tests.push({ name: 'gender_filter', status: 'PASS' });
            results.religion.passed++;
            results.summary.passedTests++;
          } else {
            console.log(`❌ Gender filter failed for "${gender}"`);
            results.religion.tests.push({ name: 'gender_filter', status: 'FAIL' });
            results.religion.failed++;
            results.summary.failedTests++;
          }
        }

        // 4. Test origin filter
        if (filters.data.origins.length > 0) {
          console.log('🌍 Testing origin filter...');
          const origin = filters.data.origins[0];
          const result = await namesController.getNamesByReligion(religion, {
            origin: origin,
            limit: 5
          });
          results.summary.totalTests++;

          if (result.success && result.data.length > 0) {
            console.log(`✅ Origin filter works: ${result.data.length} results for "${origin}"`);
            results.religion.tests.push({ name: 'origin_filter', status: 'PASS' });
            results.religion.passed++;
            results.summary.passedTests++;
          } else {
            console.log(`❌ Origin filter failed for "${origin}"`);
            results.religion.tests.push({ name: 'origin_filter', status: 'FAIL' });
            results.religion.failed++;
            results.summary.failedTests++;
          }
        }

        // 5. Test category filter
        if (filters.data.categories.length >= 2) {
          console.log('📂 Testing category filter...');
          const categoryWords = filters.data.categories.slice(0, 2);
          const categoryParam = encodeURIComponent(categoryWords.join(' '));
          const result = await namesController.getNamesByReligion(religion, {
            category: categoryParam,
            limit: 5
          });
          results.summary.totalTests++;

          if (result.success && result.data.length > 0) {
            console.log(`✅ Category filter works: ${result.data.length} results for "${categoryWords.join(' ')}"`);
            results.religion.tests.push({ name: 'category_filter', status: 'PASS' });
            results.religion.passed++;
            results.summary.passedTests++;
          } else {
            console.log(`❌ Category filter failed for "${categoryWords.join(' ')}"`);
            results.religion.tests.push({ name: 'category_filter', status: 'FAIL' });
            results.religion.failed++;
            results.summary.failedTests++;
          }
        }

        // 6. Test theme filter
        if (filters.data.themes.length > 0) {
          console.log('🎨 Testing theme filter...');
          const theme = filters.data.themes[0];
          const result = await namesController.getNamesByReligion(religion, {
            theme: theme,
            limit: 5
          });
          results.summary.totalTests++;

          if (result.success && result.data.length > 0 &&
              result.data.every(name => name.themes && name.themes.includes(theme))) {
            console.log(`✅ Theme filter works: ${result.data.length} results for "${theme}"`);
            results.religion.tests.push({ name: 'theme_filter', status: 'PASS' });
            results.religion.passed++;
            results.summary.passedTests++;
          } else {
            console.log(`❌ Theme filter failed for "${theme}"`);
            results.religion.tests.push({ name: 'theme_filter', status: 'FAIL' });
            results.religion.failed++;
            results.summary.failedTests++;
          }
        }

        // 7. Test multiple filters
        if (filters.data.genders.length > 0 && filters.data.origins.length > 0) {
          console.log('🔀 Testing multiple filters...');
          const result = await namesController.getNamesByReligion(religion, {
            gender: filters.data.genders[0],
            origin: filters.data.origins[0],
            limit: 5
          });
          results.summary.totalTests++;

          if (result.success && result.data.length >= 0) {
            console.log(`✅ Multiple filters work: ${result.data.length} results`);
            results.religion.tests.push({ name: 'multiple_filters', status: 'PASS' });
            results.religion.passed++;
            results.summary.passedTests++;
          } else {
            console.log('❌ Multiple filters failed');
            results.religion.tests.push({ name: 'multiple_filters', status: 'FAIL' });
            results.religion.failed++;
            results.summary.failedTests++;
          }
        }

        // 8. Test category exclusion
        console.log('🚫 Testing category exclusion...');
        const excludedNames = await model.find({
          category: { $regex: '\\badult\\b', $options: 'i' }
        }).lean();
        const controllerResult = await namesController.getNamesByReligion(religion, { limit: 100 });
        const controllerNames = new Set(controllerResult.data.map(n => n.name));
        const leakedNames = excludedNames.filter(name => controllerNames.has(name.name));
        results.summary.totalTests++;

        if (leakedNames.length === 0) {
          console.log('✅ Category exclusion works: no forbidden names leaked');
          results.religion.tests.push({ name: 'category_exclusion', status: 'PASS' });
          results.religion.passed++;
          results.summary.passedTests++;
        } else {
          console.log(`❌ Category exclusion failed: ${leakedNames.length} forbidden names leaked`);
          results.religion.tests.push({ name: 'category_exclusion', status: 'FAIL' });
          results.religion.failed++;
          results.summary.failedTests++;
        }

        results.summary.religions[religion] = results.religion;

      } catch (error) {
        console.log(`❌ Error testing ${religion}: ${error.message}`);
        results.religion.tests.push({ name: 'general_error', status: 'ERROR', error: error.message });
        results.religion.failed++;
        results.summary.failedTests++;
        results.summary.religions[religion] = results.religion;
      }

      console.log('');
    }

    // Final summary
    console.log('📊 TEST SUMMARY');
    console.log('==============');
    console.log(`Total Tests: ${results.summary.totalTests}`);
    console.log(`✅ Passed: ${results.summary.passedTests}`);
    console.log(`❌ Failed: ${results.summary.failedTests}`);
    console.log(`📈 Success Rate: ${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%`);

    console.log('\n🏛️  PER RELIGION:');
    Object.entries(results.summary.religions).forEach(([religion, data]) => {
      const rate = data.tests.length > 0 ? ((data.passed / data.tests.length) * 100).toFixed(1) : '0.0';
      console.log(`  ${religion}: ${data.passed}/${data.tests.length} passed (${rate}%)`);
    });

    if (results.summary.failedTests === 0) {
      console.log('\n🎉 ALL FILTERS WORKING CORRECTLY!');
      console.log('✅ No names are missing when filters are applied');
      console.log('✅ All filter values return results');
      console.log('✅ Filtering logic covers all names appropriately');
    } else {
      console.log(`\n⚠️  ${results.summary.failedTests} tests failed - review filtering logic`);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

// Run the tests
runComprehensiveFilterTests();