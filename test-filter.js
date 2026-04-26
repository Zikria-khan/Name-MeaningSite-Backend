const mongoose = require('mongoose');
const namesController = require('./src/controllers/namesController');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });

  console.log('Testing category filter: Islamic Female');
  const result = await namesController.getNamesByReligion('islamic', {
    category: 'Islamic%20Female',
    limit: 5
  });
  console.log('Success:', result.success);
  console.log('Count:', result.data.length);
  if (result.data.length > 0) {
    console.log('First result:', result.data[0].name, result.data[0].category);
  }

  await mongoose.disconnect();
}
test();