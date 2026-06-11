-- 舞团 & 排练测试数据 (3个舞团)
USE lovelive_db;

-- 清空
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE rehearsal_participation; TRUNCATE rehearsal; TRUNCATE dancer;
TRUNCATE dance_group;
SET FOREIGN_KEY_CHECKS=1;

-- 舞团
INSERT INTO dance_group (dance_group_id, anime_group_id, name, created_date) VALUES
(1, 1, 'MuseCrew', '2024-03-15'),
(2, 2, 'Aqours Wave', '2024-06-01'),
(3, 4, 'Liella! Star', '2025-01-20');

-- 舞见
INSERT INTO dancer (dancer_id, dance_group_id, cn_name, qq) VALUES
(1,1,'小明','10001'),(2,1,'小红','10002'),(3,1,'阿橙','10003'),(4,1,'小蓝','10004'),(5,1,'凛喵','10005'),(6,1,'Maki酱','10006'),
(7,2,'海风','20001'),(8,2,'小波','20002'),(9,2,'太阳','20003'),(10,2,'贝壳','20004'),
(11,3,'可可粉','30001'),(12,3,'星星','30002'),(13,3,'月亮','30003');

-- 排练（max_participants 由 init 脚本自动修正为团人数）
INSERT INTO rehearsal (rehearsal_id, dance_group_id, rehearsal_date, start_time, end_time, location, max_participants, content_summary) VALUES
(1, 1, '2026-06-15', '14:00', '17:00', '综合楼 201', 0, 'Snow halation 初排'),
(2, 1, '2026-06-22', '14:00', '17:00', '综合楼 201', 0, 'Snow halation 合练'),
(3, 1, '2026-06-29', '18:00', '21:00', '体育馆主厅', 0, 'Snow halation 彩排'),
(4, 2, '2026-06-18', '15:00', '18:00', '海边广场', 0, '青空Jumping Heart 初排'),
(5, 2, '2026-06-25', '15:00', '18:00', '社区中心', 0, '青空Jumping Heart 合练'),
(6, 2, '2026-07-02', '10:00', '13:00', '海边广场', 0, 'MIRAI TICKET 初排'),
(7, 3, '2026-06-20', '16:00', '18:00', '青年宫 2号厅', 0, 'START!! True dreams 初排'),
(8, 3, '2026-06-27', '16:00', '18:00', '青年宫 2号厅', 0, 'START!! True dreams 合练'),
(9, 1, '2026-07-06', '14:00', '17:00', '综合楼 201', 0, '僕らは今のなかで 初排'),
(10, 2, '2026-07-09', '15:00', '18:00', '海边广场', 0, '青空Jumping Heart 彩排');

-- 参与记录（大多数满员，少数缺人）
INSERT INTO rehearsal_participation (rehearsal_id, dancer_id, character_id) VALUES
-- 排练1 MuseCrew 6/9
(1,1,1),(1,2,2),(1,3,3),(1,4,4),(1,5,5),(1,6,6),
-- 排练2 MuseCrew 6/9
(2,1,1),(2,2,2),(2,3,3),(2,4,4),(2,5,5),(2,6,6),
-- 排练3 MuseCrew 6/9
(3,1,1),(3,2,2),(3,3,3),(3,4,4),(3,5,5),(3,6,6),
-- 排练4 Aqours 4/9
(4,7,10),(4,8,12),(4,9,11),(4,10,14),
-- 排练5 Aqours 4/9
(5,7,10),(5,8,12),(5,9,11),(5,10,14),
-- 排练6 Aqours 4/9
(6,7,10),(6,8,12),(6,9,11),(6,10,14),
-- 排练7 Liella! 3/11
(7,11,31),(7,12,32),(7,13,33),
-- 排练8 Liella! 3/11
(8,11,31),(8,12,32),(8,13,33),
-- 排练9 MuseCrew 6/9
(9,1,1),(9,2,2),(9,3,3),(9,4,4),(9,5,5),(9,6,6),
-- 排练10 Aqours 4/9
(10,7,10),(10,8,12),(10,9,11),(10,10,14);

-- 修正 max_participants = 动漫团角色数（卡片个数）
UPDATE rehearsal r JOIN dance_group dg ON r.dance_group_id=dg.dance_group_id
SET r.max_participants=(SELECT COUNT(*) FROM `character` WHERE group_id=dg.anime_group_id)
WHERE dg.anime_group_id IS NOT NULL;
