'use strict';

/**
 * 爬虫调度器
 * - 并行执行各数据源抓取
 * - 单个数据源失败不影响其他数据源
 * - 标准化、去重、增量入库（upsert）
 * - 记录每次同步日志
 */

const crypto = require('crypto');
const config = require('../config');
const db = require('../db');
const logger = require('../utils/logger');
const { normalize } = require('../utils/normalize');

const sources = [
  require('./sources/centralSoe'),
  require('./sources/stateOwned'),
  require('./sources/civilService'),
  require('./sources/bigCompany')
];

/**
 * 执行一次全量同步
 * @returns {Promise<{runId, startedAt, finishedAt, durationMs, results, total, error}>}
 */
async function runSync() {
  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  const enabled = sources.filter((s) => {
    const key = { central_soe: 'centralSoe', state_owned: 'stateOwned', civil_service: 'civilService', big_company: 'bigCompany' }[s.category];
    return config.sources[key]?.enabled !== false;
  });

  logger.info(`开始同步，共 ${enabled.length} 个数据源，runId=${runId}`);

  const results = await Promise.all(
    enabled.map(async (source) => {
      const record = { sourceId: source.id, sourceName: source.name, status: 'ok', added: 0, updated: 0, error: null };
      try {
        const rawList = await Promise.race([
          source.fetch(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('抓取超时')), config.syncTimeout)
          )
        ]);
        const docs = rawList.map((raw) => normalize(raw, source));
        const stat = db.bulkUpsert('jobs', docs);
        record.added = stat.added;
        record.updated = stat.updated;
        record.total = stat.total;
        logger.info(`[${source.name}] 抓取 ${rawList.length} 条，新增 ${stat.added}，更新 ${stat.updated}`);
      } catch (e) {
        record.status = 'error';
        record.error = e.message;
        logger.error(`[${source.name}] 抓取失败: ${e.message}`);
      }
      return record;
    })
  );

  const finishedAt = Date.now();
  const logEntry = {
    runId,
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    results,
    error: null
  };
  db.addSyncLog(logEntry);
  logger.info(`同步完成，耗时 ${logEntry.durationMs}ms`);

  return { ...logEntry, total: db.count('jobs') };
}

// 支持 `npm run sync` 直接调用
if (require.main === module) {
  runSync()
    .then((res) => {
      logger.info('== 同步结果 ==');
      logger.info(JSON.stringify(res.results, null, 2));
      process.exit(0);
    })
    .catch((e) => {
      logger.error('同步失败:', e.message);
      process.exit(1);
    });
}

module.exports = { runSync, sources };
