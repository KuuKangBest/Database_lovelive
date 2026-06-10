-- LoveLive 系列演唱会时间轴
CREATE TABLE IF NOT EXISTS concert (
  concert_id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NULL,
  label VARCHAR(20) NOT NULL COMMENT '标签: 1巡 2巡 Final 拼盘 联合等',
  name VARCHAR(200) NOT NULL,
  concert_date DATE,
  FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE SET NULL
) ENGINE=InnoDB;
TRUNCATE concert;

INSERT INTO concert (project_id, label, name, concert_date) VALUES
-- μ's ──
(1,'1巡','μ''s 1st LoveLive!','2012-02-19'),
(1,'2巡','μ''s New Year LoveLive! 2013','2013-01-03'),
(1,'3巡','μ''s 3rd Anniversary LoveLive!','2013-06-16'),
(1,'4巡','μ''s →NEXT LoveLive! 2014 〜ENDLESS PARADE〜','2014-02-08'),
(1,'5巡','μ''s Go→Go! LoveLive! 2015 〜Dream Sensation!〜','2015-01-31'),
(1,'Final','μ''s Final LoveLive! 〜μ''sic Forever〜','2016-03-31'),

-- Aqours ──
(2,'1巡','Aqours 1st Live 〜Step! ZERO to ONE〜','2017-02-25'),
(2,'2巡','Aqours 2nd Live HAPPY PARTY TRAIN TOUR','2017-08-05'),
(2,'3巡','Aqours 3rd Live Tour 〜WONDERFUL STORIES〜','2018-06-09'),
(2,'4巡','Aqours 4th Live 〜Sailing to the Sunshine〜','2018-11-17'),
(2,'5巡','Aqours 5th Live 〜Next SPARKLING!!〜','2019-06-08'),
(2,'6巡','Aqours 6th Live 〜KU-RU-KU-RU Rock''n''Roll TOUR〜','2022-02-12'),
(2,'Finale','Aqours Finale LoveLive! 〜永久stage〜','2025-06-21'),

-- 虹咲学园 ──
(3,'1巡','虹咲学园 1st Live with You','2019-12-14'),
(3,'2巡','虹咲学园 2nd Live! Brand New Story','2020-09-12'),
(3,'3巡','虹咲学园 3rd Live! 〜夢の始まり〜','2021-05-08'),
(3,'4巡','虹咲学园 4th Live! 〜Love the Life We Live〜','2022-02-26'),
(3,'5巡','虹咲学园 5th Live! 虹が咲く場所','2023-02-25'),
(3,'6巡','虹咲学园 6th Live! I love You 〜届け〜','2024-02-24'),
(3,'7巡','虹咲学园 7th Live! 〜WHERE I BELONG〜','2025-02-01'),

-- Liella! ──
(4,'1巡','Liella! 1st Live Tour 〜Starlines〜','2021-10-30'),
(4,'2巡','Liella! 2nd Live 〜What a Wonderful Dream!!〜','2022-09-24'),
(4,'3巡','Liella! 3rd Live Tour 〜WE WILL!!〜','2023-08-19'),
(4,'4巡','Liella! 4th Live Tour 〜brand new Spider〜','2024-06-01'),
(4,'5巡','Liella! 5th Live 〜Twinkle Triangle〜','2025-01-04'),

-- 莲之空 ──
(5,'首演','莲之空 OPENING LIVE EVENT 〜Bloom the Dream〜','2023-04-16'),
(5,'1巡','莲之空 1st Live Tour 〜RUN！CAN！FUN！〜','2023-10-21'),
(5,'2巡','莲之空 2nd Live Tour 〜Blooming with ○○○〜','2024-06-15'),
(5,'3巡','莲之空 Live & Fan Meeting TRY TRY UNITY!!!','2025-02-08'),
(5,'Fes','莲之空 103期 Fes×ReC：LIVE 〜first crossing〜','2024-03-30'),

-- 系列联合 / 拼盘
(NULL,'拼盘','LoveLive! Series 9th Anniversary LOVE LIVE! FEST','2020-01-18'),
(NULL,'拼盘','COUNTDOWN LoveLive! 2021→2022 〜LIVE with a smile!〜','2021-12-31'),
(NULL,'联合','异次元FES 偶像大师★♥LoveLive!歌合战','2023-12-09'),
(NULL,'拼盘','LoveLive! Series Presents Unit甲子园 2024','2024-03-09'),
(NULL,'拼盘','LoveLive! Series Asia Tour 2024 〜伴你圆梦〜','2024-10-06'),
(NULL,'拼盘','LoveLive! Series 15th Anniversary LOVE LIVE! FEST','2026-11-14');
