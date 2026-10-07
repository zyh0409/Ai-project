'use strict';

/**
 * HTTP 抓取工具
 * - 支持代理（从环境变量自动读取）
 * - 支持 GBK/GB2312 等编码自动转码（中文政府/国企网站常见）
 * - 统一超时与 UA
 */

const axios = require('axios');
const iconv = require('iconv-lite');
const config = require('../config');

/** 从 HTML 中探测 charset */
function detectCharset(buffer, fallback = 'utf-8') {
  const head = buffer.slice(0, 1024).toString('latin1');
  const m = head.match(/charset\s*=\s*["']?([\w-]+)/i);
  if (m) {
    const cs = m[1].toLowerCase();
    if (cs === 'gb2312' || cs === 'gbk' || cs === 'gb18030') return 'gb18030';
    return cs;
  }
  return fallback;
}

/** 将代理 URL 字符串解析为 axios proxy 对象 */
function parseProxy(proxy) {
  if (!proxy || proxy === 'undefined') return false;
  try {
    const u = new URL(proxy);
    if (u.protocol === 'socks:' || u.protocol === 'socks5:') return undefined; // socks 需要额外库
    return {
      protocol: u.protocol.replace(':', ''),
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : (u.protocol === 'https:' ? 443 : 80),
      auth: u.username ? { username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) } : undefined
    };
  } catch {
    return false;
  }
}

/**
 * 抓取页面文本
 * @param {string} url
 * @param {object} opts { method, data, headers, responseType }
 * @returns {Promise<{ text, buffer, status }>}
 */
async function fetchPage(url, opts = {}) {
  const response = await axios.request({
    url,
    method: opts.method || 'GET',
    data: opts.data,
    headers: { ...config.http.headers, ...(opts.headers || {}) },
    timeout: config.http.timeout,
    // 代理配置：从环境变量读取并解析为 axios 格式
    proxy: parseProxy(config.http.proxy),
    responseType: 'arraybuffer',
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400
  });

  const buffer = Buffer.from(response.data);
  const encoding = opts.encoding || detectCharset(buffer);
  const text = iconv.decode(buffer, encoding);
  return { text, buffer, status: response.status };
}

/** 抓取 JSON */
async function fetchJson(url, opts = {}) {
  const res = await fetchPage(url, { ...opts, encoding: 'utf-8' });
  return JSON.parse(res.text);
}

/** 抓取 RSS/XML（按 UTF-8 处理） */
async function fetchXml(url, opts = {}) {
  return fetchPage(url, { ...opts, encoding: opts.encoding || 'utf-8' });
}

module.exports = { fetchPage, fetchJson, fetchXml, detectCharset };
