# CampFinder 中国版

CampFinder 已从一个 YelpCamp 教程项目升级为面向中国用户的露营地发现 MVP。当前版本修复了原仓库主分支中的合并冲突和权限问题，并完成了中国化的数据结构、中文产品界面、高德地图接入、搜索筛选、人民币计价、本地图片上传和基础生产安全配置。

界面支持右上角一键切换中文与 English，语言选择会保存在当前浏览器会话中。

新版前端采用响应式旅行杂志风格：首页、全国营地目录、地图列表、营地详情、登录注册与发布表单均针对桌面和移动设备重新设计。

项目当前的核心已经从“营地目录”升级为“面向不完整信息的可信发现与推荐系统”：

- 字段级来源证据与可解释的 0–100 可信度评分
- MongoDB 2dsphere 附近搜索与多信号推荐排序
- 距离、预算、设施、类型、可信度和评分的推荐理由
- 用户现场确认、纠错与冲突证据保留
- 主动数据核验规划：在有限人工预算下兼顾信息风险、地区覆盖和问题类型覆盖
- 规则式中英文设施抽取，并严格区分推断值和确认值
- 数据质量 dashboard 与公开 JSON API

详细设计见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)，评估方法见 [docs/EVALUATION.md](docs/EVALUATION.md)。

## 已实现

- 按关键词、省份、营地类型、设施和价格筛选，支持分页与排序
- 中国省/市/区地址、人民币价格、计价单位、开放季节和接待人数
- 高德地图展示与高德地理编码，替代 Mapbox
- 本地多图片上传，也可填写图片外链
- 电话、微信和预订链接
- 注册、登录、发布、编辑、删除和一次性评价
- 作者权限校验、登录限流、安全 Cookie、MongoDB Session 生产配置
- 8 个国内示例营地和 Node 内置测试
- 可通过高德 POI 官方接口导入真实露营地，并标注数据来源和待核验状态
- 可解释推荐、可信度评分、社区纠错、主动核验规划、数据质量分析和算法评估

## 主动数据核验

数据质量页面不再只是展示“可信度最低”的记录。`verify-plan-v1` 会先根据低可信度、陈旧信息、关键字段缺失、冲突报告和未知营业状态计算核验风险，再用带边际递减覆盖奖励的贪心算法选择一批任务，使有限的人力覆盖更多省份、城市和问题类型。

质量面板可直接查看可解释的核验队列，也可以调用：

```text
GET /api/v1/verification-plan?limit=20
```

算法目标、公式、复杂度和边界条件见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 本地启动

需要 Node.js 18.18+ 和 MongoDB。

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

访问 `http://localhost:3000`。种子账号为 `campfinder_demo`，默认密码为 `CampFinder2026!`；可通过 `SEED_PASSWORD` 修改。

## 高德地图配置

在高德开放平台创建 Web 端 Key 和 Web 服务 Key，然后写入 `.env`：

```env
AMAP_JS_KEY=你的Web端Key
AMAP_SECURITY_JS_CODE=你的安全密钥securityJsCode
AMAP_WEB_SERVICE_KEY=你的Web服务Key
```

不配置 Key 时其余功能仍可运行，页面会显示地图配置提示；发布营地时建议手动填写经纬度。

配置 Web 服务 Key 后，可导入北京、上海、杭州、南京、成都、重庆、广州和深圳的高德“露营地”POI：

```bash
npm run import:amap
```

导入数据包含名称、地址、电话、坐标、营业时间、评分、参考消费和照片，并明确显示“高德 POI / 未经本站核验”。正式上线前需确认高德开放平台关于 POI 数据展示、缓存和商业使用的许可条款。

同步全国城市及每个城市的全部分页数据：

```bash
npm run import:amap:all
```

全国同步进度保存在 `.cache/amap-import-progress.json`，中断或达到接口配额后可重复执行同一命令断点续跑。可通过 `AMAP_IMPORT_DELAY_MS` 调整请求间隔，通过 `AMAP_IMPORT_MAX_PAGES` 设置单城市最大页数。

## 生产部署

至少设置：

```env
NODE_ENV=production
MONGO_URL=mongodb://...
SESSION_SECRET=至少32位随机字符串
AMAP_JS_KEY=...
AMAP_WEB_SERVICE_KEY=...
```

当前图片保存在本机 `uploads/`，适合单机 MVP。多实例或容器部署时应替换为阿里云 OSS、腾讯云 COS 或七牛云，并把上传、审核和图片压缩做成独立服务。

## 从 MVP 到正式产品的下一步

1. 接入手机号/微信登录、短信风控和账号找回。
2. 建立营地主认领、营业资质、人工审核和“已核验”工作流。
3. 增加收藏、行程单、附近搜索、距离排序、天气/防火/闭营提醒。
4. 接入国内对象存储、CDN、图片审核和敏感词审核。
5. 对接小程序、支付/退款、库存日历与订单系统。
6. 上线前完成 ICP 备案、隐私政策、用户协议与个人信息保护合规评估。
