# Nameverse API Documentation

## Introduction and Overview

Nameverse is a comprehensive REST API for name meanings, stories, and related content. The API provides access to authentic, research-backed data for Islamic, Christian, and Hindu names, including meanings, origins, numerology, and cultural significance.

**Base URL:** `https://name-meaning-site-backend.vercel.app/` (or your deployed URL)  
**Version:** v1  
**Protocol:** HTTPS  
**Format:** JSON

### Key Features
- Multi-religion name database (Islamic, Christian, Hindu)
- Advanced filtering and search capabilities
- Related and similar name suggestions
- Comprehensive name data including numerology and cultural context
- Pagination and sorting support
- RESTful design with consistent response formats

## Authentication

Currently, no authentication is required for API access. All endpoints are publicly accessible.

**Note:** Authentication may be added in future versions for premium features or rate limiting.

## Rate Limiting and Security

### Rate Limiting
No explicit rate limiting is currently implemented. However, the API uses:
- Express.js framework with built-in protections
- Helmet for security headers
- CORS configuration for cross-origin requests

### Security Features
- HTTPS enforced
- Helmet security middleware
- Input validation using Joi
- MongoDB injection protection
- Error handling that doesn't expose sensitive information

## Available Endpoints

### API Root
- **GET /** - API information and status

### Names API

#### List Names
- **GET /api/v1/names**
- **Description:** Get paginated list of names with optional filters
- **Parameters:**
  - `religion` (query, string, default: "islamic") - Religion: islamic, christian, hindu
  - `page` (query, number, default: 1) - Page number
  - `limit` (query, number, default: 50, max: 100) - Items per page
  - `gender` (query, string) - Filter by gender: male, female
  - `origin` (query, string) - Filter by origin
  - `startsWith` (query, string) - Filter names starting with letter
  - `search` (query, string) - Search query
  - `sort` (query, string, default: "asc") - Sort order: asc, desc, popular, trending, etc.
- **Response Format:**
```json
{
  "success": true,
  "religion": "islamic",
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalPages": 100,
    "totalCount": 5000,
    "hasMore": true
  },
  "filtersApplied": {
    "gender": null,
    "search": null,
    "origin": null,
    "startsWith": null,
    "length": null,
    "popularity": null,
    "trending": null,
    "sort": "asc"
  },
  "count": 50,
  "data": [...]
}
```
- **Error Responses:**
  - 400: Invalid religion parameter
  - 500: Database error

#### Search Names
- **GET /api/v1/names/search**
- **Description:** Search names across all religions or specific religion
- **Parameters:**
  - `q` (query, string, required, min: 2 chars) - Search query
  - `religion` (query, string) - Filter by religion: islamic, christian, hindu
  - `limit` (query, number, default: 20, max: 50) - Number of results
- **Response Format:** Same as list names
- **Error Responses:**
  - 400: Search query too short

#### Get Filters
- **GET /api/v1/names/:religion/filters**
- **Description:** Get available filters for a religion (genders, origins, letters, themes, categories)
- **Parameters:**
  - `religion` (path, string, required) - Religion: islamic, christian, hindu
- **Response Format:**
```json
{
  "success": true,
  "religion": "islamic",
  "data": {
    "letters": ["A", "B", "C", ...],
    "genders": ["male", "female"],
    "origins": ["Arabic", "Persian", ...],
    "themes": ["Strength", "Peace", ...],
    "categories": ["Prophet", "Companion", ...],
    "total_names": 5000
  }
}
```

#### Get Names by Letter
- **GET /api/v1/names/:religion/letter/:letter**
- **Description:** Get names starting with a specific letter
- **Parameters:**
  - `religion` (path, string, required) - Religion: islamic, christian, hindu
  - `letter` (path, string, required) - Starting letter (case-insensitive)
  - `limit` (query, number, default: 100, max: 150) - Number of results
- **Response Format:** Same as list names

#### Get Single Name
- **GET /api/v1/names/:religion/:slug**
- **Description:** Get detailed information for a specific name
- **Parameters:**
  - `religion` (path, string, required) - Religion: islamic, christian, hindu
  - `slug` (path, string, required) - Name slug
- **Response Format:**
```json
{
  "success": true,
  "data": {
    "name": "Muhammad",
    "slug": "muhammad",
    "gender": "male",
    "origin": "Arabic",
    "religion": "Islam",
    "short_meaning": "Praiseworthy",
    "long_meaning": "...",
    "lucky_number": 4,
    "lucky_colors": ["Green", "White"],
    // ... full name object
  }
}
```
- **Error Responses:**
  - 404: Name not found

#### Get Related Names
- **GET /api/v1/names/:religion/:slug/related**
- **Description:** Get related names based on origin and gender
- **Parameters:**
  - `religion` (path, string, required) - Religion: islamic, christian, hindu
  - `slug` (path, string, required) - Name slug
  - `limit` (query, number, default: 10, max: 20) - Number of results
- **Response Format:** Same as list names

#### Get Similar Names
- **GET /api/v1/names/:religion/:slug/similar**
- **Description:** Get similar names based on name pattern
- **Parameters:**
  - `religion` (path, string, required) - Religion: islamic, christian, hindu
  - `slug` (path, string, required) - Name slug
  - `limit` (query, number, default: 8, max: 20) - Number of results
- **Response Format:** Same as list names

### Health Check
- **GET /api/v1/health**
- **Description:** API health check endpoint
- **Response Format:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-04-24T21:05:51.000Z",
  "version": "1.0.0"
}
```

## Data Models/Schemas

### Islamic Name Model
```javascript
{
  name: String (unique, required),
  slug: String (required),
  language: [String],
  gender: String,
  origin: String,
  religion: String (default: "Islam"),
  category: [String],
  themes: [String],
  short_meaning: String,
  long_meaning: String,
  spiritual_meaning: String,
  emotional_traits: [String],
  hidden_personality_traits: [String],
  lucky_number: Number,
  lucky_day: String,
  lucky_colors: [String],
  lucky_stone: String,
  life_path_number: Number,
  numerology_meaning: String,
  in_arabic: { name: String, meaning: String, long_meaning: String },
  in_urdu: { name: String, meaning: String, long_meaning: String },
  in_hindi: { name: String, meaning: String, long_meaning: String },
  in_pashto: { name: String, meaning: String, long_meaning: String },
  in_english: { name: String, meaning: String, long_meaning: String },
  meanings_by_language: Map,
  pronunciation: { english: String, urdu: String, hindi: String, pashto: String, ipa: String },
  celebrity_usage: [String],
  related_names: [String],
  similar_sounding_names: [String],
  social_tags: [String],
  name_variations: [String],
  popularity_score: Number (0-100),
  popularity_by_region: [{ region: String, country_code: String, score: Number, rank: Number, year: Number }],
  seo: { title: String, meta_description: String, description_paragraph: String, faq: [{ q: String, a: String }] },
  share_options: { facebook: Boolean, whatsapp: Boolean, copy_button: Boolean }
}
```

### Christian Name Model
Similar structure adapted for Christian names.

### Hindu Name Model
Similar structure adapted for Hindu names.

## Filtering and Sorting Options

### Available Filters
- **gender:** male, female
- **origin:** Arabic, Persian, Hebrew, Sanskrit, etc.
- **startsWith:** Single letter
- **search:** Text search across name, meaning, origin
- **themes:** Strength, Peace, Love, etc.
- **categories:** Prophet, Companion, Deity, etc.

### Sorting Options
- **asc/a-z:** Alphabetical ascending
- **desc/z-a:** Alphabetical descending
- **popular/popularity:** By popularity score
- **trending:** By trending status
- **length-asc:** By name length ascending
- **length-desc:** By name length descending
- **newest:** By creation date descending
- **oldest:** By creation date ascending

## Pagination Details

All list endpoints support pagination:
- **page:** Page number (default: 1)
- **limit:** Items per page (default varies by endpoint, max 100-150)
- **Response includes:**
  - current page
  - limit
  - total pages
  - total count
  - hasMore flag

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Field-specific error"
    }
  ],
  "timestamp": "2024-04-24T21:05:51.000Z"
}
```

### Common Error Codes
- **400 Bad Request:** Validation errors, invalid parameters
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Server/database errors

### Error Types Handled
- Joi validation errors
- JWT authentication errors
- MongoDB duplicate key errors
- Mongoose validation/cast errors

## Code Examples

### JavaScript/Node.js

```javascript
// Get names with filters
const response = await fetch('https://name-meaning-site-backend.vercel.app//api/v1/names?religion=islamic&gender=male&page=1&limit=20');
const data = await response.json();

// Search names
const searchResponse = await fetch('https://name-meaning-site-backend.vercel.app//api/v1/names/search?q=muhammad&limit=10');
const searchData = await searchResponse.json();

// Get single name
const nameResponse = await fetch('https://name-meaning-site-backend.vercel.app//api/v1/names/islamic/muhammad');
const nameData = await nameResponse.json();

// Get filters
const filtersResponse = await fetch('https://name-meaning-site-backend.vercel.app//api/v1/names/islamic/filters');
const filtersData = await filtersResponse.json();
```

### Python

```python
import requests

# Get names
response = requests.get('https://name-meaning-site-backend.vercel.app//api/v1/names', 
                       params={'religion': 'islamic', 'page': 1, 'limit': 20})
data = response.json()

# Search names
search_response = requests.get('https://name-meaning-site-backend.vercel.app//api/v1/names/search', 
                              params={'q': 'fatima', 'religion': 'islamic'})
search_data = search_response.json()
```

### cURL

```bash
# Get names list
curl "https://name-meaning-site-backend.vercel.app//api/v1/names?religion=islamic&page=1&limit=10"

# Search names
curl "https://name-meaning-site-backend.vercel.app//api/v1/names/search?q=ahmed"

# Get single name
curl "https://name-meaning-site-backend.vercel.app//api/v1/names/islamic/ahmed"

# Get filters
curl "https://name-meaning-site-backend.vercel.app//api/v1/names/islamic/filters"

# Health check
curl "https://name-meaning-site-backend.vercel.app//api/v1/health"
```