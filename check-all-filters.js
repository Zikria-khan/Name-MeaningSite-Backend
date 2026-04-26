const mongoose = require('mongoose');
const namesController = require('./src/controllers/namesController');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });

  console.log('Getting all filters for Islamic religion');
  const filters = await namesController.getFilters('islamic');
  console.log('Total categories:', filters.data.categories.length);
  console.log('All categories:', filters.data.categories);

  await mongoose.disconnect();
}
test();