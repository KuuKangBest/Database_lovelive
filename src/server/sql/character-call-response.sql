-- 应援色 (cheering_color) 和 互动词 (call_response)
-- 数据来源：萌娘百科、LLWiki、官方演唱会实录
USE lovelive_db;

-- ===== μ's =====
UPDATE `character` SET cheering_color='#FF8C00', call_response='ファイトだよ！（Fight da yo！）' WHERE character_id=1;
UPDATE `character` SET cheering_color='#5BC0DE', call_response='Хорошо！（ハラショー！）' WHERE character_id=2;
UPDATE `character` SET cheering_color='#B0BEC5', call_response='ちゅんちゅん！（Chun chun！）' WHERE character_id=3;
UPDATE `character` SET cheering_color='#1A3A8A', call_response='ラブアローシュート！（Love Arrow Shoot！）' WHERE character_id=4;
UPDATE `character` SET cheering_color='#FFD700', call_response='にゃーにゃーにゃー！（Nya〜！）' WHERE character_id=5;
UPDATE `character` SET cheering_color='#E53935', call_response='何それ？意味わかんない！' WHERE character_id=6;
UPDATE `character` SET cheering_color='#9C27B0', call_response='スピリチュアルやね〜' WHERE character_id=7;
UPDATE `character` SET cheering_color='#43A047', call_response='誰か助けて〜！（Dareka tasukete！）' WHERE character_id=8;
UPDATE `character` SET cheering_color='#E91E8C', call_response='にっこにっこにー！（Nico Nico Ni〜）' WHERE character_id=9;

-- ===== Aqours =====
UPDATE `character` SET cheering_color='#FF9800', call_response='かんかん！みかん！（Kan kan！Mikan！）' WHERE character_id=10;
UPDATE `character` SET cheering_color='#F48FB1', call_response='梨子ビーム！（Riko Beam！）' WHERE character_id=11;
UPDATE `character` SET cheering_color='#4FC3F7', call_response='ヨーソロー！（Yosoro！）' WHERE character_id=12;
UPDATE `character` SET cheering_color='#9E9E9E', call_response='リトルデーモン！堕天！（Little Demon！）' WHERE character_id=13;
UPDATE `character` SET cheering_color='#FDD835', call_response='おはなまる！（Ohanamaru！）' WHERE character_id=14;
UPDATE `character` SET cheering_color='#F06292', call_response='がんばルビィ！（Ganba Ruby！）' WHERE character_id=15;
UPDATE `character` SET cheering_color='#66BB6A', call_response='ハグしよ！（Hug shiyo！）' WHERE character_id=16;
UPDATE `character` SET cheering_color='#E53935', call_response='ぶっぶーですわ！（Bubbu desu wa！）' WHERE character_id=17;
UPDATE `character` SET cheering_color='#AB47BC', call_response='シャイニー！（Shiny！）' WHERE character_id=18;

-- ===== 虹咲学园 =====
UPDATE `character` SET cheering_color='#ED7D95', call_response='一緒に歩こうね' WHERE character_id=19;
UPDATE `character` SET cheering_color='#E7D600', call_response='かすかすだよ〜' WHERE character_id=20;
UPDATE `character` SET cheering_color='#01B7ED', call_response='演技で魅せるわ' WHERE character_id=21;
UPDATE `character` SET cheering_color='#485EC6', call_response='セクシー担当よ' WHERE character_id=22;
UPDATE `character` SET cheering_color='#FF5800', call_response='愛してるよ！（Aishiteru yo！）' WHERE character_id=23;
UPDATE `character` SET cheering_color='#A664A0', call_response='おやすみ〜' WHERE character_id=24;
UPDATE `character` SET cheering_color='#D81C2F', call_response='世界を変える！（Sekai wo kaeru！）' WHERE character_id=25;
UPDATE `character` SET cheering_color='#84C36E', call_response='みんなで笑顔に' WHERE character_id=26;
UPDATE `character` SET cheering_color='#9CA5B9', call_response='璃奈板で伝えるよ' WHERE character_id=27;
UPDATE `character` SET cheering_color='#37B484', call_response='正々堂々（Seiseidoudou）' WHERE character_id=28;
UPDATE `character` SET cheering_color='#A9A898', call_response='Music is life！' WHERE character_id=29;
UPDATE `character` SET cheering_color='#F69992', call_response='私が一番！（Watashi ga ichiban！）' WHERE character_id=30;

-- ===== Liella! 一期生（来源：萌娘百科 LoveLive!Superstar!!/应援） =====
UPDATE `character` SET cheering_color='#FF7F27', call_response='だいすきさ るっるるる〜 → ハンバーグもな〜 おぅ！（Ka→Non!）' WHERE character_id=31;
UPDATE `character` SET cheering_color='#A0FFF9', call_response='呜↗太好听了吧！スバラシイコエノヒト？あっ！ → 天籁之声之人！！（Keke!）' WHERE character_id=32;
UPDATE `character` SET cheering_color='#FF6E90', call_response='ういっすういっすういっすー！（Chii-chan!）' WHERE character_id=33;
UPDATE `character` SET cheering_color='#74F466', call_response='皆さん、ギャラクシー！（Sumire!）' WHERE character_id=34;
UPDATE `character` SET cheering_color='#0000A0', call_response='秋あかね 歌にいざよう → 葉月恋！（Ren!）' WHERE character_id=35;

-- ===== Liella! 二期生（TODO: 需从萌娘百科/LLWiki验证C&R） =====
UPDATE `character` SET cheering_color='#FFF442', call_response=NULL WHERE character_id=36;
UPDATE `character` SET cheering_color='#FF3535', call_response=NULL WHERE character_id=37;
UPDATE `character` SET cheering_color='#B2FFDD', call_response=NULL WHERE character_id=38;
UPDATE `character` SET cheering_color='#FF51C4', call_response=NULL WHERE character_id=39;

-- ===== Liella! 三期生（TODO: 需验证） =====
UPDATE `character` SET cheering_color='#E49DFD', call_response=NULL WHERE character_id=40;
UPDATE `character` SET cheering_color='#4CD2E2', call_response=NULL WHERE character_id=41;

-- ===== Saint Snow =====
UPDATE `character` SET cheering_color='#42A5F5', call_response='雪のように純粋に（Sarah!）' WHERE character_id=56;
UPDATE `character` SET cheering_color='#FFFFFF', call_response='聖なる氷の世界へ（Leah!）' WHERE character_id=57;

-- ===== Sunny Passion =====
UPDATE `character` SET cheering_color='#FFB74D', call_response='PA！（パー！）悠奈です！' WHERE character_id=59;
UPDATE `character` SET cheering_color='#CE93D8', call_response='夜のセクシー！摩央です！' WHERE character_id=58;
