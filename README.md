# LoveLive! 综合管理系统

LoveLive! 主题全栈 Web 应用：动漫角色介绍 + 舞团排练管理。B/S 架构，前端纯 HTML/CSS/JS，后端 Node.js + Express，数据库 MySQL 8.0。

## 快速开始

**前置条件**：Node.js 18+、MySQL 8.0+（需提前启动 MySQL 服务）。

```bash
# 1. 克隆仓库
git clone https://github.com/KuuKangBest/Database_lovelive.git
cd Database_lovelive

# 2. 编辑 config.js，修改 MySQL 连接信息（host/user/password）

# 3. 安装依赖并一键启动
npm install
npm start          # 自动检查 MySQL → 初始化数据库 → 启动服务 → 打开浏览器
```

其他常用命令：

```bash
npm run init-db    # 删库重建 + 分层导入全部数据
npm run seed       # 仅导入种子数据（不删表）
npm run reinit     # 重置数据库 + 启动
```

## 项目概览

| 子系统 | 功能 | 核心表 |
|--------|------|--------|
| 角色介绍 | 企划/团体/角色/声优浏览筛选，关系图谱，演唱会时间轴，语义搜索 | project, anime_group, cv, character, concert, character_relationship |
| 排练管理 | 排练 CRUD，角色槽位指派，舞见推荐，多团支持，时间冲突检测 | dance_group, dancer, dancer_group_membership, rehearsal, rehearsal_participation |

## 技术栈

- **前端**：原生三件套（HTML/CSS/JS），单页应用，Canvas 力导向关系图谱，IntersectionObserver 滚动动画
- **后端**：Node.js + Express + mysql2/promise，49 个 API 端点，连接池 10，请求日志中间件
- **数据库**：MySQL 8.0 InnoDB，12 表 · 1 视图 · 4 触发器 · 16 条外键，utf8mb4
- **语义搜索**：纯 JS 实现 TF-IDF + Cosine Similarity，bigram 分词，18 组同义词扩展
- **数据**：6 企划 · 9 动漫团 · 67 角色 · 60 声优 · 36 条排练测试数据

## 文件结构

```
lab2/
├── README.md
├── config.js                       ← 数据库配置（先改这里）
├── package.json
├── src/
│   ├── server/
│   │   ├── server.js               ← Express API（49 端点）
│   │   ├── start.js                ← 一键启动
│   │   ├── init-db.js              ← 分层初始化
│   │   ├── seed-db.js              ← 单独加载排练测试数据
│   │   ├── semantic-search.js      ← TF-IDF 语义搜索引擎
│   │   └── sql/
│   │       ├── schema.sql          ← DDL（12 表 · 1 视图 · 4 触发器）
│   │       ├── seed-data.sql       ← 基础数据（企划·团体·角色·声优）
│   │       ├── character-descriptions.sql  ← 角色简介
│   │       ├── character-call-response.sql ← 互动词
│   │       ├── eye-colors.sql      ← 瞳色
│   │       ├── character-relationships.sql ← 角色关系
│   │       ├── concerts.sql        ← 演唱会时间轴
│   │       ├── songs.sql           ← 曲目与演出
│   │       └── test-data.sql       ← 排练测试数据（舞团·舞见·排练）
│   └── client/
│       ├── index.html              ← 前端骨架
│       ├── css/style.css           ← 全部样式
│       ├── js/app.js               ← 全部逻辑（~1100 行）
│       └── images/
│           ├── logos/              ← 团体 Logo（μ's, Aqours, 虹咲, Liella!, 莲之空, A-RISE 等）
│           └── chars/              ← 角色立绘（char-{id}.png）
└── docs/
    ├── 实验报告.md                  ← 完整实验报告（含 ER 图、级联策略、前端详述、18 张截图）
    ├── requirements.md             ← 需求分析
    ├── er-diagram.md               ← ER 图 (Mermaid)
    ├── db-lab02_2026.pdf           ← 原始实验要求
    ├── notes.md
    ├── data/                       ← 搜集的原始资料
    └── image/                      ← 18 张功能截图
```

## 数据规模

| 企划 | 团体 | 角色数 |
|------|------|--------|
| LoveLive! | μ's, A-RISE | 9 + 3 |
| LoveLive! Sunshine!! | Aqours, Saint Snow | 9 + 2 |
| LoveLive! 虹咲学园 | 虹咲学园学园偶像同好会 | 12 |
| LoveLive! Superstar!! | Liella!, Sunny Passion | 11 + 2 |
| Link! Like! LoveLive! | 莲之空女学院 | 8 |
| 生如百戏难！LOVELIVE! 青鸟 | 人生不易部！ | 10 |

## 主要功能

### 角色介绍子系统
- **企划/团体/角色** 三级导航跳转，筛选联动
- **角色搜索**：多关键词空格分隔搜索（9 个字段 AND 匹配，相关性评分排序）
- **语义搜索**：TF-IDF + Cosine 向量检索，支持同义词扩展，自然语言描述搜角色
- **角色详情弹窗**：完整信息 + 瞳色 + 应援色 + 互动词 + 近期排练记录
- **关系图谱**：Canvas 力导向图，应援色节点，8 种关系类型（姐妹/幼驯染/搭档/挚友/憧憬/对手/同学/师徒），点击节点跳转
- **演唱会时间轴**：按巡次分色标签，企划页含跨团拼盘入口

