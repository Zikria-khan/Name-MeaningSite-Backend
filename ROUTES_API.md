# Nameverse API Routes Documentation

## Names Routes

### 1. Get Names by Religion (with Filters)
```
GET /api/v1/names/:religion
```
Get paginated list of names for a specific religion with optional filters.

**Parameters:**
- `religion` (path, required): `islamic` | `christian` | `hindu`

**Query Parameters:**
| Param | Type | Description | Default |
|-------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Items per page (max: 100) | 50 |
| `gender` | string | Filter by gender: `Male`, `Female`, `Unisex` | - |
| `origin` | string | Filter by origin: `Arabic`, `Persian`, `Urdu`, etc. | - |
| `category` | string | Filter by category | - |
| `theme` | string | Filter by theme | - |
| `startsWith` | string | Filter names starting with letter | - |
| `search` | string | Search query (searches name, meaning, origin) | - |
| `sort` | string | Sort order: `asc`, `desc`, `popular`, `trending` | `asc` |

**Example Request:**
```bash
curl "http://localhost:5000/api/v1/names/islamic?gender=Male&origin=Arabic&limit=10&sort=popular"
```

**Example Response:**
```json
{
  "success": true,
  "religion": "islamic",
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 563,
    "totalCount": 5626,
    "hasMore": true
  },
  "filtersApplied": {
    "gender": "Male",
    "origin": "Arabic",
    "category": null,
    "theme": null,
    "search": null,
    "startsWith": null,
    "length": null,
    "popularity": null,
    "trending": null,
    "sort": "popular"
  },
  "count": 10,
  "data": [...names]
}
```

---

### 2. Get Available Filters
```
GET /api/v1/names/:religion/filters
```
Get all available filter options for a religion (cleaned single-word values).

**Parameters:**
- `religion` (path, required): `islamic` | `christian` | `hindu`

**Example Request:**
```bash
curl "http://localhost:5000/api/v1/names/islamic/filters"
```

**Example Response:**
```json
{
  "success": true,
  "religion": "islamic",
  "data": {
    "letters": ["A", "B", "C", "D", ...],
    "genders": ["Female", "Genderless", "Girl", "Male", "Unisex", "أنثى", "مذكر"],
    "origins": ["Afghanistan", "African", "Arabic", "Biblical", "Persian", "Urdu", ...],
    "themes": [],
    "categories": ["Abundance", "Adventure", "Allah", "Angel", "Beautiful", ...],
    "total_names": 18692
  }
}
```

---

### 3. Search Names
```
GET /api/v1/names/search?q={query}&religion={religion}&limit={limit}
```
Search names across all or specific religion.

**Query Parameters:**
| Param | Type | Description | Default |
|-------|------|-------------|---------|
| `q` | string | Search query (required, min: 2 chars) | - |
| `religion` | string | Filter by religion | `islamic` |
| `limit` | number | Max results (max: 50) | 20 |

**Example Request:**
```bash
curl "http://localhost:5000/api/v1/names/search?q=Ali&limit=5"
```

---

### 4. Get Names by Letter
```
GET /api/v1/names/:religion/letter/:letter
```
Get names starting with a specific letter.

**Parameters:**
- `religion` (path, required): `islamic` | `christian` | `hindu`
- `letter` (path, required): Single letter (e.g., `A`, `B`)

**Query Parameters:**
| Param | Type | Description | Default |
|-------|------|-------------|---------|
| `limit` | number | Max results (max: 150) | 100 |

**Example Request:**
```bash
curl "http://localhost:5000/api/v1/names/islamic/letter/A?limit=10"
```

---

### 5. Get Single Name by Slug
```
GET /api/v1/names/:religion/:slug
```
Get detailed information about a specific name.

**Parameters:**
- `religion` (path, required): `islamic` | `christian` | `hindu`
- `slug` (path, required): Name slug (e.g., `ali`, `muhammad`)

**Example Request:**
```bash
curl "http://localhost:5000/api/v1/names/islamic/ali"
```

---

### 6. Get Related Names
```
GET /api/v1/names/:religion/:slug/related
```
Get names related by origin or gender.

**Example Request:**
```bash
curl "http://localhost:5000/api/v1/names/islamic/ali/related"
```

---

### 7. Get Similar Names
```
GET /api/v1/names/:religion/:slug/similar
```
Get names similar by starting letter and length.

**Example Request:**
```bash
curl "http://localhost:5000/api/v1/names/islamic/ali/similar"
```

---

## Filter Values (Cleaned)

All filter values are now normalized to single clean words:

### Genders Example:
```
["Female", "Genderless", "Girl", "Male", "masculine", "neuter", "Neutral", "Unisex", "أنثى", "مذكر"]
```

### Origins Example:
```
["Afghanistan", "African", "Arabic", "Armenian", "Bengali", "Biblical", "Chinese", "Egyptian", "English", "Hebrew", "Hindi", "Indian", "Iranian", "Islamic", "Japanese", "Persian", "Russian", "Sanskrit", "Turkish", "Urdu", ...]
```

### Categories Example:
```
["Abundance", "Adventure", "Allah", "Angel", "Beautiful", "Blessing", "Brave", "Bright", "Compassion", "Courage", "Divine", "Dreams", "Faith", "Flower", "Freedom", "Garden", "Gift", "God", "Grace", "Happiness", "Heaven", "Hope", "Islamic", "Joy", "Justice", "Kindness", "Knowledge", "Light", "Love", "Loyalty", "Mercy", "Moon", "Noble", "Peace", "Power", "Prophet", "Pure", "Quranic", "Sacred", "Spiritual", "Star", "Strength", "Success", "Sun", "Trust", "Truth", "Victory", "Warrior", "Water", "Wisdom", ...]
```
