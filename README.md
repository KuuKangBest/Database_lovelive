# LoveLive! 综合管理系统

一个 LoveLive! 主题的全栈 Web 应用，包含动漫角色信息查询和舞团排练时间管理两个子系统。

## 项目概览

| 子系统 | 干什么 | 涉及的表 |
|--------|--------|----------|
| 角色介绍 | 浏览企划、动漫团、角色、声优，支持按年龄/团名等筛选 | project, anime_group, cv, character |
| 排练管理 | 舞团排练的增删改查，展示每个时段的参与人数和饱和度 | dance_group, dancer, rehearsal, rehearsal_participation |

两个子系统通过 `anime_group ↔ dance_group` 和 `character ↔ rehearsal_participation` 两条外键打通。

## 技术栈

```
浏览器 (HTML/CSS/JS) → Node.js + Express → MySQL 8.0 (InnoDB)
```

- **前端**：原生 HTML + CSS + JS，粉色主题
- **后端**：Node.js + Express + mysql2 连接池
- **数据库**：8 张表、3 个视图、4 个触发器
- **数据量**：5 企划 · 8 团体 · 48 角色 · 50 声优

## 文件结构

```
lab2/
├── README.md              ← 本文件
├── config.js              ← 数据库密码等配置（先改这里）
├── server.js              ← API 后端
├── start.js               ← 一键启动脚本
├── stop.js                ← 停止服务
├── init-db.js             ← 初始化数据库
├── index.html             ← 前端页面
├── package.json
├── requirements.md        ← 需求分析文档
├── er-diagram.md          ← ER 图 (Mermaid)
├── notes.md               ← 实验要求备忘
├── sql/
│   └── init.sql           ← 建表 + 测试数据 + 视图 + 触发器
├── data/                  ← 搜集的原始数据（供参考）
│   ├── 01-企划信息.md
│   ├── 02-动漫团信息.md
│   ├── 03-角色信息.md
│   ├── 04-声优信息.md
│   └── 05-关联映射.md
└── db-lab02_2026.pdf      ← 原始实验说明
```

## 快速开始

### 环境要求

- Node.js ≥ 18
- MySQL 8.0 已启动
- 修改 `config.js` 中的数据库密码

### 一键启动

```bash
npm install        # 首次：安装依赖
npm run init-db    # 首次：初始化数据库
npm start          # 启动（自动检查 MySQL、释放端口、打开浏览器）
npm run stop       # 停止服务
```

浏览器自动打开 **http://localhost:3000**。

## API 接口

### 企划
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 企划列表 |
| GET | `/api/projects/:id` | 企划详情 |

### 动漫团
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/groups` | 团体列表（`?project_id=` 按企划筛选） |
| GET | `/api/groups/:id` | 团体详情 + 成员列表 |

### 角色
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/characters` | 角色列表（`?group_id=&search=&cv_age_min=&cv_age_max=`） |
| GET | `/api/characters/:id` | 角色详情 + 关联的排练记录 |

### 声优
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/seiyuu` | 声优列表（`?age_min=&age_max=`） |
| GET | `/api/seiyuu/:id` | 声优详情 + 配音角色 |

### 排练
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/rehearsals` | 排练列表（`?date_from=&date_to=&status=&dance_group_id=`） |
| GET | `/api/rehearsals/:id` | 排练详情 + 参与人员 |
| POST | `/api/rehearsals` | 新增排练 |
| PUT | `/api/rehearsals/:id` | 修改排练 |
| DELETE | `/api/rehearsals/:id` | 删除排练（级联删除参与记录） |
| POST | `/api/rehearsals/:id/participants` | 添加参与舞见（触发器检查满员/冲突） |
| DELETE | `/api/rehearsals/:reh_id/participants/:part_id` | 移除参与舞见 |

### 舞团 / 舞见
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/dance-groups` | 列表 / 新建舞团 |
| GET | `/api/dance-groups/:id` | 舞团详情 + 成员 + 排练 |
| GET/POST | `/api/dancers` | 列表 / 新建舞见（`?dance_group_id=`） |

### 统计
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 企划/团体/角色/声优/排练 数量 |

## 数据库设计

### 表

| 表 | 行数 | 关键约束 |
|----|------|----------|
| project | 5 | name UNIQUE |
| anime_group | 8 | FK → project (CASCADE) |
| cv | 50 | birth_date 上有索引 |
| character | 48 | FK → anime_group (CASCADE), FK → cv (SET NULL) |
| dance_group | 动态 | FK → anime_group (SET NULL) |
| dancer | 动态 | FK → dance_group (CASCADE) |
| rehearsal | 动态 | FK → dance_group (CASCADE), max_participants ≥ 0 |
| rehearsal_participation | 动态 | UNIQUE(rehearsal_id, dancer_id, character_id) |

### 视图

- **rehearsal_with_count** — 排练人数统计：当前参与人数 + 饱和度百分比 + 状态分级
- **character_rehearsal_summary** — 角色排练汇总：每个角色参与了多少次排练、涉及多少舞团
- **dancer_schedule_conflict_view** — 舞见时间冲突检测

### 触发器

| 触发器 | 表 | 时机 | 作用 |
|--------|-----|------|------|
| trg_rehearsal_check_max | rehearsal | INSERT | max_participants 不能为负数 |
| trg_rehearsal_update_check | rehearsal | UPDATE | 上限不能小于当前参与人数 |
| trg_participation_check_full | rehearsal_participation | INSERT | 满员时拒绝添加 |
| trg_participation_check_conflict | rehearsal_participation | INSERT | 同舞见同时间冲突时拒绝 |

### 级联删除策略

| 父 → 子 | 策略 |
|----------|------|
| project → anime_group | CASCADE |
| anime_group → character | CASCADE |
| cv → character | SET NULL |
| anime_group → dance_group | SET NULL |
| dance_group → dancer | CASCADE |
| dance_group → rehearsal | CASCADE |
| rehearsal → rehearsal_participation | CASCADE |
| dancer → rehearsal_participation | CASCADE |
| character → rehearsal_participation | CASCADE |

## 饱和度分级

每个排练通过 `rehearsal_with_count` 视图计算饱和度：

| 状态 | 条件 | 前端颜色 |
|------|------|----------|
| unlimited | 上限 = 0 | 灰 |
| available | < 50% | 绿 |
| near_full | 50% ~ 99% | 黄/橙 |
| full | ≥ 100% | 红 |

满员排练再添加参与舞见会被触发器拒绝。

## TODO

- [ ] 排练详情页点击参与角色名跳转到角色详情
- [ ] 月视图：用颜色圆点展示每日排练的饱和度热力图
- [ ] 前端表单增加角色下拉选择器，替代手动填角色 ID
- [ ] 增加图片上传功能，角色和声优支持本地图片
- [ ] 用户登录与舞团权限管理
- [ ] 排练数据导出为 CSV/Excel
- [ ] 莲之空角色的详细信息补全（声优出生日期、角色血型等）
- [ ] 暗色模式

---

王玺玮 · PB23071333 · 数据库系统及应用 实验二 · 2026
