const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const namesController = require('./src/controllers/namesController');

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });
}

async function main() {
  await connectDB();

  console.log('=== Testing getFilters for christian ===\n');
  const filters = await namesController.getFilters('christian');

  console.log('Origins returned by getFilters:');
  filters.data.origins.forEach((o, i) => {
    console.log(`  ${i + 1}. "${o}"`);
  });

  const ChristianModel = require('./models/ChristianModel');

  // Count each origin properly (case-insensitive, after exclusion)
  console.log('\n--- Origin counts (case-insensitive, post-exclusion) ---');
  for (const origin of filters.data.origins) {
    const count = await ChristianModel.countDocuments({
      origin: { $regex: `^${origin}$`, $options: 'i' },
      $or: [
        { category: { $exists: false } },
        { category: { $size: 0 } },
        { category: { $not: { $regex: `\\badult\\b`, $options: 'i' } } }
      ]
    });
    const status = count > 100 ? '✅' : '❌';
    console.log(`  ${status} "${origin}": ${count} names`);
  }

  console.log('\n--- Category counts (case-insensitive, post-exclusion) ---');
  for (const cat of filters.data.categories) {
    const count = await ChristianModel.countDocuments({
      category: { $regex: `\\b${cat}\\b`, $options: 'i' },
      $or: [
        { category: { $exists: false } },
        { category: { $size: 0 } },
        { category: { $not: { $regex: `\\badult\\b`, $options: 'i' } } }
      ]
    });
    const status = count > 100 ? '✅' : '❌';
    console.log(`  ${status} "${cat}": ${count} names`);
  }

  console.log('\n--- Test: Names with adult category are excluded ---');
  const adultNames = await ChristianModel.find({
    category: { $regex: `\\badult\\b`, $options: 'i' }
  }).limit(5).lean();
  console.log(`  Names with 'adult' in category: ${adultNames.length}`);

  const result = await namesController.getNamesByReligion('christian', { limit: 50 });
  console.log(`  getNamesByReligion returned: ${result.count} names`);
  console.log(`  Filtered total count: ${result.pagination.totalCount}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
