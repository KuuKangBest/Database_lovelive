-- 应援色 (cheering_color) 和 互动词 (call_response / コール&レスポンス)
-- 数据来源：官方演唱会、萌娘百科、B站等
USE lovelive_db;

-- ===== μ's =====
UPDATE `character` SET cheering_color='#FF8C00', call_response='ファイトだよ！（Fightだよ！）—— 大家一起喊"ファイトだよ！"' WHERE character_id=1;
UPDATE `character` SET cheering_color='#5BC0DE', call_response='Хорошо！（ハラショー！）—— 全场回应"ハラショー！"' WHERE character_id=2;
UPDATE `character` SET cheering_color='#B0BEC5', call_response='ことりのおやつにしちゃうぞ！—— "ちゅんちゅん！"' WHERE character_id=3;
UPDATE `character` SET cheering_color='#1A3A8A', call_response='ラブアローシュート！（Love Arrow Shoot!）—— 被击中的感觉' WHERE character_id=4;
UPDATE `character` SET cheering_color='#FFD700', call_response='にゃーにゃーにゃー！—— 大家一起"にゃ〜"' WHERE character_id=5;
UPDATE `character` SET cheering_color='#E53935', call_response='何それ？意味わかんない！—— 傲娇口头禅' WHERE character_id=6;
UPDATE `character` SET cheering_color='#9C27B0', call_response='スピリチュアルやね〜 —— 关西腔占卜师' WHERE character_id=7;
UPDATE `character` SET cheering_color='#43A047', call_response='誰か助けて〜！（谁来救救我！）—— 害羞时的口头禅' WHERE character_id=8;
UPDATE `character` SET cheering_color='#E91E8C', call_response='にっこにっこにー！—— 全场一起"にっこにっこにー！"' WHERE character_id=9;

-- ===== Aqours =====
UPDATE `character` SET cheering_color='#FF9800', call_response='輝きたい！（想要闪耀！）—— 千歌的核心台词' WHERE character_id=10;
UPDATE `character` SET cheering_color='#F48FB1', call_response='ピアノで気持ちを伝えたい —— 用钢琴传达心情' WHERE character_id=11;
UPDATE `character` SET cheering_color='#4FC3F7', call_response='ヨーソロー！（YOSORO！）—— 全场一起"ヨーソロー！"' WHERE character_id=12;
UPDATE `character` SET cheering_color='#9E9E9E', call_response='堕天しちゃうよ！—— 小恶魔中二病全开' WHERE character_id=13;
UPDATE `character` SET cheering_color='#FDD835', call_response='マル！—— ずら〜（完美！—— 带口癖）' WHERE character_id=14;
UPDATE `character` SET cheering_color='#F06292', call_response='ピキピキピー！（PikiPikiPi！）' WHERE character_id=15;
UPDATE `character` SET cheering_color='#66BB6A', call_response='もっと高く！—— 跳水般的向上心' WHERE character_id=16;
UPDATE `character` SET cheering_color='#E53935', call_response='ぶっぶーですわ！（错误！—— 学生会长威严）' WHERE character_id=17;
UPDATE `character` SET cheering_color='#AB47BC', call_response='SHINY！—— 鞠莉标志性的闪亮登场' WHERE character_id=18;

-- ===== 虹咲学园 =====
UPDATE `character` SET cheering_color='#ED7D95', call_response='一緒に歩こうね —— 与粉丝一起前行' WHERE character_id=19;
UPDATE `character` SET cheering_color='#E7D600', call_response='かすかすだよ〜 —— 小恶魔式的可爱' WHERE character_id=20;
UPDATE `character` SET cheering_color='#01B7ED', call_response='演技で魅せるわ —— 以演技征服大家' WHERE character_id=21;
UPDATE `character` SET cheering_color='#485EC6', call_response='セクシー担当よ —— 成熟的魅力担当' WHERE character_id=22;
UPDATE `character` SET cheering_color='#FF5800', call_response='愛してるよ！—— 元气满满的爱的宣言' WHERE character_id=23;
UPDATE `character` SET cheering_color='#A664A0', call_response='おやすみ〜 —— 总是在打瞌睡的彼方' WHERE character_id=24;
UPDATE `character` SET cheering_color='#D81C2F', call_response='世界を変える！—— 热血偶像宣言' WHERE character_id=25;
UPDATE `character` SET cheering_color='#84C36E', call_response='みんなで笑顔に —— 治愈系瑞士大姐姐' WHERE character_id=26;
UPDATE `character` SET cheering_color='#9CA5B9', call_response='璃奈板で気持ちを伝えるよ —— 用电子表情板传达心意' WHERE character_id=27;
UPDATE `character` SET cheering_color='#37B484', call_response='正々堂々と —— 堂堂正正的学生会作风' WHERE character_id=28;
UPDATE `character` SET cheering_color='#A9A898', call_response='Music is life —— 音乐即生命' WHERE character_id=29;
UPDATE `character` SET cheering_color='#F69992', call_response='私が一番！—— 唯我独尊的自信' WHERE character_id=30;

-- ===== Liella! =====
UPDATE `character` SET cheering_color='#FF7F27', call_response='雲の上はいつも晴れ —— 香音的金句' WHERE character_id=31;
UPDATE `character` SET cheering_color='#A0FFF9', call_response='思い立ったが吉日！—— 择日不如撞日' WHERE character_id=32;
UPDATE `character` SET cheering_color='#FF6E90', call_response='踊るの大好き！—— 最爱跳舞' WHERE character_id=33;
UPDATE `character` SET cheering_color='#74F466', call_response='ギャラクシー！（Galaxy！）—— 宇宙级梦想家' WHERE character_id=34;
UPDATE `character` SET cheering_color='#0000A0', call_response='音楽は心 —— 音乐即是心灵' WHERE character_id=35;
UPDATE `character` SET cheering_color='#FFF442', call_response='自然が大好き —— 北海道纯朴少女' WHERE character_id=36;
UPDATE `character` SET cheering_color='#FF3535', call_response='絵で伝えたい —— 用画传达心意' WHERE character_id=37;
UPDATE `character` SET cheering_color='#B2FFDD', call_response='科学の力で —— 理性的科学少女' WHERE character_id=38;
UPDATE `character` SET cheering_color='#FF51C4', call_response='オニナツだよ！—— 元气视频博主' WHERE character_id=39;
UPDATE `character` SET cheering_color='#E49DFD', call_response='Ich bin die Beste —— 德奥混血的骄傲' WHERE character_id=40;
UPDATE `character` SET cheering_color='#4CD2E2', call_response='お姉ちゃんを支えたい —— 支持姐姐的可靠妹妹' WHERE character_id=41;

-- ===== Saint Snow =====
UPDATE `character` SET cheering_color='#42A5F5', call_response='雪のように純粋に —— 如雪般纯粹' WHERE character_id=56;
UPDATE `character` SET cheering_color='#FFFFFF', call_response='聖なる氷の世界へ —— 通往神圣的冰雪世界' WHERE character_id=57;
