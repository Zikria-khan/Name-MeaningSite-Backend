const mongoose = require('mongoose');
const IslamicModel = require('./models/IslamicModel');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const names = await IslamicModel.find({category: {$exists: true, $ne: []}}).limit(5).select('name category').lean();
  console.log('Sample names with categories:');
  names.forEach(n => console.log(`${n.name}: ${JSON.stringify(n.category)}`));
  await mongoose.disconnect();
}
test();