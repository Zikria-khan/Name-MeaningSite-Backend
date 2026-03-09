#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

// Flexible schema that accepts all fields
const nameSchema = new mongoose.Schema({}, { 
  strict: false,
  timestamps: true,
  collection: null // Will be set per model
});

let ChristianName, HinduName, IslamicName;

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         📤 PUSHING ENHANCED DATA TO MONGODB                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected!\n');

    // Create models
    ChristianName = mongoose.model('ChristianName', nameSchema, 'christian_names');
    HinduName = mongoose.model('HinduName', nameSchema, 'hindu_names');
    IslamicName = mongoose.model('IslamicName', nameSchema, 'islamic_names');

    const configs = [
      {
        name: 'Christian',
        file: 'christian/merged_names.json',
        model: ChristianName
      },
      {
        name: 'Hindu',
        file: 'hindu/merged_names.json',
        model: HinduName
      },
      {
        name: 'Islamic',
        file: 'islamic/merged_names.json',
        model: IslamicName
      }
    ];

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    // Process each religion
    for (const config of configs) {
      console.log(`\n📖 Pushing ${config.name} names...`);
      const filePath = path.join(__dirname, config.file);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        continue;
      }

      // Read and parse JSON
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`  📊 Found ${data.length} entries to process`);

      // Batch processing
      const batchSize = 50;
      let created = 0;
      let updated = 0;
      let errors = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, Math.min(i + batchSize, data.length));

        try {
          const result = await config.model.bulkWrite(
            batch.map(entry => ({
              updateOne: {
                filter: { name: entry.name },
                update: { $set: entry },
                upsert: true
              }
            }))
          );

          created += result.upsertedCount || 0;
          updated += result.modifiedCount || 0;

          if ((i + batchSize) % 500 === 0 || (i + batchSize) >= data.length) {
            const progress = Math.min(i + batchSize, data.length);
            process.stdout.write(`  ✓ Progress: ${progress}/${data.length}\r`);
          }
        } catch (err) {
          console.error(`  ❌ Error in batch: ${err.message}`);
          errors += batch.length;
        }
      }

      console.log(`\n  ✅ ${config.name} Complete:`);
      console.log(`     Created: ${created} | Updated: ${updated} | Errors: ${errors}`);
      
      totalCreated += created;
      totalUpdated += updated;
      totalErrors += errors;
    }

    // Final verification
    console.log(`\n\n📊 VERIFYING DATA IN DATABASE...\n`);
    
    const christianCount = await ChristianName.countDocuments();
    const hinduCount = await HinduName.countDocuments();
    const islamicCount = await IslamicName.countDocuments();

    console.log(`Christian Names: ${christianCount}`);
    console.log(`Hindu Names: ${hinduCount}`);
    console.log(`Islamic Names: ${islamicCount}`);
    console.log(`Total: ${christianCount + hinduCount + islamicCount}\n`);

    console.log('═'.repeat(64));
    console.log('IMPORT SUMMARY:');
    console.log(`  Created: ${totalCreated}`);
    console.log(`  Updated: ${totalUpdated}`);
    console.log(`  Errors: ${totalErrors}`);
    console.log(`  Total Processed: ${totalCreated + totalUpdated}`);
    console.log('═'.repeat(64));

    if (totalErrors === 0) {
      console.log('\n✨ ✅ ALL DATA SUCCESSFULLY PUSHED TO DATABASE! ✅ ✨\n');
    } else {
      console.log(`\n⚠️  Completed with ${totalErrors} error(s)\n`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

main();
