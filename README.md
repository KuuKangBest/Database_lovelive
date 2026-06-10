# LoveLive! 综合管理系统

LoveLive! 主题全栈 Web 应用：动漫角色介绍 + 舞团排练管理。

## 项目概览

| 子系统 | 功能 | 核心表 |
|--------|------|--------|
| 角色介绍 | 企划/团体/角色/声优浏览筛选，关系图谱，演唱会时间轴 | project, anime_group, cv, character, concert |
| 排练管理 | 排练 CRUD，成员卡片指派（按动漫团全员展示），时间冲突检测 | dance_group, dancer, rehearsal, rehearsal_participation |

## 技术栈

```
浏览器 (HTML/CSS/JS) → Node.js Express → MySQL 8.0 (InnoDB)
```

- **前端**：原生三件套，粉色 LoveLive 主题，滚动触发动画
- **后端**：Node.js + Express + mysql2，dateStrings 纯净日期
- **数据库**：9 表 · 1 视图 · 3 触发器（满员检查已移除，改为卡片数驱动）
- **数据**：7 企划 · 9 团体 · 67 角色 · 60+ 声优 · 45 场演唱会

## 文件结构

```
lab2/
├── README.md
├── config.js                  ← 数据库配置（先改这里）
├── package.json
├── .gitignore
├── src/
│   ├── server/
│   │   ├── server.js          ← Express API
│   │   ├── start.js           ← 一键启动（MySQL检查→端口释放→启动→开浏览器）
│   │   ├── stop.js            ← 停止服务
│   │   ├── init-db.js         ← 分层初始化（schema→seed→descriptions→test）
│   │   ├── seed-db.js         ← 单独加载排练测试数据
│   │   └── sql/
│   │       ├── schema.sql     ← DDL（表·视图·触发器）
│   │       ├── seed-data.sql  ← 基础数据
│   │       ├── character-descriptions.sql ← 角色描述
│   │       ├── character-call-response.sql ← 应援色·互动词
│   │       ├── concerts.sql   ← 演唱会时间轴
│   │       └── test-data.sql  ← 排练测试数据
│   └── client/
│       ├── index.html         ← 前端骨架
│       ├── css/style.css      ← 全部样式
│       ├── js/app.js          ← 全部逻辑
│       ├── images/
│       │   ├── logos/         ← 团体 Logo（μ's, Aqours, 虹咲, Liella!, 莲之空, 青鸟, Saint Snow, Sunny Passion）
│       │   └── chars/         ← 角色 PNG 立绘（char-{id}.png, ~65张）
│       └── logos/             ← 原始 logo 文件
├── scripts/
│   └── download-images.js     ← 图片下载脚本
└── docs/
    ├── requirements.md        ← 需求分析
    ├── er-diagram.md          ← ER 图 (Mermaid)
    ├── notes.md               ← 实验备忘
    ├── db-lab02_2026.pdf      ← 原始实验 PDF
    └── data/                  ← 搜集的原始资料
```

## 快速开始

```bash
npm install        # 首次：安装依赖
npm run init-db    # 首次：初始化数据库（分层加载）
npm start          # 一键启动 → http://localhost:3000
npm run stop       # 停止服务
npm run seed       # 单独重载排练测试数据
npm run reinit     # 重置数据库 + 启动
```

## 数据规模

| 企划 | 团体 | 角色数 |
|------|------|--------|
| LoveLive! | μ's, A-RISE | 9 + 3 |
| LoveLive! Sunshine!! | Aqours, Saint Snow | 9 + 2 |
| LoveLive! 虹咲学园 | 虹咲学园学园偶像同好会 | 12 |
| LoveLive! Superstar!! | Liella!, Sunny Passion | 11 + 2 |
| Link! Like! LoveLive! | 莲之空女学院 | 8在校+3毕业 |
| 生如百戏难！LOVELIVE! 青鸟 | 人生不易部！ | 10 |

## 主要功能

### 角色介绍
- **企划 → 动漫团 → 角色** 三级导航跳转
- 角色卡片：立绘背景 + 应援色圆点 + 爱好/描述
- **角色详情弹窗**：完整信息 + 瞳色 + 应援色 + 互动词 + 近期排练记录
- **关系图谱**：Canvas 动态力导向图，应援色节点，姐妹/搭档/幼驯染/憧憬关系，跨团联动，双向箭头
- **演唱会时间轴**：7 企划 45 场，标签（1巡/Final/拼盘），表格对齐，企划页有联合拼盘入口
- 动漫团 Logo 卡片背景
- 角色页可按团体迷你卡片多选筛选

### 排练管理
- 排练 CRUD + 日期/状态筛选
- **成员卡片展示**：按舞团关联的动漫团全员展示
  - 已指派：角色应援色边框 + 舞见 CN
  - 空缺：灰色虚框 + 点击快速指派
- **删减角色**：编辑模式下灰卡抖动，点击移除非必要角色
- 点击彩色卡片可修改/删除舞见
- 时间冲突触发器自动检测
- 删除排练级联清除参与记录

### 交互
- 滚动视口触发淡入动画
- 首页四卡片点击跳转 + 悬停放大
- 所有子页面"回到首页"按钮

## API 接口

### 新增/变更接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/concerts?project_id=` | 演唱会列表 |
| DELETE | `/api/rehearsals/:id/chars/:charId` | 移除排练中的角色卡片 |
| PUT | `/api/rehearsals/:id` | 修改排练（含 excluded_chars） |

### 已有接口

同之前文档，详见 `server.js`。关键变更：
- `/api/groups` 返回 `char_count`
- `/api/characters` 返回 `eye_color`, `cheering_color`, `call_response`
- 所有日期返回纯 `YYYY-MM-DD` 字符串

## 数据库设计

### 新增表

| 表 | 说明 |
|----|------|
| concert | 演唱会时间轴（45条记录，含 label 标签列） |

### 新增字段

| 表 | 字段 | 说明 |
|----|------|------|
| character | cheering_color | 应援色 #RRGGBB |
| character | call_response | 演唱会互动词 |
| character | eye_color | 瞳色 |
| rehearsal | excluded_chars | 逗号分隔的排除角色ID |

### 触发器（当前）

| 触发器 | 作用 |
|--------|------|
| trg_rehearsal_check_max | INSERT 时 max_participants ≥ 0 |
| trg_rehearsal_update_check | UPDATE 时上限不低于当前人数 |
| trg_participation_check_conflict | INSERT 时同舞见同时间冲突拒绝 |

> `trg_participation_check_full` 已移除——人数由卡片数量驱动，不再用 max_participants 限制添加。

## TODO

- [ ] 排练新增时根据舞团关联的动漫团自动预选全员角色
- [ ] 角色卡片点击立绘放大预览
- [ ] 声优独立页面（目前嵌入角色列表）
- [ ] 莲之空 104/105 期生详细信息补全（瞳色、应援色、互动词）
- [ ] 青鸟/人生不易部 声优出生日期补全
- [ ] 唐可可等 5 个缺失立绘补充下载
- [ ] 数据库 `init.sql` 旧引用清理（已拆分为多层 SQL）
- [ ] 排练人员修改时的表单改为下拉选择器（替代 prompt 弹窗）
- [ ] 月视图排练日历
- [ ] 排练数据导出 CSV/Excel
- [ ] 用户登录与舞团权限
- [ ] 暗色模式

---

王玺玮 · PB23071333 · 数据库系统及应用 实验二 · 2026
