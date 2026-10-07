'use strict';

/**
 * 轻量 JSON 文件存储层
 * - 每个 collection 对应 data/ 下的一个 JSON 文件
 * - 原子写入（先写临时文件再 rename），避免中途断电损坏数据
 * - 提供 upsert / find / remove / count 等基础操作
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

const FILE = 'store.json';

class Store {
  constructor(filePath) {
    this.filePath = filePath || path.join(config.dataDir, FILE);
    this.collections = {};
    this._load();
  }

  _load() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        this.collections = raw && typeof raw === 'object' ? raw : {};
      } catch (e) {
        console.warn('[db] 存储文件损坏，已重置:', e.message);
        this.collections = {};
      }
    }
  }

  _flush() {
    const tmp = this.filePath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.collections, null, 2), 'utf8');
    fs.renameSync(tmp, this.filePath);
  }

  _col(name) {
    if (!this.collections[name]) this.collections[name] = [];
    return this.collections[name];
  }

  /** 按 id 覆盖写入或新增（upsert） */
  upsert(name, doc) {
    const col = this._col(name);
    const idx = col.findIndex((d) => d.id === doc.id);
    if (idx >= 0) col[idx] = { ...col[idx], ...doc, updatedAt: Date.now() };
    else {
      doc.createdAt = Date.now();
      doc.updatedAt = Date.now();
      col.push(doc);
    }
    this._flush();
    return doc;
  }

  /** 批量 upsert，返回新增与更新的数量 */
  bulkUpsert(name, docs) {
    const col = this._col(name);
    let added = 0;
    let updated = 0;
    const now = Date.now();
    for (const doc of docs) {
      const idx = col.findIndex((d) => d.id === doc.id);
      if (idx >= 0) {
        col[idx] = { ...col[idx], ...doc, updatedAt: now };
        updated++;
      } else {
        doc.createdAt = now;
        doc.updatedAt = now;
        col.push(doc);
        added++;
      }
    }
    this._flush();
    return { added, updated, total: col.length };
  }

  find(name, predicate) {
    const col = this._col(name);
    return predicate ? col.filter(predicate) : [...col];
  }

  findOne(name, predicate) {
    return this._col(name).find(predicate) || null;
  }

  remove(name, predicate) {
    const col = this._col(name);
    const before = col.length;
    for (let i = col.length - 1; i >= 0; i--) {
      if (predicate(col[i])) col.splice(i, 1);
    }
    if (col.length !== before) this._flush();
    return before - col.length;
  }

  count(name) {
    return this._col(name).length;
  }

  /** 记录一条同步日志 */
  addSyncLog(entry) {
    this.upsert('syncLogs', {
      id: entry.runId,
      runId: entry.runId,
      startedAt: entry.startedAt,
      finishedAt: entry.finishedAt,
      durationMs: entry.durationMs,
      results: entry.results || [],
      error: entry.error || null
    });
  }
}

module.exports = new Store();
