'use strict';

const express = require('express');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const loadObfuscatedModule = (relativePath) => {
  const absolutePath = path.resolve(__dirname, relativePath);
  const rawCode = fs.readFileSync(absolutePath, 'utf8');
  const code = rawCode.replace(/async\s*\r?\n\s*(?=function)/g, 'async ');
  const module = { exports: {} };
  const localRequire = createRequire(absolutePath);
  const wrapper = `(function (exports, require, module, __filename, __dirname) {\n${code}\n});`;
  const script = new vm.Script(wrapper, { filename: absolutePath });
  const compiled = script.runInThisContext();
  compiled(module.exports, localRequire, module, absolutePath, path.dirname(absolutePath));
  return module.exports;
};

const qqMusic = loadObfuscatedModule('../1.js');

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.json());

const parsePage = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
};

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get(
  '/api/search',
  asyncHandler(async (req, res) => {
    const { keyword, type = 'music', page = '1' } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: 'keyword is required' });
    }

    const pageNumber = parsePage(page);
    const result = await qqMusic.search(keyword, pageNumber, type);
    res.json(result);
  })
);

app.get(
  '/api/top-lists',
  asyncHandler(async (req, res) => {
    const groups = await qqMusic.getTopLists();
    res.json(groups);
  })
);

app.get(
  '/api/top-lists/:id',
  asyncHandler(async (req, res) => {
    const { period } = req.query;
    const detail = await qqMusic.getTopListDetail({ id: req.params.id, period });
    res.json(detail);
  })
);

app.get(
  '/api/recommend/tags',
  asyncHandler(async (req, res) => {
    const data = await qqMusic.getRecommendSheetTags();
    res.json(data);
  })
);

app.get(
  '/api/recommend/sheets',
  asyncHandler(async (req, res) => {
    const { categoryId, page = '1' } = req.query;
    const tag = categoryId ? { id: categoryId } : undefined;
    const pageNumber = parsePage(page);
    const data = await qqMusic.getRecommendSheetsByTag(tag, pageNumber);
    res.json(data);
  })
);

app.get(
  '/api/music-sheets/:id',
  asyncHandler(async (req, res) => {
    const data = await qqMusic.getMusicSheetInfo({ id: req.params.id });
    res.json(data);
  })
);

app.get(
  '/api/media-source/:songmid',
  asyncHandler(async (req, res) => {
    const { quality = 'standard' } = req.query;
    const data = await qqMusic.getMediaSource({ songmid: req.params.songmid }, quality);
    res.json(data);
  })
);

app.get(
  '/api/lyrics/:songmid',
  asyncHandler(async (req, res) => {
    const data = await qqMusic.getLyric({ songmid: req.params.songmid });
    res.json(data);
  })
);

app.use((err, req, res, _next) => {
  const status = err?.status || 500;
  res.status(status).json({
    error: err?.message || 'Unexpected error',
  });
});

app.listen(PORT, () => {
  console.log(`QQ Music proxy server listening on http://localhost:${PORT}`);
});
