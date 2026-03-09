// ============================================
// Vercel Serverless API - Production Ready
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// ============================================
// MongoDB Connection (Singleton for Serverless)
// ============================================

let cachedDb = null;
let connectionPromise = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  if (connectionPromise) return connectionPromise;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not found");

  connectionPromise = mongoose
    .connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      family: 4,
    })
    .then((conn) => {
      cachedDb = conn;
      console.log("MongoDB Connected:", conn.connection.host);
      return cachedDb;
    })
    .catch((err) => {
      console.error("MongoDB Error:", err.message);
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
}

// ============================================
// Models (Lazy Loaded)
// ============================================

let IslamicName, ChristianName, HinduName;
let Article;

function loadModels() {
  if (!IslamicName) {
    try {
      IslamicName = require(path.join(__dirname, '../models/IslamicModel'));
      ChristianName = require(path.join(__dirname, '../models/ChristianModel'));
      HinduName = require(path.join(__dirname, '../models/HinduModel'));
      Article = require(path.join(__dirname, '../models/ArticleModel'));
    } catch (error) {
      console.error('Error loading models:', error);
      throw new Error('Failed to load database models');
    }
  }
  return { IslamicName, ChristianName, HinduName, Article };
}

function getModel(religion = "") {
  const models = loadModels();
  const r = religion.toLowerCase();

  return (
    {
      islam: models.IslamicName,
      islamic: models.IslamicName,
      muslim: models.IslamicName,
      christian: models.ChristianName,
      christianity: models.ChristianName,
      hindu: models.HinduName,
      hinduism: models.HinduName,
    }[r] || null
  );
}

// ============================================
// Express Setup
// ============================================

const app = express();
app.set("trust proxy", 1);

async function ensureDB() {
  try {
    await connectDB();
    return true;
  } catch {
    return false;
  }
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors({ origin: "*", credentials: false }));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// Rate Limit
// ============================================

app.use(
  rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: (req) => {
      const origin = req.get("origin") || "";
      const referer = req.get("referer") || "";
      if (
        origin.includes("nameverse.vercel.app") ||
        referer.includes("nameverse.vercel.app")
      ) {
        return 999999;
      }
      return 70;
    },
    keyGenerator: (req) => req.ip || 'unknown',
    skip: (req) => {
      const disableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true' || process.env.NODE_ENV !== 'production';
      if (disableRateLimit) return true;
      return req.path === "/health" || req.path === "/warmup";
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_, res) =>
      res.status(429).json({
        success: false,
        error: "Too many requests",
        retryAfter: "24 hours",
      }),
  })
);

// ============================================
// Health
// ============================================

app.get("/health", async (req, res) => {
  try {
    await connectDB();
    res.json({
      status: "healthy",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      time: new Date().toISOString(),
    });
  } catch (e) {
    res.json({ status: "unhealthy", error: e.message, time: new Date().toISOString() });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await connectDB();
    res.json({
      status: "healthy",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      time: new Date().toISOString(),
    });
  } catch (e) {
    res.json({ status: "unhealthy", error: e.message, time: new Date().toISOString() });
  }
});

app.get("/api/v1/health", async (req, res) => {
  try {
    await connectDB();
    res.json({
      status: "healthy",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      time: new Date().toISOString(),
    });
  } catch (e) {
    res.json({ status: "unhealthy", error: e.message, time: new Date().toISOString() });
  }
});

app.get("/warmup", async (req, res) => {
  try {
    const start = Date.now();
    await connectDB();
    const models = loadModels();
    await models.IslamicName.findOne().lean();
    res.json({
      status: "warm",
      totalMs: Date.now() - start,
    });
  } catch (e) {
    res.status(500).json({ status: "cold", error: e.message });
  }
});

// ============================================
// v1: Get Names
// ============================================

