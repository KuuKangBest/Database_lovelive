-- ========================================
-- LoveLive! 角色关系数据
-- 基于官方动画/漫画/广播剧/游戏设定
-- 关系类型：姐妹、幼驯染、搭档、憧憬、挚友、对手、同学、师徒
-- ========================================
USE lovelive_db;

-- ===== μ's (1-9) 团内关系 =====
-- 二年生 幼驯染三角
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(1,3,'幼驯染','从幼儿园起就在一起的青梅竹马，穗乃果与小鸟互相扶持成长'),
(1,4,'幼驯染','从小一起长大的青梅竹马，穗乃果的冲动与海未的理智互为补充'),
(3,4,'幼驯染','一同守护穗乃果的青梅竹马，小鸟的温柔与海未的严格完美互补');

-- 一年生 挚友三角
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(5,8,'幼驯染','凛和花阳从小学起就是好朋友，凛鼓励害羞的花阳勇敢追梦'),
(5,6,'挚友','凛用开朗打破了真姬的高冷外壳，真姬暗中帮凛克服穿裙子的心理障碍'),
(6,8,'挚友','真姬在花阳身上看到纯粹的热爱，是最早鼓励花阳加入μ''s的人之一');

-- 三年生 搭档与挚友
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(2,7,'搭档','学生会正副会长，Bibi组合搭档，希是唯一完全理解绘里的人'),
(7,9,'挚友','三年生组互相扶持，希常捉弄妮可但最懂她对偶像的执着'),
(2,9,'挚友','绘里欣赏妮可的偶像经验，妮可敬佩绘里的领袖气质');

-- 核心搭档
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(1,2,'搭档','穗乃果以真诚打动绘里加入，两人共同带领μ''s走向全国'),
(6,9,'搭档','Bibi组合的傲娇组，真姬的才华与妮可的经验碰撞出独特火花'),
(1,9,'憧憬','妮可暗中羡慕穗乃果天生的领袖魅力与带动身边人的能力');

-- 其他重要羁绊
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(5,1,'憧憬','凛被穗乃果的热情感染，克服对裙子的恐惧加入偶像部'),
(8,1,'憧憬','花阳因穗乃果的鼓励才鼓起勇气报名加入μ''s'),
(3,4,'搭档','小鸟的服装设计与海未的作词编舞，是μ''s舞台的幕后基石');

-- ===== Aqours (10-18) 团内关系 =====
-- 二年生 三角
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(10,11,'搭档','千歌的热情燃起梨子内心的火焰，梨子的冷静平衡千歌的冲动——Aqours的核心搭档'),
(10,12,'幼驯染','千歌与曜从小学起就在沼津海边一起玩耍的挚友'),
(11,12,'挚友','曜帮助刚转学的梨子适应浦之星生活，两人共同支持千歌');

-- 一年生 双人组
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(13,14,'幼驯染','善子（夜羽）和花丸从小学起就认识，花丸是少数理解善子中二世界的人'),
(14,15,'挚友','花丸与露比是形影不离的好朋友，两人同属一年生且兴趣相投'),
(13,15,'挚友','善子和露比是彼此最信任的伙伴，两人约定一起成为最棒的偶像');

-- 三年生 幼驯染三角
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(16,17,'幼驯染','果南与黛雅从小学起相识，是互相信赖的青梅竹马'),
(16,18,'幼驯染','果南与鞠莉在沼津海边一起长大，自由与优雅的碰撞'),
(17,18,'幼驯染','黛雅与鞠莉是性格截然相反但互相欣赏的三年生搭档');

-- 姐妹
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(17,15,'姐妹','黛雅是露比最崇拜的姐姐，虽然嘴上严厉但内心最疼爱妹妹');

-- 跨年级羁绊
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(10,16,'幼驯染','千歌从小就跟着果南在沼津海边玩耍，果南是千歌的"大姐姐"'),
(10,18,'搭档','千歌与鞠莉共享"让Aqours闪耀"的热情，鞠莉是千歌最强后盾之一'),
(11,13,'挚友','梨子理解善子的幻想世界，两人一起弹吉他和创作');

