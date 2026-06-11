-- 曲目 & 演出数据
USE lovelive_db;

-- 曲目
INSERT INTO song (song_id, dance_group_id, name) VALUES
(1,1,'Snow halation'),(2,1,'START:DASH!!'),(3,1,'僕らは今のなかで'),(4,1,'僕たちはひとつの光'),
(5,2,'青空Jumping Heart'),(6,2,'MIRAI TICKET'),(7,2,'HAPPY PARTY TRAIN'),
(8,3,'未来予報ハレルヤ！'),(9,3,'START!! True dreams'),(10,3,'ビタミンSUMMER！')
ON DUPLICATE KEY UPDATE name=name;

-- 演出
INSERT INTO performance (performance_id, dance_group_id, name, performance_date, venue) VALUES
(1,1,'夏日学园祭2026','2026-07-15','体育馆主厅'),
(2,2,'海边Live Fes','2026-07-20','海边广场'),
(3,3,'青年宫动漫音乐会','2026-07-25','青年宫大剧场');
