# 国企好岗 · 职位实时收集小程序

实时收集**央企、国企、公务员考试、大企业社招**职位的微信小程序。后端每晚 **12:00 定时自动刷新**抓取更新，前端小程序支持分类浏览、搜索筛选、收藏与关键词订阅。

## 项目结构

```
ai-project/
├── server/                    # 后端服务（Node.js + Express）
│   ├── src/
│   │   ├── index.js           # 服务入口（API + 定时任务）
│   │   ├── config.js          # 配置（端口、cron、数据源开关、代理）
│   │   ├── db.js              # JSON 文件存储层（原子写入）
│   │   ├── scheduler.js       # 每晚 12:00 定时刷新
│   │   ├── crawler/
│   │   │   ├── index.js       # 爬虫调度器（并行抓取、去重、入库、日志）
│   │   │   └── sources/       # 数据源适配器
│   │   │       ├── centralSoe.js    # 央企招聘（国聘网 / 国资委官网）
│   │   │       ├── stateOwned.js    # 国企招聘（国企招聘网 / 中智招聘）
│   │   │       ├── civilService.js  # 公务员考试（国家公务员局等）
│   │   │       └── bigCompany.js    # 大企业社招（拉勾 / 智联）
│   │   ├── api/               # REST API（职位 / 用户收藏 / 订阅）
│   │   ├── utils/             # HTTP 抓取(GBK转码/代理)、规范化、日志
│   │   └── scripts/           # seed 种子数据
│   └── data/                  # 运行数据（自动生成，勿提交）
├── miniprogram/               # 微信小程序
│   ├── app.js / app.json / app.wxss
│   ├── utils/                 # API 封装与接口配置
│   └── pages/
│       ├── index/             # 职位列表（分类 Tab、下拉刷新、上拉加载）
│       ├── detail/            # 职位详情（收藏、复制原文链接）
│       ├── search/            # 搜索（关键词 + 分类/学历/地区筛选）
│       └── mine/              # 我的（收藏、关键词订阅、数据概览）
└── README.md
```

## 快速开始

### 1. 启动后端

```bash
cd server
npm install

# 生成演示数据（无网环境也能看到职位；有网时爬虫会自动补充真实数据）
npm run seed

# 启动服务（自动注册每晚 12:00 定时刷新任务）
npm start
```

服务默认运行在 `http://localhost:3000`。

### 2. 手动触发一次抓取同步

```bash
npm run sync
```

同步会并行执行 4 个数据源，单个数据源失败不影响其他数据源，每次结果记录在 `data/store.json` 的 `syncLogs` 中。

### 3. 导入微信小程序

1. 打开微信开发者工具 → 导入项目 → 选择 `miniprogram/` 目录（appid 可用测试号 `touristappid`）。
2. 开发调试时勾选「详情 → 本地设置 → 不校验合法域名、web-view（业务域名）等」。
3. 如需连接本地后端，保持 [utils/config.js](miniprogram/utils/config.js) 的 `baseUrl` 为 `http://localhost:3000/api`。

## 定时刷新

- 默认每晚 **00:00** 自动执行一次全量同步（cron 表达式 `0 0 * * *`）。
- 修改时间：编辑 [config.js](server/src/config.js) 中的 `cron` 字段，或设置环境变量 `CRON`。
- 服务器需保持常驻运行（可用 pm2 / systemd / Docker 托管，见下）。

## API 说明

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/jobs` | 职位列表，支持 `category / keyword / location / education / sort(deadline) / page / size` |
| GET | `/api/jobs/:id` | 职位详情 |
| GET | `/api/stats` | 数据统计与最近一次同步信息 |
| GET | `/api/user/favorites` | 收藏列表 |
| POST | `/api/user/favorites` | 添加收藏 `{ jobId }` |
| DELETE | `/api/user/favorites/:jobId` | 取消收藏 |
| GET | `/api/user/subscriptions` | 订阅关键词列表 |
| POST | `/api/user/subscriptions` | 添加订阅 `{ keyword }` |
| DELETE | `/api/user/subscriptions/:id` | 删除订阅 |

## 部署注意事项

1. **HTTPS 与合法域名**：小程序线上环境只允许 https 请求，需将后端部署到公网并配置 SSL，然后在微信公众平台「开发管理 → 服务器域名」中配置 `request` 合法域名。
2. **登录体系**：当前以固定 `default-user` 标识用户。生产环境请在 [utils/api.js](miniprogram/utils/api.js) 中用 `wx.login` 换取 `code`，后端调 `code2Session` 获得 `openid` 后通过 `X-Openid` 请求头区分用户。
3. **反爬与页面结构变化**：各数据源站点页面结构或风控可能调整，导致某个源抓取失败；失败会记录在同步日志中且不影响其他源。可在 `server/src/crawler/sources/*.js` 中调整解析规则，或接入目标站的官方开放 API。
4. **常驻运行**：`npm start` 前台运行，生产环境建议用 pm2：`pm2 start src/index.js --name job-collector`。
5. **代理**：后端自动读取 `HTTP_PROXY / HTTPS_PROXY` 环境变量，部署在内网/受限网络时按需配置。

## 数据字段

每条职位包含：标题、单位/公司、分类（央企/国企/公务员/大厂社招）、地点、学历要求、经验要求、薪资、报名截止时间、发布时间、描述、原文链接、来源与标签。
