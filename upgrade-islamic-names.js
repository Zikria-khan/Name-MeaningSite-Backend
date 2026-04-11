require('dotenv').config();
const mongoose = require('mongoose');
const IslamicModel = require('./models/IslamicModel');

async function upgradeIslamicNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const cursor = IslamicModel.find({}).cursor();
    let count = 0;

    for await (const name of cursor) {
      await IslamicModel.updateOne(
        { _id: name._id },
        {
          $set: {
            'seo_meta.title': `${name.name} Name Meaning in Arabic | Islam`,
            'seo_meta.description': `Discover the meaning of ${name.name}, a beautiful Islamic name. Learn about its origin and spiritual significance.`,
            'seo_meta.keywords': [name.name, 'Islamic name', 'Arabic origin'],
            'last_reviewed': new Date()
          }
        }
      );
      count++;
      if (count % 1000 === 0) console.log(`Processed ${count} names`);
    }

    console.log(`Upgraded ${count} Islamic names`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

upgradeIslamicNames();