app.get("/api/v1/names", async (req, res) => {
  try {
    const dbOk = await ensureDB();

    const {
      religion = "islamic",
      page = 1,
      limit = 50,
      gender,
      origin,
      startsWith,
      search,
      sort = "asc",
    } = req.query;

    const Model = getModel(religion);
    if (!Model) return res.status(400).json({ success: false, error: "Invalid religion" });

    const filter = {};
    if (gender) filter.gender = gender.toLowerCase();
    if (origin) filter.origin = { $regex: origin, $options: "i" };
    if (startsWith) filter.name = { $regex: `^${startsWith}`, $options: "i" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { short_meaning: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    let data = [];
    let total = 0;
    if (dbOk) {
      const result = await Promise.all([
        Model.find(filter)
          .sort({ name: sort === "desc" ? -1 : 1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Model.countDocuments(filter),
      ]);
      data = result[0];
      total = result[1];
    }

    res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error('API v1 names error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// v1: Single Name
// ============================================

app.get("/api/v1/names/:religion/:slug", async (req, res) => {
  try {
    const dbOk = await ensureDB();

    const { religion, slug } = req.params;
    const Model = getModel(religion);

    if (!Model) return res.status(400).json({ success: false, error: "Invalid religion" });

    if (!dbOk) return res.status(404).json({ success: false, error: "Name not found" });
    const name = await Model.findOne({ slug }).lean();

    if (!name) return res.status(404).json({ success: false, error: "Name not found" });

    res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.json({ success: true, data: name });
  } catch (e) {
    console.error('API v1 single name error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// v1: Names by Letter
app.get("/api/v1/names/:religion/letter/:letter", async (req, res) => {
  try {
    const dbOk = await ensureDB();
    const { religion, letter } = req.params;
    const limit = Math.min(Number(req.query.limit) || 100, 150);
    const Model = getModel(religion);
    if (!Model) return res.status(400).json({ success: false, error: "Invalid religion" });

    let data = [];
    if (dbOk) {
      const regex = new RegExp(`^${letter}`, "i");
      data = await Model.find({ name: regex }).sort({ name: 1 }).limit(limit).lean();
    }

    res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.json({
      success: true,
      religion,
      letter: letter.toUpperCase(),
      count: data.length,
      data,
    });
  } catch (e) {
    console.error("API v1 names by letter error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// v1: Related Names
app.get("/api/v1/names/:religion/:slug/related", async (req, res) => {
  try {
    const dbOk = await ensureDB();
    const { religion, slug } = req.params;
    const Model = getModel(religion);
    if (!Model) return res.status(400).json({ success: false, error: "Invalid religion" });

    if (!dbOk) return res.status(200).json({ success: true, count: 0, data: [] });

    const current = await Model.findOne({ slug }).lean();
    if (!current) return res.status(200).json({ success: true, count: 0, data: [] });

    const related = await Model.find({
      _id: { $ne: current._id },
      $or: [{ origin: current.origin }, { gender: current.gender }],
    })
      .sort({ popularity: -1, name: 1 })
      .limit(10)
      .lean();

    res.set("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=1800");
    res.json({
      success: true,
      religion,
      originalName: current.name,
      count: related.length,
      data: related,
    });
  } catch (e) {
    console.error("API v1 related names error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// v1: Similar Names
app.get("/api/v1/names/:religion/:slug/similar", async (req, res) => {
  try {
    const dbOk = await ensureDB();
    const { religion, slug } = req.params;
    const Model = getModel(religion);
    if (!Model) return res.status(400).json({ success: false, error: "Invalid religion" });

    if (!dbOk) return res.status(200).json({ success: true, count: 0, data: [] });

    const current = await Model.findOne({ slug }).lean();
    if (!current) return res.status(200).json({ success: true, count: 0, data: [] });

    const len = current.name.length;
    const startsWith = current.name[0] || "";
    const similar = await Model.find({
      _id: { $ne: current._id },
      name: { $regex: `^${startsWith}`, $options: "i" },
      $expr: {
        $and: [
          { $gte: [{ $strLenCP: "$name" }, len - 2] },
          { $lte: [{ $strLenCP: "$name" }, len + 2] },
        ],
      },
    })
      .sort({ popularity: -1, name: 1 })
      .limit(8)
      .lean();

    res.set("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=1800");
    res.json({
      success: true,
      religion,
      originalName: current.name,
      count: similar.length,
      data: similar,
    });
  } catch (e) {
    console.error("API v1 similar names error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// v1: Articles
// ============================================

app.get("/api/v1/articles", async (req, res) => {
  try {
    await connectDB();
    const { Article } = loadModels();

    let {
      page = 1,
      limit = 10,
      category,
      status = "published",
      sort = "recent",
    } = req.query;

    page = Number(page);
    limit = Math.min(Number(limit), 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    let sortQuery;
    switch (sort) {
      case "views":
        sortQuery = { views: -1, publishedAt: -1 };
        break;
      case "likes":
        sortQuery = { likes: -1, publishedAt: -1 };
        break;
      case "oldest":
        sortQuery = { publishedAt: 1 };
        break;
      case "recent":
      default:
        sortQuery = { publishedAt: -1 };
        break;
    }

    const [items, total] = await Promise.all([
      Article.find(filter).sort(sortQuery).skip(skip).limit(limit).lean(),
      Article.countDocuments(filter),
    ]);

    if (total === 0) {
      return res.status(404).json({ success: false, error: "No articles found" });
    }

    res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + items.length < total,
      data: items,
    });
  } catch (e) {
    res.status(503).json({ success: false, error: "Database unavailable" });
  }
});

app.get("/api/v1/articles/latest", async (req, res) => {
  try {
    await connectDB();
    const { Article } = loadModels();
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const items = await Article.find({ status: "published" })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    if (!items.length) {
      return res.status(404).json({ success: false, error: "No articles found" });
    }

    res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (e) {
    res.status(503).json({ success: false, error: "Database unavailable" });
  }
});

app.get("/api/v1/articles/categories", async (req, res) => {
  try {
    await connectDB();
    const { Article } = loadModels();

    const categories = await Article.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    if (!categories.length) {
      return res.status(404).json({ success: false, error: "No categories found" });
    }

    const data = categories.map((c) => ({ category: c._id, count: c.count }));

    res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (e) {
    res.status(503).json({ success: false, error: "Database unavailable" });
  }
});

app.get("/api/v1/articles/search", async (req, res) => {
  try {
    await connectDB();
    const { Article } = loadModels();
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ success: false, error: "Query 'q' is required" });
    }
    let { page = 1, limit = 10 } = req.query;
    page = Number(page);
    limit = Math.min(Number(limit), 50);
    const skip = (page - 1) * limit;

    const filter = {
      status: "published",
      $or: [
        { title: { $regex: q, $options: "i" } },
        { subtitle: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ],
    };

    const [items, total] = await Promise.all([
      Article.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
      Article.countDocuments(filter),
    ]);

    if (total === 0) {
      return res.status(404).json({ success: false, error: "No matching articles" });
    }

    res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.json({
      success: true,
      query: q,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + items.length < total,
      data: items,
    });
  } catch (e) {
    res.status(503).json({ success: false, error: "Database unavailable" });
  }
});

app.get("/api/v1/articles/:slug", async (req, res) => {
  try {
    await connectDB();
    const { Article } = loadModels();
    const { slug } = req.params;

    const article = await Article.findOne({ slug, status: "published" }).lean();
    if (!article) return res.status(404).json({ success: false, error: "Article not found" });

    res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.json({ success: true, data: article });
  } catch (e) {
    res.status(503).json({ success: false, error: "Database unavailable" });
  }
});

// ============================================
// v1: Filters
// ============================================

app.get("/api/v1/filters/:religion", async (req, res) => {
  try {
    const dbOk = await ensureDB();
    const Model = getModel(req.params.religion);

    if (!Model) return res.status(400).json({ success: false, error: "Invalid religion" });

    let rows = [];
    if (dbOk) {
      rows = await Model.find({}).select("name gender origin").lean();
    }

    const genders = [...new Set(rows.map((x) => x.gender))].filter(Boolean);
    const origins = [...new Set(rows.map((x) => x.origin))].filter(Boolean);
    const letters = [...new Set(rows.map((x) => x.name?.[0]?.toUpperCase()))].filter(Boolean);

    res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.json({
      success: true,
      totalNames: rows.length,
      filters: { genders, origins, letters },
    });
  } catch (e) {
    console.error('API v1 filters error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// v1: Search
// ============================================

app.get("/api/v1/search", async (req, res) => {
  try {
    const dbOk = await ensureDB();

    const { q, religion, limit = 20 } = req.query;

    if (!q || q.length < 2)
      return res.status(400).json({ success: false, error: "Query must be 2+ chars" });

    const search = {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { short_meaning: { $regex: q, $options: "i" } },
      ],
    };

    let data = [];
    if (dbOk) {
      const models = loadModels();
      const list = religion
        ? [getModel(religion)]
        : [models.IslamicName, models.ChristianName, models.HinduName];
      const results = await Promise.all(
        list.map((M) => (M ? M.find(search).limit(Number(limit)).lean() : []))
      );
      data = results.flat();
    }

    res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (e) {
    console.error('API v1 search error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// Legacy Routes (Backward Compatibility)
// ============================================

// Legacy: All names (with filters)
app.get("/api/names", async (req, res) => {
  try {
    const dbOk = await ensureDB();
    const {
      religion = "islamic",
      page = 1,
      limit = 50,
      gender,
      origin,
      startsWith,
      search,
      sort = "asc",
    } = req.query;
    const Model = getModel(religion);
    if (!Model) return res.status(400).json({ success: false, error: "Invalid religion" });
    const filter = {};
    if (gender) filter.gender = gender.toLowerCase();
    if (origin) filter.origin = { $regex: origin, $options: "i" };
    if (startsWith) filter.name = { $regex: `^${startsWith}`, $options: "i" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { short_meaning: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (page - 1) * limit;
    let data = [];
    let total = 0;
    if (dbOk) {
      const result = await Promise.all([
        Model.find(filter)
          .sort({ name: sort === "desc" ? -1 : 1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Model.countDocuments(filter),
      ]);
      data = result[0];
      total = result[1];
    }
    res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.json({
      success: true,
      source: dbOk ? "database" : "fallback",
      religion,
      count: data.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount: total,
        totalPages: Math.ceil(total / limit) || 0,
        hasMore: skip + data.length < total,
      },
      data,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Legacy: Names by letter (requires religion query)
app.get("/api/name/letter/:letter", async (req, res) => {
  try {
    const dbOk = await ensureDB();
    const { letter } = req.params;
    const { religion = "islamic", limit = 100 } = req.query;
    const Model = getModel(religion);
    if (!Model) return res.status(400).json({ success: false, error: "Invalid religion" });
    let data = [];
    if (dbOk) {
      const regex = new RegExp(`^${letter}`, "i");
      data = await Model.find({ name: regex }).sort({ name: 1 }).limit(Math.min(Number(limit), 150)).lean();
    }
    res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.json({
      success: true,
      religion,
      letter: String(letter).toUpperCase(),
      count: data.length,
      data,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Legacy: Names search
app.get("/api/search", async (req, res) => {
  try {
    const dbOk = await ensureDB();
    const { q, religion, limit = 20 } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ success: false, error: "Query must be 2+ chars" });
    const search = {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { short_meaning: { $regex: q, $options: "i" } },
      ],
    };
    let data = [];
    if (dbOk) {
      const models = loadModels();
      const list = religion ? [getModel(religion)] : [models.IslamicName, models.ChristianName, models.HinduName];
      const results = await Promise.all(list.map((M) => (M ? M.find(search).limit(Number(limit)).lean() : [])));
      data = results.flat();
    }
    res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Legacy: Filters
app.get("/api/filters", async (req, res) => {
  try {
    const dbOk = await ensureDB();
    const models = loadModels();
    let rows = [];
    if (dbOk) {
      const list = [models.IslamicName, models.ChristianName, models.HinduName].filter(Boolean);
      const results = await Promise.all(list.map((M) => M.find({}).select("name gender origin").limit(500).lean()));
      rows = results.flat();
    }
    const genders = [...new Set(rows.map(x => x.gender))].filter(Boolean);
    const origins = [...new Set(rows.map(x => x.origin))].filter(Boolean).slice(0, 50);
    const letters = [...new Set(rows.map(x => x.name?.[0]?.toUpperCase()))].filter(Boolean);
    res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.json({ success: true, totalNames: rows.length, filters: { genders, origins, letters } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Legacy: Trending
app.get("/api/trending", async (req, res) => {
  try {
    const dbOk = await ensureDB();
    let data = [];
    if (dbOk) {
      const models = loadModels();
      const list = [models.IslamicName, models.ChristianName, models.HinduName].filter(Boolean);
      const results = await Promise.all(list.map((M) => M.find({ trending: true }).sort({ popularity: -1 }).limit(20).lean()));
      data = results.flat();
    }
    res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
app.get("/api/religion/:religion", async (req, res) => {
  try {
    const dbOk = await ensureDB();

    const { religion } = req.params;
    const { page = 1, limit = 50, gender, origin, startsWith, search, sort = "asc" } = req.query;
    const Model = getModel(religion);

    if (!Model) {
      return res.status(400).json({ success: false, error: "Invalid religion" });
    }

    const filter = {};
    if (gender) filter.gender = gender.toLowerCase();
    if (origin) filter.origin = { $regex: origin, $options: "i" };
    if (startsWith) filter.name = { $regex: `^${startsWith}`, $options: "i" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { short_meaning: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = sort === "desc" ? -1 : 1;

    let data = [];
    let total = 0;
    if (dbOk) {
      const result = await Promise.all([
        Model.find(filter)
          .sort({ name: sortOrder })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Model.countDocuments(filter),
      ]);
      data = result[0];
      total = result[1];
    }

    res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.json({
      success: true,
      source: dbOk ? "database" : "fallback",
      religion,
      count: data.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount: total,
        totalPages: Math.ceil(total / limit) || 0,
        hasMore: skip + data.length < total,
      },
      data,
    });
  } catch (e) {
    res.status(200).json({
      success: true,
      source: "fallback",
      religion: req.params.religion,
      count: 0,
      pagination: {
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 50),
        totalCount: 0,
        totalPages: 0,
        hasMore: false,
      },
      data: [],
    });
  }
});

app.get("/api/religion/:religion/filters", async (req, res) => {
  try {
    const dbOk = await ensureDB();

    const { religion } = req.params;
    const Model = getModel(religion);

    if (!Model) {
      return res.status(400).json({ success: false, error: "Invalid religion" });
    }

    let rows = [];
    if (dbOk) {
      rows = await Model.find({}).select("name gender origin").lean();
    }

    const genders = [...new Set(rows.map((x) => x.gender))].filter(Boolean);
    const genderDistribution = {};
    genders.forEach(g => {
      genderDistribution[g] = rows.filter(x => x.gender === g).length;
    });

    const originCounts = {};
    rows.forEach(x => {
      if (x.origin) originCounts[x.origin] = (originCounts[x.origin] || 0) + 1;
    });
    const origins = Object.entries(originCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([origin, count]) => ({ origin, count }));

    const letters = [...new Set(rows.map((x) => x.name?.[0]?.toUpperCase()))].filter(Boolean);

    res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.json({
      success: true,
      religion,
      totalNames: rows.length,
      filters: {
        genders: genders.map(g => ({
          value: g,
          label: g.charAt(0).toUpperCase() + g.slice(1),
          count: genderDistribution[g]
        })),
        origins,
        firstLetters: letters.map(letter => ({
          letter,
          count: rows.filter(x => x.name?.[0]?.toUpperCase() === letter).length
        })),
      },
    });
  } catch (e) {
    res.status(200).json({
      success: true,
      religion: req.params.religion,
      totalNames: 0,
      filters: { genders: [], origins: [], firstLetters: [] }
    });
  }
});

app.get("/api/names/:religion/:slug", async (req, res) => {
  try {
    const dbOk = await ensureDB();

    const { religion, slug } = req.params;
    const Model = getModel(religion);

    if (!Model) {
      return res.status(400).json({ success: false, error: "Invalid religion" });
    }

    if (!dbOk) return res.status(404).json({ success: false, error: "Name not found" });
    const name = await Model.findOne({ slug: slug.toLowerCase() }).lean();

    if (!name) {
      return res.status(404).json({ success: false, error: "Name not found" });
    }

    res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.json({ success: true, data: name });
  } catch (e) {
    res.status(404).json({ success: false, error: "Name not found" });
  }
});

// Legacy health redirects

// Root endpoint - API welcome message
app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "Nameverse API",
    version: "1.0.0",
    description: "World's best name meaning and story API with authentic research-backed data",
    documentation: {
      health: "GET /health",
      warmup: "GET /warmup",
      endpoints: [
        "GET /api/v1/names?religion=islamic&page=1&limit=50",
        "GET /api/v1/names/:religion/:slug",
        "GET /api/v1/filters/:religion",
        "GET /api/v1/search?q=search_term",
        "GET /api/religion/:religion",
        "GET /api/religion/:religion/filters",
        "GET /api/names/:religion/:slug",
      ]
    },
    rateLimit: "50 requests per day per IP (unlimited for nameverse.vercel.app)",
  });
});

// ============================================
// FIXED: SAFE FALLBACK FOR VERCEL (NO "*")
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'GET /warmup',
      'GET /api/v1/names',
      'GET /api/v1/names/:religion/:slug',
      'GET /api/v1/filters/:religion',
      'GET /api/v1/search',
      'GET /api/religion/:religion',
      'GET /api/religion/:religion/filters',
      'GET /api/names/:religion/:slug',
    ],
  });
});

// ============================================
// Error Handler
// ============================================

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// Export for Vercel
// ============================================

module.exports = app;

// Local development server (non-Vercel)
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Nameverse API listening on http://localhost:${port}`);
  });
}
