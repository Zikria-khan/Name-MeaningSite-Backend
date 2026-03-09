# Backend Archive Directory

This directory contains archived utility scripts and data files that are no longer part of the active backend.

## Contents

### Utility Scripts (JS Files)

These scripts were used for data processing, migration, and maintenance:

- `add.js` - Add records to database
- `checker.js` - Validate data integrity
- `migrate-articles.js` - Migrate articles
- `model.js` - Model configuration
- `patch.js` - Apply patches to records
- `prompt.js` - Generate AI prompts
- `putimages.js` - Upload and process images
- `query.js` - Execute custom queries
- `readyfiles.js` - Prepare data files
- `readyfiles2.js` - Prepare data files (variant)
- `seo.js` - Generate SEO metadata
- `seo1.js` - SEO optimization (variant)
- `seo2.js` - SEO optimization (variant)
- `spanish.js` - Spanish translation
- `theme.js` - Theme/styling data
- `third-update.js` - Third-party updates
- `translations.js` - Translation management
- `urdu-translate.js` - Urdu translation

### Data Files (JSON)

Processed name data and configuration:

- `processed_names1.json` - Islamic names (batch 1)
- `processed_names2.json` - Islamic names (batch 2)
- `processed_names3.json` - Islamic names (batch 3)
- `processed_names4.json` - Islamic names (batch 4)
- `processed_names5.json` - Islamic names (batch 5)
- `processed_christian_names1.json` - Christian names (batch 1)
- `processed_christian_names2.json` - Christian names (batch 2)
- `processed_christian_names3.json` - Christian names (batch 3)
- `processed_christian_names4.json` - Christian names (batch 4)
- `version.json` - Version information

### Logs

- `model_usage.log` - Model usage history

## How to Use Archived Files

If you need to run an archived script:

1. **Copy the script to root:**
   ```bash
   cp _archive/script-name.js .
   ```

2. **Update imports if needed:**
   ```javascript
   // Update paths to match current structure
   const Model = require('./models/IslamicModel');
   ```

3. **Run the script:**
   ```bash
   node script-name.js
   ```

4. **Move back to archive when done:**
   ```bash
   mv script-name.js _archive/
   ```

## Important Notes

- **Data is in MongoDB** - JSON files are for reference only
- **Use API endpoints** - Instead of running scripts directly
- **Keep scripts archived** - To maintain clean root directory
- **Don't delete** - Keep for historical reference

## Recommended Alternatives

| Old Script | Use Instead |
|-----------|------------|
| `add.js` | `POST /api/names` |
| `checker.js` | Database validation |
| `patch.js` | `PUT /api/names/:id` |
| `query.js` | MongoDB Compass |
| `seo.js` | SEO data in schema |
| `translations.js` | Translation API |
| `putimages.js` | Image upload API |

---

**Last Updated:** December 5, 2025
