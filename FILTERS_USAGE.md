# Frontend filter usage for Nameverse API

This document explains how to use the name filtering API from the frontend.
It is designed for the current backend routes in `src/routes/api/v1/names.js`.

## Endpoints

### 1. Get available filters

`GET /api/v1/names/:religion/filters`

- `:religion` must be one of: `islamic`, `christian`, `hindu`
- Returns available filter options for that religion
- Use this endpoint to build dropdowns or autocomplete lists in the frontend

Example:

```http
GET https://name-meaning-site-backend.vercel.app/api/v1/names/christian/filters
```

Response shape:

```json
{
  "success": true,
  "religion": "christian",
  "data": {
    "letters": ["A", "B", "C", ...],
    "genders": ["Female", "Male", "Male or Female or Unisex"],
    "origins": ["Greek", "Hebrew", "African", ...],
    "themes": [...],
    "categories": ["Christian", "Biblical", "Male", "Female", ...],
    "total_names": 12876
  }
}
```

> Use these returned values directly in the UI. Do not try to invent or transform raw DB values.

## 2. Get filtered names

`GET /api/v1/names/:religion`

Query parameters:

- `page` — page number (default: `1`)
- `limit` — items per page (default: `50`, max: `100`)
- `gender` — single-word gender value
- `origin` — origin token from the `/filters` response
- `category` — category filter, accepts `1-3` words
- `theme` — theme filter text
- `startsWith` — starting letter filter
- `alphabet` — alias for `startsWith`
- `search` — general search string
- `sort` — `asc`, `desc`, `popular`, `trending`, etc.

Example:

```http
GET https://name-meaning-site-backend.vercel.app/api/v1/names/christian?alphabet=d&page=1&limit=5
```

This will return names starting with `D` in the Christian religion.

## How to use the filters in frontend

### 1. Load the available filter values first

Fetch the `/filters` endpoint and populate UI controls from its data.

Example with `fetch`:

```js
const BASE_URL = 'https://name-meaning-site-backend.vercel.app/api/v1';

async function loadFilters(religion) {
  const res = await fetch(`${BASE_URL}/names/${religion}/filters`);
  return await res.json();
}
```

### 2. Build query values from UI selection

Use values from the `data.origins` and `data.categories` arrays.

Example:

- Gender: `Male`
- Origin: `Greek`
- Category: `Biblical` or `Christian` or `Male` or `Female`
- Starts with: `D`

### 3. Send the filter request

Use the returned filter values directly in query strings.

Example:

```js
const params = new URLSearchParams({
  page: '1',
  limit: '5',
  alphabet: 'd',
  gender: 'Male',
  origin: 'Greek',
  category: 'Christian',
  sort: 'asc'
});

const response = await fetch(`${BASE_URL}/names/christian?${params.toString()}`);
const data = await response.json();
console.log(data);
```

### 4. Category filter rules

- `category` can contain `1` to `3` words.
- Words may be separated by spaces or commas.
- Example values:
  - `Christian`
  - `Biblical`
  - `Biblical Saint`
  - `Christian Male`

The backend uses each word to match category values in the name documents.

### 5. Origin filter rules

- `origin` should be taken from `data.origins` returned by `/filters`.
- The backend normalizes origin values, so valid values are those provided by the filters endpoint.
- Example values: `Greek`, `Hebrew`, `African`, `American`, `Arabic`

### 6. StartsWith / alphabet

- Use either `startsWith` or `alphabet`.
- Example: `?alphabet=d` or `?startsWith=d`

### 7. Search

- Use `search` for free-text matching against `name`, `meaning`, and `origin`.
- Example: `?search=light`

## Recommended frontend flow

1. Load filter options from `/api/v1/names/:religion/filters`
2. Render dropdowns/inputs using response values
3. Let user select a gender/origin/category/letter/search
4. Build the query string from those values
5. Call `/api/v1/names/:religion` with the selected values

## Example requests

### Filtered by letter D

```http
GET /api/v1/names/christian?alphabet=d&page=1&limit=5
```

### Filtered by category and origin

```http
GET /api/v1/names/christian?category=Biblical&origin=Greek&page=1&limit=20
```

### Combined filters

```http
GET /api/v1/names/christian?alphabet=d&gender=Male&origin=Hebrew&category=Christian&page=1&limit=10
```

## Supported religions

- `islamic`
- `christian`
- `hindu`

## Notes

- Always use the values returned by `/filters` for `origin` and `category`.
- Do not send raw long descriptions or full sentences as filter values.
- If the UI shows a messy value, normalize it by using the server-provided list and send the selected cleaned token back to the API.
