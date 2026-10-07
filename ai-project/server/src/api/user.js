'use strict';

/**
 * 用户相关 API：收藏 / 订阅关键词
 * 简化版：以 openid 或匿名设备号为维度（真实环境请接入微信登录）
 */

const express = require('express');
const db = require('../db');

const router = express.Router();

function userKey(req) {
  const openid = req.headers['x-openid'];
  return openid || 'default-user';
}

/** GET /api/user/favorites 收藏列表 */
router.get('/favorites', (req, res) => {
  const uid = userKey(req);
  const favs = db.find('favorites', (f) => f.userId === uid);
  const jobs = favs
    .map((f) => db.findOne('jobs', (j) => j.id === f.jobId))
    .filter(Boolean);
  res.json({ code: 0, data: jobs });
});

/** POST /api/user/favorites { jobId } 添加收藏 */
router.post('/favorites', (req, res) => {
  const uid = userKey(req);
  const { jobId } = req.body || {};
  const job = db.findOne('jobs', (j) => j.id === jobId);
  if (!job) return res.status(404).json({ code: 404, message: '职位不存在' });
  const exists = db.findOne('favorites', (f) => f.userId === uid && f.jobId === jobId);
  if (!exists) db.upsert('favorites', { id: `${uid}:${jobId}`, userId: uid, jobId, createdAt: Date.now() });
  res.json({ code: 0, data: { favorited: true } });
});

/** DELETE /api/user/favorites/:jobId 取消收藏 */
router.delete('/favorites/:jobId', (req, res) => {
  const uid = userKey(req);
  db.remove('favorites', (f) => f.userId === uid && f.jobId === req.params.jobId);
  res.json({ code: 0, data: { favorited: false } });
});

/** GET /api/user/subscriptions 订阅列表 */
router.get('/subscriptions', (req, res) => {
  const uid = userKey(req);
  res.json({ code: 0, data: db.find('subscriptions', (s) => s.userId === uid) });
});

/** POST /api/user/subscriptions { keyword } 添加订阅关键词 */
router.post('/subscriptions', (req, res) => {
  const uid = userKey(req);
  const { keyword } = req.body || {};
  const kw = String(keyword || '').trim();
  if (!kw) return res.status(400).json({ code: 400, message: '关键词不能为空' });
  const exists = db.findOne('subscriptions', (s) => s.userId === uid && s.keyword === kw);
  if (!exists) {
    const id = require('crypto').randomUUID();
    db.upsert('subscriptions', { id, userId: uid, keyword: kw, createdAt: Date.now() });
  }
  res.json({ code: 0, data: { subscribed: true } });
});

/** DELETE /api/user/subscriptions/:id 删除订阅 */
router.delete('/subscriptions/:id', (req, res) => {
  const uid = userKey(req);
  db.remove('subscriptions', (s) => s.userId === uid && s.id === req.params.id);
  res.json({ code: 0, data: { subscribed: false } });
});

module.exports = router;
