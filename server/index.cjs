'use strict';

const express = require('express');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const {
  createUser,
  getUser,
  updateUser,
  verifyCredentials,
} = require('./utils/dataStore.cjs');

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
const axios = require('axios');

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.json());

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }
  const { password, ...rest } = user;
  return rest;
};

const MAX_HISTORY_LENGTH = 100;

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

app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: '邮箱必填' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: '密码必填' });
    }

    const user = getUser(email);

    if (!user) {
      return res.status(404).json({ error: '用户不存在', needsRegistration: true });
    }

    const valid = verifyCredentials({ email, password });

    if (!valid) {
      return res.status(401).json({ error: '密码错误' });
    }

    res.json({ user: sanitizeUser(user) });
  })
);

app.post(
  '/api/auth/register',
  asyncHandler(async (req, res) => {
    const { email, password, nickname } = req.body ?? {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: '邮箱必填' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: '密码至少 6 位' });
    }
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return res.status(400).json({ error: '昵称必填' });
    }

    const existing = getUser(email);

    if (existing) {
      return res.status(409).json({ error: '用户已存在' });
    }

    const user = createUser({ email, password, nickname: nickname.trim() });

    if (!user) {
      return res.status(409).json({ error: '用户已存在' });
    }

    res.status(201).json({ user: sanitizeUser(user) });
  })
);

app.get(
  '/api/users/:email',
  asyncHandler(async (req, res) => {
    const user = getUser(req.params.email);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user: sanitizeUser(user) });
  })
);

app.get(
  '/api/users/:email/playback-history',
  asyncHandler(async (req, res) => {
    const user = getUser(req.params.email);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ playbackHistory: user.playbackHistory ?? [] });
  })
);

app.post(
  '/api/users/:email/playback-history',
  asyncHandler(async (req, res) => {
    const { entry } = req.body ?? {};

    if (!entry || typeof entry !== 'object') {
      return res.status(400).json({ error: '播放记录数据无效' });
    }

    const updated = updateUser(req.params.email, (current) => {
      const history = Array.isArray(current.playbackHistory)
        ? current.playbackHistory.slice(0, MAX_HISTORY_LENGTH - 1)
        : [];

      return {
        playbackHistory: [entry, ...history],
      };
    });

    if (!updated) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ playbackHistory: updated.playbackHistory });
  })
);

app.put(
  '/api/users/:email/favorites',
  asyncHandler(async (req, res) => {
    const { favorites } = req.body ?? {};

    if (!Array.isArray(favorites)) {
      return res.status(400).json({ error: '收藏列表数据无效' });
    }

    const updated = updateUser(req.params.email, () => ({ favorites }));

    if (!updated) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ favorites: updated.favorites });
  })
);

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

// Simple image proxy to bypass CORS for album artwork used by WebGL background
app.get(
  '/api/proxy-image',
  asyncHandler(async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }
    // Optional: whitelist domains for safety
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        // Provide referer/user-agent when target requires it
        headers: { referer: 'https://y.qq.com', 'user-agent': 'Mozilla/5.0' },
        timeout: 15000,
      });
      const contentType = response.headers['content-type'] || 'image/jpeg';
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=3600');
      res.set('Access-Control-Allow-Origin', '*');
      res.send(Buffer.from(response.data));
    } catch (err) {
      res.status(502).json({ error: 'Failed to fetch image' });
    }
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
