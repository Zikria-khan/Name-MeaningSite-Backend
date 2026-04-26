const mongoose = require('mongoose');
const namesController = require('./src/controllers/namesController');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });

  console.log('Getting filters for Islamic religion');
  const filters = await namesController.getFilters('islamic');
  console.log('Available categories:', filters.data.categories.slice(0, 10));

  await mongoose.disconnect();
}
test();