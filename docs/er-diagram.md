# LoveLive! 综合管理系统 — 概要设计 ER 图

> [姓名] &emsp; [学号] &emsp; 2026-06-01

---

## 实体关系图

```mermaid
erDiagram
    PROJECT {
        int project_id PK "企划ID"
        varchar name UK "企划名称"
        text description "企划简介"
        date start_date "开始日期"
        date end_date "结束日期"
    }

    ANIME_GROUP {
        int group_id PK "动漫团ID"
        int project_id FK "所属企划"
        varchar name "团名"
        text description "团队介绍"
        text representative_works "代表作"
        text history "历史沿革"
        date founding_date "成立日期"
        date disband_date "解散日期"
        varchar image_url "团队图片URL"
    }

    CV {
        int cv_id PK "声优ID"
        varchar name "声优姓名"
        date birth_date "出生日期"
        varchar agency "所属事务所"
        varchar image_url "声优照片URL"
    }

    CHARACTER {
        int character_id PK "角色ID"
        int group_id FK "所属动漫团"
        int cv_id FK "配音声优"
        varchar name "角色名"
        varchar image_url "角色图片URL"
        text description "角色简介"
        date birthday "生日"
        varchar blood_type "血型"
        decimal height "身高cm"
        varchar hobby "爱好"
    }

    DANCE_GROUP {
        int dance_group_id PK "舞团ID"
        int anime_group_id FK "翻跳的动漫团"
        varchar name "舞团名称"
        text description "舞团简介"
        date created_date "创建日期"
    }

    DANCER {
        int dancer_id PK "舞见ID"
        int dance_group_id FK "所属舞团"
        varchar cn_name "舞见CN"
        varchar contact_info "联系方式"
    }

    REHEARSAL {
        int rehearsal_id PK "排练ID"
        int dance_group_id FK "所属舞团"
        date rehearsal_date "排练日期"
        time start_time "开始时间"
        time end_time "结束时间"
        varchar location "排练地点"
        int max_participants "人数上限"
        text content_summary "排练内容简介"
    }

    REHEARSAL_PARTICIPATION {
        int participation_id PK "参与记录ID"
        int rehearsal_id FK "排练ID"
        int dancer_id FK "舞见ID"
        int character_id FK "扮演角色ID"
    }

    PROJECT ||--o{ ANIME_GROUP : "1:N 包含"
    ANIME_GROUP ||--o{ CHARACTER : "1:N 拥有"
    CV ||--o{ CHARACTER : "1:N 配音"
    ANIME_GROUP ||--o{ DANCE_GROUP : "1:N 被翻跳"
    DANCE_GROUP ||--o{ DANCER : "1:N 拥有成员"
    DANCE_GROUP ||--o{ REHEARSAL : "1:N 安排"
    REHEARSAL ||--o{ REHEARSAL_PARTICIPATION : "1:N 包含"
    DANCER ||--o{ REHEARSAL_PARTICIPATION : "1:N 参与"
    CHARACTER ||--o{ REHEARSAL_PARTICIPATION : "1:N 被扮演"
```

## 子系统划分

```mermaid
flowchart LR
    subgraph S1["动漫角色介绍子系统"]
        direction TB
        PROJECT((企划))
        ANIME_GROUP((动漫团))
        CHARACTER((角色))
        CV((声优))

        PROJECT --> ANIME_GROUP
        ANIME_GROUP --> CHARACTER
        CV --> CHARACTER
    end

    subgraph S2["舞台排练时间收集子系统"]
        direction TB
        DANCE_GROUP((舞团))
        DANCER((舞见))
        REHEARSAL((排练))
        PARTICIPATION((排练参与))

        DANCE_GROUP --> DANCER
        DANCE_GROUP --> REHEARSAL
        REHEARSAL --> PARTICIPATION
        DANCER --> PARTICIPATION
    end

    ANIME_GROUP -.->|"anime_group_id"| DANCE_GROUP
    CHARACTER -.->|"character_id"| PARTICIPATION
```

## 实体清单

| 实体 | 中文名 | 所属子系统 | 行数估算 |
|------|--------|-----------|----------|
| PROJECT | 企划 | 角色介绍 | ~5 |
| ANIME_GROUP | 动漫团 | 角色介绍 | ~10 |
| CV | 声优 | 角色介绍 | ~50 |
| CHARACTER | 角色 | 角色介绍 | ~100 |
| DANCE_GROUP | 舞团 | 排练收集 | 动态增长 |
| DANCER | 舞见 | 排练收集 | 动态增长 |
| REHEARSAL | 排练 | 排练收集 | 动态增长 |
| REHEARSAL_PARTICIPATION | 排练参与 | 排练收集 | 动态增长 |

## 关系与级联策略

| 父实体 | 子实体 | 基数 | 子表外键 | 级联删除 |
|--------|--------|------|----------|----------|
| PROJECT | ANIME_GROUP | 1:N | project_id | CASCADE |
| ANIME_GROUP | CHARACTER | 1:N | group_id | CASCADE |
| CV | CHARACTER | 1:N | cv_id | SET NULL |
| ANIME_GROUP | DANCE_GROUP | 1:N | anime_group_id | SET NULL |
| DANCE_GROUP | DANCER | 1:N | dance_group_id | CASCADE |
| DANCE_GROUP | REHEARSAL | 1:N | dance_group_id | CASCADE |
| REHEARSAL | REHEARSAL_PARTICIPATION | 1:N | rehearsal_id | CASCADE |
| DANCER | REHEARSAL_PARTICIPATION | 1:N | dancer_id | CASCADE |
| CHARACTER | REHEARSAL_PARTICIPATION | 1:N | character_id | CASCADE |