### 排练管理子系统
- **排练 CRUD**：日期/舞团/状态筛选，按曲目分组展示
- **角色槽位卡片网格**：按舞团关联的动漫团全员展示角色卡片，已填显示舞见名，空缺可指派
- **指派弹窗**：本团/别团推荐（按历史出演次数降序），CN/QQ 搜索，支持新建舞见
- **角色槽位管理**：可移除多余角色（excluded_chars），可添加跨团额外角色（extra_chars）
- **新建排练**：选舞团自动加载角色槽位，每个槽位可指派舞见，事务保证一致性
- **排练状态**：支持取消/恢复排练

### 舞团与舞见管理
- **舞团 CRUD**：翻跳团体必选，解散级联删除
- **舞见多团支持**：dancer_group_membership 关联表，一舞见可属多团
- **角色偏见筛选**：按角色 mini 卡片多选，反查历史扮演过该角色的舞见
- **舞见详情**：出演角色统计（按次数降序）+ 全部排练记录
- **QQ 号码验证**：前后端双重校验，必须为纯数字

### 交互体验
- 首页统计卡片 + 排练日历 + 未来两周排练
- 排练饱和度分级标签（unlimited/available/near_full/full），四色区分
- 已取消排练灰色标注
- IntersectionObserver 滚动淡入动画
- 所有弹窗点击遮罩关闭

## 数据库设计

### 表清单

| 表 | 说明 | 行数 |
|----|------|------|
| project | 企划 | 6 |
| anime_group | 动漫团 | 9 |
| cv | 声优 | 60 |
| character | 角色 | 67 |
| character_relationship | 角色关系 | — |
| concert | 演唱会时间轴 | — |
| dance_group | 舞团 | — |
| dancer | 舞见 | — |
| dancer_group_membership | 舞见多团关联 | — |
| rehearsal | 排练 | 36 |
| rehearsal_participation | 排练参与 | — |
| song / performance | 曲目与演出 | — |

### 视图

`rehearsal_with_count`：聚合排练当前参与人数 + 饱和度分级（unlimited/available/near_full/full）。

### 触发器

| 触发器 | 作用 |
|--------|------|
| trg_rehearsal_check_max | INSERT 时 max_participants ≥ 0 |
| trg_rehearsal_update_check | UPDATE 时上限不低于当前人数 |
| trg_participation_check_full | INSERT 时满员拒绝 |
| trg_participation_check_conflict | INSERT 时同舞见同时间冲突拒绝 |

### 级联策略

| 父 → 子 | 删除策略 |
|---------|----------|
| project → anime_group, character → relationship, dance_group → rehearsal/rp/song/performance, dancer/rp → rp | CASCADE |
| cv → character, anime_group → dance_group, dance_group → dancer | SET NULL |

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/projects | 全部企划 |
| GET | /api/projects/:id | 单企划 |
| GET | /api/groups | 全部动漫团（?project_id） |
| GET | /api/groups/:id | 动漫团详情（含成员） |
| GET | /api/characters | 角色列表（?group_id/?search/?cv_age） |
| GET | /api/characters/semantic | 语义搜索（?q=&top=） |
| GET | /api/characters/:id | 角色详情（含排练记录） |
| GET | /api/characters/:id/relationships | 角色关系 |
| GET | /api/seiyuu | 声优列表（?age_min/?age_max） |
| GET | /api/seiyuu/:id | 声优详情（含配音角色） |
| GET | /api/dance-groups | 舞团列表 |
| GET/POST/DELETE | /api/dance-groups/:id | 舞团详情/新建/删除 |
| GET/POST/PUT/DELETE | /api/dancers | 舞见 CRUD |
| GET | /api/dancers/search | 舞见搜索（?q=） |
| GET | /api/dancers/recommend | 舞见推荐 |
| GET | /api/dancers/by-character | 按角色反查舞见 |
| GET | /api/dancers/:id/stats | 舞见出演统计 |
| GET | /api/dancers/:id/rehearsals | 舞见全部排练 |
| GET | /api/dancers/:id/groups | 舞见所属舞团 |
| DELETE | /api/dancers/:id/groups/:gid | 从指定舞团移除 |
| GET/POST/PUT/DELETE | /api/rehearsals | 排练 CRUD |
| PUT | /api/rehearsals/:id/status | 取消/恢复排练 |
| POST | /api/rehearsals/:id/participants | 指派舞见 |
| POST | /api/rehearsals/:id/participants/simple | 简化指派 |
| DELETE | /api/rehearsals/:id/participants/:pid | 删除参与记录 |
| DELETE | /api/rehearsals/:id/chars/:cid | 移除角色槽位 |
| POST | /api/rehearsals/:id/chars | 加回已排除角色 |
| POST | /api/rehearsals/:id/slots/:cid | 新增跨团角色槽位 |
| GET | /api/relationships | 全部角色关系 |
| GET | /api/concerts | 演唱会列表 |
| GET | /api/stats | 首页统计 |

---

[姓名] · [学号] · 数据库系统及应用 实验二 · 2026
