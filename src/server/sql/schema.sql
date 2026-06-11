-- LoveLive! 综合管理系统 数据库初始化脚本
-- MySQL 8.0+, InnoDB, utf8mb4

CREATE DATABASE IF NOT EXISTS lovelive_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE lovelive_db;

-- ========================================
-- DDL
-- ========================================

CREATE TABLE project (
    project_id  INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    start_date  DATE,
    end_date    DATE
) ENGINE=InnoDB;

CREATE TABLE anime_group (
    group_id             INT AUTO_INCREMENT PRIMARY KEY,
    project_id           INT NOT NULL,
    name                 VARCHAR(100) NOT NULL,
    description          TEXT,
    representative_works TEXT,
    history              TEXT,
    founding_date        DATE,
    disband_date         DATE,
    image_url            VARCHAR(500),
    FOREIGN KEY (project_id) REFERENCES project(project_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_group_project (project_id),
    INDEX idx_group_name (name)
) ENGINE=InnoDB;

CREATE TABLE cv (
    cv_id      INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    birth_date DATE,
    agency     VARCHAR(100),
    image_url  VARCHAR(500),
    INDEX idx_cv_birth (birth_date)
) ENGINE=InnoDB;

CREATE TABLE `character` (
    character_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id     INT NOT NULL,
    cv_id        INT,
    name         VARCHAR(100) NOT NULL,
    image_url    VARCHAR(500),
    description  TEXT,
    birthday     VARCHAR(5),
    blood_type   ENUM('A','B','AB','O','不明'),
    height       DECIMAL(5,1),
    hobby          VARCHAR(500),
    cheering_color VARCHAR(7),
    call_response  VARCHAR(200),
    eye_color      VARCHAR(20),
    FOREIGN KEY (group_id) REFERENCES anime_group(group_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (cv_id) REFERENCES cv(cv_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_char_group (group_id),
    INDEX idx_char_name (name),
    INDEX idx_char_cv (cv_id)
) ENGINE=InnoDB;

CREATE TABLE dance_group (
    dance_group_id INT AUTO_INCREMENT PRIMARY KEY,
    anime_group_id INT,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    created_date   DATE,
    FOREIGN KEY (anime_group_id) REFERENCES anime_group(group_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_dg_anime (anime_group_id)
) ENGINE=InnoDB;

CREATE TABLE dancer (
    dancer_id       INT AUTO_INCREMENT PRIMARY KEY,
    dance_group_id  INT NOT NULL,
    cn_name         VARCHAR(100) NOT NULL,
    qq              VARCHAR(20) UNIQUE,
    contact_info    VARCHAR(200),
    FOREIGN KEY (dance_group_id) REFERENCES dance_group(dance_group_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_dancer_group (dance_group_id)
) ENGINE=InnoDB;

CREATE TABLE rehearsal (
    rehearsal_id     INT AUTO_INCREMENT PRIMARY KEY,
    dance_group_id   INT NOT NULL,
    rehearsal_date   DATE NOT NULL,
    start_time       TIME NOT NULL,
    end_time         TIME NOT NULL,
    location         VARCHAR(200) NOT NULL,
    max_participants INT DEFAULT 0,
    content_summary  TEXT,
    status           VARCHAR(20) NOT NULL DEFAULT 'active',
    stage_type       VARCHAR(20) DEFAULT '排练',
    excluded_chars   TEXT,
    extra_chars      TEXT,
    song_id          INT,
    performance_id   INT,
    FOREIGN KEY (dance_group_id) REFERENCES dance_group(dance_group_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_reh_date (rehearsal_date),
    INDEX idx_reh_group (dance_group_id)
) ENGINE=InnoDB;

CREATE TABLE rehearsal_participation (
    participation_id INT AUTO_INCREMENT PRIMARY KEY,
    rehearsal_id     INT NOT NULL,
    dancer_id        INT NOT NULL,
    character_id     INT NOT NULL,
    FOREIGN KEY (rehearsal_id) REFERENCES rehearsal(rehearsal_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (dancer_id) REFERENCES dancer(dancer_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (character_id) REFERENCES `character`(character_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_reh_dancer (rehearsal_id, dancer_id),
    INDEX idx_rp_rehearsal (rehearsal_id),
    INDEX idx_rp_dancer (dancer_id),
    INDEX idx_rp_character (character_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS concert (
  concert_id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NULL,
  label VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  concert_date DATE,
  FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS song (
  song_id INT AUTO_INCREMENT PRIMARY KEY,
  dance_group_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  FOREIGN KEY (dance_group_id) REFERENCES dance_group(dance_group_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS performance (
  performance_id INT AUTO_INCREMENT PRIMARY KEY,
  dance_group_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  performance_date DATE,
  venue VARCHAR(200),
  description TEXT,
  FOREIGN KEY (dance_group_id) REFERENCES dance_group(dance_group_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================
-- 视图
-- ========================================

CREATE VIEW rehearsal_with_count AS
SELECT
    r.rehearsal_id,
    r.dance_group_id,
    r.rehearsal_date,
    r.start_time,
    r.end_time,
    r.location,
    r.max_participants,
    r.content_summary,
    r.status,
    COUNT(rp.participation_id) AS current_participants,
    CASE
        WHEN r.max_participants = 0 THEN NULL
        ELSE ROUND(COUNT(rp.participation_id) / r.max_participants * 100, 1)
    END AS occupancy_rate,
    CASE
        WHEN r.max_participants = 0 THEN 'unlimited'
        WHEN COUNT(rp.participation_id) >= r.max_participants THEN 'full'
        WHEN COUNT(rp.participation_id) / r.max_participants >= 0.8 THEN 'near_full'
        ELSE 'available'
    END AS occupancy_status
FROM rehearsal r
LEFT JOIN rehearsal_participation rp ON r.rehearsal_id = rp.rehearsal_id
GROUP BY r.rehearsal_id;

-- ========================================
-- 触发器
-- ========================================

DELIMITER //

CREATE TRIGGER trg_rehearsal_check_max
BEFORE INSERT ON rehearsal
FOR EACH ROW
BEGIN
    IF NEW.max_participants < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '人数上限不能为负数';
    END IF;
END //

CREATE TRIGGER trg_rehearsal_update_check
BEFORE UPDATE ON rehearsal
FOR EACH ROW
BEGIN
    DECLARE cur INT;
    IF NEW.max_participants < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '人数上限不能为负数';
    END IF;
    IF NEW.max_participants > 0 THEN
        SELECT COUNT(*) INTO cur FROM rehearsal_participation WHERE rehearsal_id = NEW.rehearsal_id;
        IF cur > NEW.max_participants THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '新上限小于当前参与人数';
        END IF;
    END IF;
END //

CREATE TRIGGER trg_participation_check_full
BEFORE INSERT ON rehearsal_participation
FOR EACH ROW
BEGIN
    DECLARE mx INT; DECLARE cur INT;
    SELECT max_participants INTO mx FROM rehearsal WHERE rehearsal_id = NEW.rehearsal_id;
    SELECT COUNT(*) INTO cur FROM rehearsal_participation WHERE rehearsal_id = NEW.rehearsal_id;
    IF mx > 0 AND cur >= mx THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '该排练已满员';
    END IF;
END //

CREATE TRIGGER trg_participation_check_conflict
BEFORE INSERT ON rehearsal_participation
FOR EACH ROW
BEGIN
    DECLARE cnt INT;
    SELECT COUNT(*) INTO cnt
    FROM rehearsal_participation rp
    JOIN rehearsal r1 ON rp.rehearsal_id = r1.rehearsal_id
    JOIN rehearsal r2 ON NEW.rehearsal_id = r2.rehearsal_id
    WHERE rp.dancer_id = NEW.dancer_id
      AND rp.rehearsal_id != NEW.rehearsal_id
      AND r1.rehearsal_date = r2.rehearsal_date
      AND r1.start_time < r2.end_time
      AND r2.start_time < r1.end_time;
    IF cnt > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '该舞见当前时段已有其他排练';
    END IF;
END //

DELIMITER ;