-- ===== 虹咲学园 (19-30) 团内关系 =====
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(19,20,'挚友','步梦包容霞的任性，霞用元气治愈步梦的不安'),
(20,21,'挚友','霞喜欢捉弄雫但两人关系极好，是最懂彼此的舞台搭档'),
(22,26,'挚友','果林与艾玛是三年生组的好友，成熟大姐姐间的优雅友谊'),
(23,27,'搭档','爱用开朗帮助璃奈表达情感，璃奈用聪明回应爱的热情'),
(24,25,'挚友','彼方和雪菜虽然性格迥异——一个慵懒一个热血——却是最懂对方的挚友'),
(25,28,'挚友','雪菜与栞子在学生会共事，从对立到理解的好友'),
(29,30,'搭档','米雅和岚珠两位国际学生互相扶持，共创最酷的舞台'),
(19,25,'挚友','步梦与雪菜对"偶像的意义"有着同样执着而深刻的追求'),
(21,22,'憧憬','雫崇拜果林成熟的舞台魅力和自信的表演风格'),
(26,24,'挚友','艾玛与彼方都是温柔治愈系，共同用笑容守护同好会');

-- ===== Liella! (31-41) 团内关系 =====
-- 一期生
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(31,33,'幼驯染','香音与千砂都从小一起长大，千砂都是香音克服舞台恐惧的最强支持者'),
(31,32,'搭档','香音与可可——跨越国界的灵魂搭档，共同创建了Liella!'),
(31,34,'挚友','堇从最初的对手变成香音最忠实的伙伴，两人互相信任'),
(32,33,'挚友','可可和千砂都共享对香音的爱护，在团队中是双倍的活力'),
(33,34,'挚友','千砂都和堇是团队中的舞蹈双璧，共同负责编舞与舞台'),
(35,40,'对手','恋的古典音乐素养与薇恩的维也纳精英背景形成良性竞争，后成为互相欣赏的搭档'),
(35,31,'搭档','恋最初质疑香音的学园偶像构想，被打动后成为Liella!最坚定的守护者');

-- 二期生
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(37,38,'搭档','芽衣和四季从入学起就形影不离——芽衣的感性温柔与四季的理性冷静互补，粉丝称为"红蓝组"'),
(36,31,'憧憬','希奈子因憧憬香音的舞台而加入Liella!，追逐那份耀眼的温暖'),
(36,35,'挚友','希奈子与恋同属认真型，两人在音乐和学业上互相学习'),
(39,37,'挚友','夏美和芽衣是同班好友，夏美经常拉着芽衣拍视频');

-- 姐妹
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(39,41,'姐妹','夏美是元气满满的姐姐，冬毬是沉稳可靠的妹妹——性格截然相反但感情极好');

-- 三期生
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(40,35,'搭档','薇恩从骄傲的挑战者变为恋的音乐搭档，两人的古典素养让Liella!的音乐深度更上一层楼');

-- ===== 莲之空女学院 (42-52) 团内关系 =====
-- 103期 核心搭档
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(42,43,'搭档','花帆与沙耶香是同班同寝的挚友——花帆的乐天感染沙耶香，沙耶香的冷静守护花帆'),
(42,44,'挚友','花帆和瑠璃乃是103期活力担当，一起为俱乐部带来无限能量'),
(43,44,'挚友','沙耶香虽然表面冷淡但默默照顾着冒失的瑠璃乃');

-- 102期毕业生 x 103期 传承关系
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(42,50,'憧憬','花帆视梢为最重要的人——梢的舞台和温柔改变了花帆的一生，两人是第一代Cerise Bouquet'),
(43,51,'憧憬','沙耶香被缀理的舞台深深震撼后投身学园偶像，照顾生活不能自理的缀理成了她的日常'),
(44,52,'搭档','瑠璃乃与慈是第一代Mira-Cra Park!——两人共同定义了这个组合的"开心舞台"风格'),
(50,42,'搭档','梢引导花帆成长后，将Cerise Bouquet和俱乐部托付给花帆——是最美的传承');

-- 104期 第二代组合
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(42,45,'搭档','花帆与小鈴组成第二代Cerise Bouquet——花帆用温暖的鼓励帮助小鈴找到属于自己的光芒'),
(43,46,'搭档','沙耶香与姫芽组成第二代DOLLCHESTRA——理性与感性的完美配合'),
(44,47,'搭档','瑠璃乃与吟華组成第二代Mira-Cra Park!——元气全开的欢闹组合');

