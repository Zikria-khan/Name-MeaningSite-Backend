require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const IslamicModel = require('./models/IslamicModel');

async function exportAllIslamicNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const names = await IslamicModel.find({});
    console.log(`Found ${names.length} Islamic names`);

    fs.writeFileSync('all-islamic-names.json', JSON.stringify(names, null, 2));
    console.log('All Islamic names exported to all-islamic-names.json');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

exportAllIslamicNames();