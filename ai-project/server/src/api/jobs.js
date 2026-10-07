'use strict';

/**
 * 职位相关 API：列表 / 详情 / 搜索 / 统计
 */

const express = require('express');
const db = require('../db');
const { CATEGORIES } = require('../utils/normalize');

const router = express.Router();

const FIELDS = ['id', 'title', 'company', 'location', 'education', 'experience', 'salary',
  'deadline', 'deadlineText', 'publishDate', 'publishDateText', 'description', 'link',
  'category', 'categoryName', 'sourceName', 'tags', 'createdAt'];

function pick(doc) {
  const out = {};
  for (const f of FIELDS) if (doc[f] !== undefined) out[f] = doc[f];
  return out;
}

/** GET /api/jobs?category=&keyword=&location=&education=&sort=&page=&size= */
router.get('/jobs', (req, res) => {
  const { category, keyword, location, education, sort } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const size = Math.min(50, Math.max(1, parseInt(req.query.size, 10) || 20));

  let list = db.find('jobs');
  if (category && CATEGORIES[category]) list = list.filter((j) => j.category === category);
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    list = list.filter((j) =>
      (j.title || '').toLowerCase().includes(kw) ||
      (j.company || '').toLowerCase().includes(kw) ||
      (j.description || '').toLowerCase().includes(kw)
    );
  }
  if (location) list = list.filter((j) => (j.location || '').includes(String(location)));
  if (education) list = list.filter((j) => (j.education || '').includes(String(education)));

  list.sort((a, b) => {
    if (sort === 'deadline') return (a.deadline || Infinity) - (b.deadline || Infinity);
    return (b.publishDate || b.createdAt || 0) - (a.publishDate || a.createdAt || 0);
  });

  const total = list.length;
  const items = list.slice((page - 1) * size, page * size).map(pick);
  res.json({ code: 0, data: { total, page, size, items } });
});

/** GET /api/jobs/:id */
router.get('/jobs/:id', (req, res) => {
  const job = db.findOne('jobs', (j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ code: 404, message: '职位不存在' });
  res.json({ code: 0, data: pick(job) });
});

/** GET /api/stats */
router.get('/stats', (req, res) => {
  const jobs = db.find('jobs');
  const byCategory = {};
  for (const key of Object.keys(CATEGORIES)) {
    byCategory[key] = jobs.filter((j) => j.category === key).length;
  }
  const lastLogs = db
    .find('syncLogs')
    .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
    .slice(0, 1);
  res.json({
    code: 0,
    data: {
      total: jobs.length,
      byCategory,
      lastSync: lastLogs[0] || null
    }
  });
});

module.exports = router;
