-- LoveLive! 角色瞳色数据更新
-- 基于官方设定资料整理
USE lovelive_db;

-- ========== μ's (9人) ==========
UPDATE `character` SET eye_color='蓝色' WHERE character_id=1;   -- 高坂穗乃果
UPDATE `character` SET eye_color='冰蓝色' WHERE character_id=2; -- 绚濑绘里
UPDATE `character` SET eye_color='琥珀色' WHERE character_id=3; -- 南小鸟
UPDATE `character` SET eye_color='褐色' WHERE character_id=4;   -- 园田海未
UPDATE `character` SET eye_color='黄绿色' WHERE character_id=5; -- 星空凛
UPDATE `character` SET eye_color='紫罗兰色' WHERE character_id=6; -- 西木野真姬
UPDATE `character` SET eye_color='蓝绿色' WHERE character_id=7; -- 东条希
UPDATE `character` SET eye_color='紫色' WHERE character_id=8;   -- 小泉花阳
UPDATE `character` SET eye_color='红色' WHERE character_id=9;   -- 矢泽妮可

-- ========== Aqours (9人) ==========
UPDATE `character` SET eye_color='红色' WHERE character_id=10;   -- 高海千歌
UPDATE `character` SET eye_color='琥珀色' WHERE character_id=11; -- 樱内梨子
UPDATE `character` SET eye_color='蓝色' WHERE character_id=12;   -- 渡边曜
UPDATE `character` SET eye_color='紫红色' WHERE character_id=13; -- 津岛善子
UPDATE `character` SET eye_color='金棕色' WHERE character_id=14; -- 国木田花丸
UPDATE `character` SET eye_color='粉色' WHERE character_id=15;   -- 黑泽露比
UPDATE `character` SET eye_color='青绿色' WHERE character_id=16; -- 松浦果南
UPDATE `character` SET eye_color='蓝色' WHERE character_id=17;   -- 黑泽黛雅
UPDATE `character` SET eye_color='紫色' WHERE character_id=18;   -- 小原鞠莉

-- ========== 虹咲学园 (12人) ==========
UPDATE `character` SET eye_color='粉色' WHERE character_id=19;   -- 上原步梦
UPDATE `character` SET eye_color='黄色' WHERE character_id=20;   -- 中须霞
UPDATE `character` SET eye_color='蓝色' WHERE character_id=21;   -- 樱坂雫
UPDATE `character` SET eye_color='紫色' WHERE character_id=22;   -- 朝香果林
UPDATE `character` SET eye_color='橙色' WHERE character_id=23;   -- 宫下爱
UPDATE `character` SET eye_color='蓝色' WHERE character_id=24;   -- 近江彼方
UPDATE `character` SET eye_color='红色' WHERE character_id=25;   -- 优木雪菜
UPDATE `character` SET eye_color='绿色' WHERE character_id=26;   -- 艾玛·薇蒂
UPDATE `character` SET eye_color='银灰色' WHERE character_id=27; -- 天王寺璃奈
UPDATE `character` SET eye_color='蓝色' WHERE character_id=28;   -- 三船栞子
UPDATE `character` SET eye_color='绿色' WHERE character_id=29;   -- 米雅·泰勒
UPDATE `character` SET eye_color='红色' WHERE character_id=30;   -- 钟岚珠

-- ========== Liella! (11人) ==========
UPDATE `character` SET eye_color='紫色' WHERE character_id=31;   -- 涩谷香音
UPDATE `character` SET eye_color='蓝色' WHERE character_id=32;   -- 唐可可
UPDATE `character` SET eye_color='粉色' WHERE character_id=33;   -- 岚千砂都
UPDATE `character` SET eye_color='绿色' WHERE character_id=34;   -- 平安名堇
UPDATE `character` SET eye_color='靛蓝色' WHERE character_id=35; -- 叶月恋
UPDATE `character` SET eye_color='蓝色' WHERE character_id=36;   -- 樱小路希奈子
UPDATE `character` SET eye_color='粉色' WHERE character_id=37;   -- 米女芽衣
UPDATE `character` SET eye_color='蓝色' WHERE character_id=38;   -- 若菜四季
UPDATE `character` SET eye_color='绿色' WHERE character_id=39;   -- 鬼冢夏美
UPDATE `character` SET eye_color='紫色' WHERE character_id=40;   -- 薇恩·玛格丽特
UPDATE `character` SET eye_color='蓝色' WHERE character_id=41;   -- 鬼冢冬毬

-- ========== A-RISE (3人) ==========
UPDATE `character` SET eye_color='绿色' WHERE character_id=53;   -- 绮罗翼
UPDATE `character` SET eye_color='青绿色' WHERE character_id=54; -- 统堂英玲奈
UPDATE `character` SET eye_color='紫色' WHERE character_id=55;   -- 优木杏树

-- ========== Saint Snow (2人) ==========
UPDATE `character` SET eye_color='紫罗兰色' WHERE character_id=56; -- 鹿角圣良
UPDATE `character` SET eye_color='紫色' WHERE character_id=57;     -- 鹿角理亚

-- ========== Sunny Passion (2人) ==========
UPDATE `character` SET eye_color='紫红色' WHERE character_id=58; -- 柊摩央
UPDATE `character` SET eye_color='绿色' WHERE character_id=59;   -- 圣泽悠奈

-- ========== 人生不易部！/ 青鸟 (10人) ==========
-- 基于官方角色设计图及设定资料
UPDATE `character` SET eye_color='褐色' WHERE character_id=60;   -- 高桥波尔卡
UPDATE `character` SET eye_color='蓝色' WHERE character_id=61;   -- 金泽奇迹
UPDATE `character` SET eye_color='蓝绿色' WHERE character_id=62; -- 春宫悠可里
UPDATE `character` SET eye_color='紫色' WHERE character_id=63;   -- 此花辉夜
UPDATE `character` SET eye_color='褐色' WHERE character_id=64;   -- 调布乃理子
UPDATE `character` SET eye_color='粉色' WHERE character_id=65;   -- 麻布麻衣
UPDATE `character` SET eye_color='红色' WHERE character_id=66;   -- 驹形花火
UPDATE `character` SET eye_color='绿色' WHERE character_id=67;   -- 五桐玲
UPDATE `character` SET eye_color='绿色' WHERE character_id=68;   -- 山田真绿
UPDATE `character` SET eye_color='灰色' WHERE character_id=69;   -- 佐佐木翔音

SELECT '瞳色更新完成' AS result;
SELECT character_id, name, eye_color FROM `character` ORDER BY character_id;