-- 104期传承憧憬
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(45,50,'憧憬','小鈴以梢为目标，希望成为像她一样优雅又强大的学园偶像'),
(46,51,'憧憬','姫芽被缀理的舞台表现力深深吸引，决心继承DOLLCHESTRA的独特世界观'),
(47,52,'憧憬','吟華尊敬慈作为偶像的感染力，希望将Mira-Cra Park!的精神传递下去');

-- 102期 毕业生之间的羁绊
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(50,51,'挚友','梢与缀理——同为102期的传奇，在竞争中互相尊重互相激励'),
(51,52,'挚友','缀理与慈虽然风格迥异，但同为莲之空首批偶像，是特殊的伙伴');

-- ===== A-RISE (53-55) 团内关系 =====
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(53,54,'搭档','翼与英玲奈自高中入学起共同活动，是A-RISE的双核心'),
(53,55,'搭档','翼与杏树——领队与调和者，杏树是翼最坚实的支持者'),
(54,55,'搭档','英玲奈与杏树是同甘共苦的队友，三人共同成就了A-RISE的传奇');

-- ===== Saint Snow (56-57) 团内关系 =====
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(56,57,'姐妹','圣良与理亚是函馆最强姐妹组合——圣良守护理亚的成长，理亚是圣良最骄傲的妹妹');

-- ===== Sunny Passion (58-59) 团内关系 =====
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(58,59,'幼驯染','摩央与悠奈从幼年相识，是彼此生命中最重要的搭档——"太阳与夜晚，合二为一"');

-- ===== 人生不易部！/ BLUEBIRD (60-69) 团内关系 =====
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(60,65,'搭档','波尔卡与麻衣——部长与副部长，冲动直觉与理性逻辑的最佳互补'),
(60,62,'挚友','波尔卡的开朗帮助内向的悠可里打开心扉，两人是互相欣赏的好友'),
(61,64,'挚友','奇迹和乃理子是从福井分校一起奋斗的挚友，互相支持追逐各自的梦想'),
(62,68,'挚友','悠可里与真绿在梅田分校相识，真绿被悠可里的优雅打动而加入偶像活动'),
(63,60,'挚友','辉夜欣赏波尔卡的自由与勇敢，决心用芭蕾经验帮助团队编舞'),
(66,63,'挚友','花火和辉夜共享对美的追求——一个是和服之美，一个是芭蕾之美'),
(67,61,'挚友','玲与奇迹有着对运动的共同热爱，在训练中互相激励'),
(68,62,'挚友','真绿被悠可里邀请加入偶像活动，在环保与舞台之间找到青春的答案');

-- 特殊：跨团憧憬
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(69,4,'憧憬','翔音是园田海未的铁粉——房间里挂着海未的海报，因憧憬海未的认真与才华而走上偶像之路');

-- ========================================
-- 跨团关系
-- ========================================
INSERT INTO character_relationship (character_id_1, character_id_2, relation_type, description) VALUES
(1,53,'对手','μ''s与A-RISE——互相尊重互相激励的对手关系，翼将穗乃果视为最值得尊敬的竞争者'),
(53,1,'挚友','翼在大赛败给μ''s后真诚鼓励穗乃果"你们的光芒我看到了"，两人成为跨越团体的挚友'),
(10,1,'憧憬','千歌因μ''s的舞台而走上学院偶像之路——"想要像穗乃果那样闪耀！"'),
(32,59,'憧憬','唐可可收藏了悠奈的大量周边——Sunny Passion是可可最早的偶像启蒙'),
(31,58,'挚友','摩央以学姐身份给予了Liella!真诚的建议和鼓励'),
(53,56,'憧憬','圣良受A-RISE的启发与理亚踏上学院偶像之路——跨越北海道的憧憬'),
(6,53,'搭档','剧场版中真姬与翼跨越团体界限共同创作《SUNNY DAY SONG》，对手成为创作伙伴');

SELECT '角色关系数据加载完成' AS result;
SELECT COUNT(*) AS relation_count FROM character_relationship;
