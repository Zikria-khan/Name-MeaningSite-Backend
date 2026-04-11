require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const ChristianModel = require('./models/ChristianModel');
const HinduModel = require('./models/HinduModel');
const IslamicModel = require('./models/IslamicModel');

async function fetchNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const christian = await ChristianModel.findOne().limit(1);
    const hindu = await HinduModel.findOne().limit(1);
    const islamic = await IslamicModel.findOne().limit(1);

    const data = {
      christian: christian,
      hindu: hindu,
      islamic: islamic
    };

    fs.writeFileSync('sample-names.json', JSON.stringify(data, null, 2));
    console.log('Data saved to sample-names.json');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchNames();