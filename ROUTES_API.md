# API Routes Documentation

This document outlines all the API routes in the Nameverse backend, based on the current codebase exploration.

## Mounted Routes

These routes are currently active and mounted in the application.

### Root Level Routes

| Method | Path | Effective Path | Handler | File |
|--------|------|----------------|---------|------|
| GET | / | / | Inline function (returns JSON with success message, version, etc.) | C:\Meaning site\Nameverse\backend\index.js |

### API v1 Routes

| Method | Path | Effective Path | Handler | File |
|--------|------|----------------|---------|------|
| GET | / | /api/v1/ | Inline function (returns API info JSON) | C:\Meaning site\Nameverse\backend\src\routes\api\v1\index.js |

#### Names Routes (All Mounted at /api/v1/names)

| Method | Path | Effective Path | Handler | File |
|--------|------|----------------|---------|------|
| GET | /search | /api/v1/names/search | namesController.getNamesByReligion (with search filter) | C:\Meaning site\Nameverse\backend\src\routes\api\v1\names.js |
| GET | /:religion | /api/v1/names/:religion | namesController.getNamesByReligion | C:\Meaning site\Nameverse\backend\src\routes\api\v1\names.js |
| GET | /:religion/filters | /api/v1/names/:religion/filters | namesController.getFilters | C:\Meaning site\Nameverse\backend\src\routes\api\v1\names.js |
| GET | /:religion/letter/:letter | /api/v1/names/:religion/letter/:letter | namesController.getNamesByLetter | C:\Meaning site\Nameverse\backend\src\routes\api\v1\names.js |
| GET | /:religion/:slug/related | /api/v1/names/:religion/:slug/related | namesController.getRelatedNames | C:\Meaning site\Nameverse\backend\src\routes\api\v1\names.js |
| GET | /:religion/:slug/similar | /api/v1/names/:religion/:slug/similar | namesController.getSimilarNames | C:\Meaning site\Nameverse\backend\src\routes\api\v1\names.js |
| GET | /:religion/:slug | /api/v1/names/:religion/:slug | namesController.getNameBySlug | C:\Meaning site\Nameverse\backend\src\routes\api\v1\names.js |
| GET | / | /api/v1/names/ | namesController.getNamesByReligion (default religion: islamic) | C:\Meaning site\Nameverse\backend\src\routes\api\v1\names.js |

## Unmounted Routes

These routes are defined in the files but not currently mounted in the application.

### Health Routes

| Method | Path | Effective Path | Handler | File |
|--------|------|----------------|---------|------|
| GET | / | /api/v1/health/ | Inline function (checks DB status) | C:\Meaning site\Nameverse\backend\src\routes\api\v1\health.js |

### Articles Routes

| Method | Path | Effective Path | Handler | File |
|--------|------|----------------|---------|------|
| GET | / | /api/v1/articles/ | articlesController.listArticles | C:\Meaning site\Nameverse\backend\src\routes\api\v1\articles.js |
| GET | /featured | /api/v1/articles/featured | articlesController.getFeaturedArticles | C:\Meaning site\Nameverse\backend\src\routes\api\v1\articles.js |
| GET | /latest | /api/v1/articles/latest | articlesController.getLatestArticles | C:\Meaning site\Nameverse\backend\src\routes\api\v1\articles.js |
| GET | /categories | /api/v1/articles/categories | articlesController.getArticleCategories | C:\Meaning site\Nameverse\backend\src\routes\api\v1\articles.js |
| GET | /search | /api/v1/articles/search | articlesController.searchArticles | C:\Meaning site\Nameverse\backend\src\routes\api\v1\articles.js |
| GET | /tag/:tag | /api/v1/articles/tag/:tag | articlesController.getArticlesByTag | C:\Meaning site\Nameverse\backend\src\routes\api\v1\articles.js |
| GET | /related/:slug | /api/v1/articles/related/:slug | articlesController.getRelatedArticles | C:\Meaning site\Nameverse\backend\src\routes\api\v1\articles.js |
| GET | /stats | /api/v1/articles/stats | articlesController.getArticleStatistics | C:\Meaning site\Nameverse\backend\src\routes\api\v1\articles.js |
| GET | /:slug | /api/v1/articles/:slug | articlesController.getArticleBySlug (note: duplicate route definition in file) | C:\Meaning site\Nameverse\backend\src\routes\api\v1\articles.js |

## Notes

- All routes use GET method except where noted.
- Mounted routes are active in the current application setup.
- Unmounted routes are defined in files but not included in the router mounting in src/routes/api/v1/index.js.
- Handler functions reference controllers in src/controllers/ (e.g., namesController, articlesController).
- No POST, PUT, DELETE, or PATCH routes found in the codebase.
- Paths are shown as defined in the router files; effective paths include the mounting prefix.