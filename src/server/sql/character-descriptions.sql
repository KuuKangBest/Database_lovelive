-- 角色详细描述 (description) 和爱好 (hobby) 更新
-- 数据来源：萌娘百科、百度百科、Wikipedia、LoveLive Wiki 等
USE lovelive_db;

-- ===== μ's =====
UPDATE `character` SET hobby='吃面包、唱歌', description='μ''s的发起人与领队，被称为"果皇"。个性直率热情，无论何时都展露笑容的超级乐天派，一旦决定了就埋头猛冲的一根筋。凭着天生超乐观精神多少困难都能突破，是μ''s的发动机与牵引者。家中经营日式传统甜点老店"穗村"。与小鸟、海未是青梅竹马。' WHERE character_id=1;

UPDATE `character` SET hobby='芭蕾舞、编舞、俄语', description='音乃木坂学院学生会长，头脑聪明、运动神经拔群，无论做什么都能出色完成。具有四分之一俄罗斯血统（祖母为俄罗斯人），口头禅是俄语"Хорошо!"。小时候学过芭蕾舞，加入μ''s后负责舞蹈指导。最初反对穗乃果成立偶像部，后被打动加入。被东条希誉为"创造了μ''s的女神大人"。怕黑。' WHERE character_id=2;

UPDATE `character` SET hobby='服装设计、制作点心、画插图', description='穗乃果最好的朋友，从幼儿园起就在一起的青梅竹马。性格文静温柔、学习优秀的优等生，带有天然呆属性。擅长画插图和裁缝，负责μ''s的服装设计。音乃木坂学院理事长的女儿，同时也是秋叶原招牌女仆"Minalinsky"。看似柔弱但内心坚强，一旦下定决心意志力会相当坚定。' WHERE character_id=3;

UPDATE `character` SET hobby='弓道、书法、作词、登山', description='散发着凛凛风度的大和抚子，严于律己同时严于律人。出身于日本舞传统世家，自幼修行弓道。做事一丝不苟、善于规划时间，负责μ''s日常训练的安排与指导。外表坚强但极度害羞怕生——在公众场合会非常紧张，不能接受膝盖以上的裙子。与穗乃果、小鸟是青梅竹马，负责团体作词和早期舞步构想。' WHERE character_id=4;

UPDATE `character` SET hobby='运动、田径、喵喵叫', description='μ''s中最有活力的运动少女，口癖是"喵~"，句尾常加"にゃ"。从小不擅长穿裙子，喜欢穿运动服。运动神经极好，田径部王牌。性格开朗直率像男孩子，但内心也有憧憬可爱事物的少女一面。属于μ''s一年生组，与花阳、真姬关系亲密。' WHERE character_id=5;

UPDATE `character` SET hobby='钢琴、作曲、天文观测', description='μ''s的作曲担当，音乃木坂学院的富家大小姐，拥有绝对音感。初见时态度高傲冷淡，实则心地善良。在医院继承人的压力下从小苦练钢琴，对音乐有着严格的标准。口头禅是"何それ？意味わかんない"（那是什么？莫名其妙）。傲娇属性，明明关心同伴却总是不坦率表达。' WHERE character_id=6;

UPDATE `character` SET hobby='占卜、塔罗牌、睡觉', description='音乃木坂学院的学生会副会长，μ''s中最神秘的存在。擅长占卜和塔罗牌，被称为"精神支柱"。拥有温柔包容的母性气质，说话带着独特关西腔。经常用占卜为μ''s提供方向，实际上是影响团队走向的关键人物。喜欢袭胸，在团队中是大家"妈妈"一般的存在。' WHERE character_id=7;

UPDATE `character` SET hobby='偶像研究、吃米饭', description='μ''s的偶像爱好者，性格温和但极度内向害羞。非常喜欢白米饭，饭量惊人。因为超喜欢偶像而了解大量偶像知识，是团体中的"偶像百科全书"。最初只是远远崇拜校园偶像，在凛和真姬的鼓励下鼓起勇气加入μ''s。戴上眼镜和不戴眼镜气质迥异，被粉丝称为"双重人格"。' WHERE character_id=8;

UPDATE `character` SET hobby='偶像研究、打扮、自拍', description='μ''s中自称"宇宙第一可爱"的偶像狂热爱好者。有着标志性的双马尾和红色蝴蝶结，口头禅是"NicoNicoNi~"。极度执着于"可爱"的概念，经常研究如何展现最可爱的一面。实际上是三姐弟中的长女，在家中负责照顾弟妹，与外面光鲜形象形成反差。在μ''s中是经验最丰富的"偶像前辈"。' WHERE character_id=9;

-- ===== Aqours =====
UPDATE `character` SET hobby='模仿偶像、在家帮忙旅馆', description='Aqours的发起人与创立者。浦之星女学院二年级，家中经营日式旅馆"十千万"，是三姐妹中的老幺。开朗、待人亲切、不服输，拥有天生带动周围人的感染力与行动力。因为在μ''s的演唱会中感受到耀眼的光芒而对学园偶像产生憧憬，决心创立属于自己的学园偶像团体。热爱蜜柑，代表色即是蜜柑色。口头禅是"輝きたい！"（想要闪耀！）。' WHERE character_id=10;

UPDATE `character` SET hobby='钢琴、读书、听音乐', description='从东京国立音乃木坂学院转学来到浦之星女学院。外表看起来成熟冷静，但实际上非常容易慌张，做事冒失，经常过早下结论而产生误会。性格腼腆，是典型的居家派。擅长钢琴，梦想成为钢琴家。拥有非常好的音感，在Aqours中负责作曲，与千歌搭档互补。喜欢狗狗。' WHERE character_id=11;

UPDATE `character` SET hobby='高空跳水、制服收集、服装设计', description='浦之星女学院二年级，千歌的同班同学和青梅竹马。从小练习跳水，拥有国家队级别的高空跳水实力。性格充满活力、乐观开朗，典型"行动先于思考"的运动少女。父亲是渡轮船长，自己的梦想也是成为一名船长。兴趣是制服和服装设计，在Aqours中经常负责服装。口号是"ヨーソロー！"（航海用语：前进！）。' WHERE character_id=12;

UPDATE `character` SET hobby='占卜、Cosplay、弹吉他', description='浦之星女学院一年级生。自称"堕天使夜羽（Yohane）"，深信自己是因堕落而被放逐到人间的天使。中二病全开的角色，但其实非常认真且努力。在同学面前维持优等生形象，内心却充满幻想。喜欢独自活动，对"小恶魔"风格的装扮情有独钟。善子（本名）与夜羽（自称）之间的人格切换是最大萌点。' WHERE character_id=13;

UPDATE `character` SET hobby='读书、写小说、古典文学', description='浦之星女学院一年级生。出身于历史悠久的寺庙"国木田寺"，从小在寺院环境中长大。性格温和纯朴，有些天然呆，说话带有古风敬语。非常喜欢读书，知识渊博，但不擅长运动。与露比是好朋友，两人常一起行动。口头禅是"マル"（丸/完美！），代表色是黄色。' WHERE character_id=14;

UPDATE `character` SET hobby='裁缝、收集可爱物品', description='浦之星女学院一年级生，黛雅的妹妹。极度害羞怕生，非常容易受惊吓哭泣，是Aqours中最小只的成员。憧憬成为偶像但一直不敢迈出第一步，在千歌的鼓励下加入Aqours。对姐姐黛雅又爱又怕，喜欢可爱的事物。与花丸关系最好，两人常组成"花丸露比"组合。代表色是粉色。' WHERE character_id=15;

UPDATE `character` SET hobby='潜水、游泳、健身', description='浦之星女学院三年级生。与千歌和曜是青梅竹马，三人在小学时曾一起在沼津海边玩耍。性格沉稳可靠，运动能力出色，擅长潜水。在Aqours中担任体能训练和动作指导。曾在东京作为偶像活动过但失败，因此最初对千歌的偶像计划持保留态度。是团体中默默守护大家的大姐姐。' WHERE character_id=16;

UPDATE `character` SET hobby='日本舞、书法、茶道', description='浦之星女学院学生会长，露比的姐姐。出身名门，从小接受严格的家庭教育，精通日本舞、书法和茶道。外表严肃认真、气场强大，被同学敬畏。但内心其实非常宠爱妹妹露比，甚至会为了露比制作玩偶。对待偶像活动极度认真，在Aqours中是维持纪律和标准的存在。口头禅是"ぶっぶーですわ！"（错误！）。' WHERE character_id=17;

UPDATE `character` SET hobby='骑马、收集香水、弹钢琴', description='浦之星女学院三年级生。日意混血的大小姐，父亲经营大型连锁酒店。性格开朗外向、自信大方，喜欢引人注目和被称赞。有着自由奔放的一面，经常做出出人意料的举动。在Aqours中负责团体公关和资金支持，擅长英文。与黛雅和果南是青梅竹马三人组。喜欢说"SHINY~"来形容闪闪发光的事物。' WHERE character_id=18;

-- ===== 虹咲学园 =====
UPDATE `character` SET hobby='做点心、照顾侑', description='虹咲学园二年级生，高咲侑的青梅竹马。性格努力且真心，有时会因过于认真而钻牛角尖。从"努力型"逐渐成长为"真心型"偶像。喜欢可爱的事物，代表色是浅粉红。是虹咲学园学园偶像同好会中最具亲和力的成员之一。' WHERE character_id=19;

UPDATE `character` SET hobby='恶作剧、自拍、社交网络', description='虹咲学园一年级生，自称"かすかす"。小恶魔系的可爱角色，喜欢恶作剧和引人注意。性格活泼外向但有时会显得腹黑，经常捉弄其他成员。实际上内心渴望得到大家的认可和关注，对偶像活动非常认真。代表色是淡黄色。' WHERE character_id=20;

UPDATE `character` SET hobby='演戏、读书、写剧本', description='虹咲学园一年级生。性格沉稳认真，像一个"大和抚子"般优雅。非常喜欢戏剧和表演，是学园戏剧部的成员。在偶像活动中会融入演技元素，追求完美的舞台表现。常常在角色扮演中展现出不同的自己，反差魅力深受粉丝喜爱。代表色是水色。' WHERE character_id=21;

UPDATE `character` SET hobby='模特工作、时尚、购物', description='虹咲学园三年级生。身材高挑、气质成熟的模特型偶像。性格自信大方，有着"姐系"的魅力。对待后辈非常照顾，是团体中可靠的大姐姐角色。在舞台上展现出性感帅气的风格，私下却有着容易害羞的一面。代表色是群青色。' WHERE character_id=22;

UPDATE `character` SET hobby='运动、说冷笑话、吃零食', description='虹咲学园二年级生。性格开朗活泼、运动神经发达，是一个活力满满的元气少女。喜欢说冷笑话和捉弄人，是团体中的气氛制造者。看似大大咧咧但其实非常重感情，对朋友非常讲义气。有着男孩子气的爽朗性格，但穿上偶像服装后又能展现出可爱的一面。代表色是深橙色。' WHERE character_id=23;

UPDATE `character` SET hobby='睡觉、照顾妹妹、做料理', description='虹咲学园三年级生。性格温柔慵懒，超级爱睡觉，经常在任何地方都能睡着。在家中是长姐，非常擅长照顾妹妹和做家务。虽然看起来总是很困的样子，但实际上头脑聪明、学习成绩优秀。在偶像活动中展现出令人惊艳的反差魅力，歌声温柔动人。代表色是堇紫色。' WHERE character_id=24;

UPDATE `character` SET hobby='唱歌、看动画、收集英雄周边', description='虹咲学园二年级生。拥有双重人格般的舞台魅力——平时是认真踏实的学生会成员，上台后变身为热情奔放的偶像"雪菜"。非常热爱动画和特摄英雄，最喜欢的英雄是"红莲之剑士"。对偶像活动有着无比的热情和信念，坚信"偶像可以改变世界"。初代声优楠木灯因健康原因于2023年退出，由林鼓子接替。代表色是猩红色。' WHERE character_id=25;

UPDATE `character` SET hobby='编织、做便当、散步', description='虹咲学园三年级生。来自瑞士的留学生。性格温柔亲切、治愈系的大姐姐。非常喜欢日本文化，对日本的一切都充满好奇。擅长编织和做便当，经常为同好会成员准备点心。虽然日语还有些生涩，但用温柔的笑容和真诚的态度弥补了语言障碍。代表色是浅绿色。' WHERE character_id=26;

UPDATE `character` SET hobby='编程、玩游戏、收集电子配件', description='虹咲学园一年级生。因为极度不擅长表达情感而戴着"璃奈板"（电子表情板）来辅助交流。性格内向害羞但实际上非常聪明，擅长编程和科技。在偶像活动中逐渐学会用笑容表达自己，不再完全依赖璃奈板。是团体中最小只的成员（149cm），但有着不容小觑的坚强内心。代表色是纸白色。' WHERE character_id=27;

UPDATE `character` SET hobby='读书、音乐欣赏、整理', description='虹咲学园一年级生。性格认真严谨、一丝不苟，是典型的学生会干部型角色。有着极强的好胜心和责任感，对规则和程序非常看重。加入学园偶像同好会后，逐渐学会了放松和享受偶像活动的乐趣。在舞台上展现出与平时严肃形象截然不同的魅力。代表色是玉色。' WHERE character_id=28;

UPDATE `character` SET hobby='唱歌、弹吉他、收集CD', description='虹咲学园三年级生。来自美国的留学生。性格酷酷的，不太善于表达感情，但内心非常热爱音乐。擅长唱歌和弹吉他，音乐才华出众。对日本文化特别是日本音乐有着浓厚兴趣。虽然外表看起来冷漠，但实际上非常关心同伴，是默默付出的类型。代表色是铂银色。' WHERE character_id=29;

UPDATE `character` SET hobby='跳舞、逛街、收集可爱饰品', description='虹咲学园二年级生。来自中国香港的留学生。性格开朗、自信、有时略显强势，对自己的能力非常有信心。从小接受正规舞蹈训练，舞技出众。虽然有时候会显得自信过度，但其实非常努力也很关心队友。认为自己的魅力独一无二，不会输给任何人。代表色是玫金色。' WHERE character_id=30;

-- ===== Liella! =====
UPDATE `character` SET hobby='唱歌、弹吉他、收集猫头鹰周边', description='Liella!的领队。结丘女子高等学校普通科学生。性格腼腆内向，不擅长在公众面前表达，但内心善良真诚，总是为他人着想。拥有四分之一西班牙血统。歌唱实力极强，但因小学演出晕倒经历患上心理障碍——在人多场合会紧张失声。在唐可可的鼓励下逐渐克服恐惧，蜕变为引领团队前进的可靠领队。喜欢猫头鹰和兔子。名言："雲の上はいつも晴れ"。' WHERE character_id=31;

UPDATE `character` SET hobby='Cosplay、服装制作、喝奶茶、追星', description='中日混血，为实现学园偶像梦想从上海独自赴日留学。性格开朗、热情、爱笑也爱哭，对待喜欢的事物直截了当，有极强的毅力。兴趣是Cosplay和制作服装，在团队中负责服装和作词。学习成绩优异但运动极差。是LoveLive!系列中首位设定为中国籍的主要角色。是Sunny Passion的狂热粉丝。名言："思い立ったが吉日"。' WHERE character_id=32;

UPDATE `character` SET hobby='跳舞、做章鱼烧、发传单', description='结丘女子高等学校学生，香音的青梅竹马。性格活泼开朗，非常喜欢跳舞，从小和香音一起长大。家里经营章鱼烧店，经常帮忙。是Liella!中最擅长舞蹈的成员，负责编舞。虽然是团队中最娇小的成员之一，但活力十足，是团队的舞蹈核心。' WHERE character_id=33;

UPDATE `character` SET hobby='演艺、Cosplay、直播', description='结丘女子高等学校学生。自信满满的大小姐型角色，自称"Galaxy!"。家里非常有钱，拥有私人管家。从小就梦想成为明星，对各种演艺活动充满热情。虽然有时候会显得过于自信和夸张，但实际上非常努力认真，对偶像活动有着真诚的热爱。在团队中是舞台表现力最强的成员之一。' WHERE character_id=34;

UPDATE `character` SET hobby='弓道、书法、音乐', description='结丘女子高等学校音乐科学生。出身名门，从小接受严格的音乐教育，拥有绝对音感。性格冷静沉着，外表看起来冷淡但实际上内心温柔。最初对香音她们组建学园偶像持怀疑态度，后被打动加入Liella!。在音乐方面是团队中最专业的成员，负责音乐指导和和声编排。' WHERE character_id=35;

UPDATE `character` SET hobby='摄影、远足、照顾动物', description='结丘女子高等学校学生（二期生）。从北海道转学而来，性格天然纯朴、有些迷糊。非常喜欢大自然和动物，对城市生活还有些不适应。因为憧憬Liella!而加入团队，虽然舞蹈和唱歌都还需要努力，但纯真的性格和努力的态度赢得了大家的喜爱。' WHERE character_id=36;

-- 红蓝组 CP：米女芽衣（红） x 若菜四季（蓝）
UPDATE `character` SET hobby='绘画、设计、收集文具', description='结丘女子高等学校学生（二期生）。性格内向安静，眼神锐利常被误认为在生气，但其实内心非常温柔善良。与四季是从入学起就形影不离的搭档——四季的冷静理性与芽衣的感性温柔恰好互补，两人被粉丝称为"红蓝组"。擅长绘画和设计，在Liella!中负责视觉与周边设计。和夏美是同班好友。' WHERE character_id=37;

UPDATE `character` SET hobby='科学实验、收集矿石、读书', description='结丘女子高等学校学生（二期生）。性格冷静理性，是团队中头脑清晰的分析派。痴迷科学实验和自然观察，经常带着放大镜和采集瓶。看似冷淡实则非常在乎同伴，与芽衣是公认的"红蓝组"搭档——红色的芽衣热情内敛，蓝色的四季沉着理智，两人互补互助一起成长。在芽衣紧张不安时总会默默站在她身边给予支持。' WHERE character_id=38;

UPDATE `character` SET hobby='视频剪辑、摄影、SNS运营', description='结丘女子高等学校学生（二期生）。超级擅长视频剪辑和社交媒体运营，是Liella!的宣传担当。性格活泼可爱，喜欢用镜头记录团队的日常。虽然身高只有152cm，但能量满满。自称"Oninatsu"，经常拿着摄像机到处拍摄成员的日常。冬毬的姐姐。' WHERE character_id=39;

UPDATE `character` SET hobby='音乐、弹钢琴、读书', description='结丘女子高等学校学生（三期生）。来自奥地利的归国子女，音乐素养极高。性格自信骄傲，最初对Liella!不屑一顾，认为自己的实力远超她们。后在比赛中被Liella!的表演所感动，逐渐改变态度并加入团队。拥有出色的歌唱能力和音乐理论功底。' WHERE character_id=40;

UPDATE `character` SET hobby='整理、料理、照顾姐姐', description='结丘女子高等学校学生（三期生）。夏美的妹妹，性格与姐姐截然相反——沉稳冷静、做事有条理。非常擅长整理和烹饪，在团队中负责后勤支持。虽然比夏美年纪小，但在生活方面却总是她在照顾姐姐。加入Liella!后逐渐展现出自己独特的光芒。' WHERE character_id=41;

-- ===== 莲之空女学院 =====
UPDATE `character` SET hobby='卡拉OK、读书、不挑食', description='103期生。活力充沛的元气女孩，笑容不断，社交态度超级积极。有时会跑错方向，做事一股脑热。老家在长野县经营花卉农场。小时候体弱多病，选择寄宿制莲之空希望获得自由。开学第一天被学姐乙宗梢"公主抱"救下，受其邀请参观社团迎新后加入学园偶像俱乐部。是LoveLive!系列首个甜妹系leader。' WHERE character_id=42;

UPDATE `character` SET hobby='花样滑冰、制作便当', description='103期生。笨拙的努力家，性格太过认真，习惯先做计划再执行。从小练习花样滑冰，因缺乏表现力陷入瓶颈而放弃，来到莲之空寻求突破。开学第一天被花帆疯狂搭话时声明"不打算交朋友"（后成黑历史）。被夕雾缀理的舞台表演深深感动，加入俱乐部后自然而然照顾缀理的起居。有社交恐惧倾向但内心柔软。' WHERE character_id=43;

UPDATE `character` SET hobby='未知', description='103期生。莲之空女学院学园偶像俱乐部成员，Mira-Cra Park! 所属。活泼开朗，为团队带来阳光般的气氛。' WHERE character_id=44;

UPDATE `character` SET hobby='未知', description='104期生。Cerise Bouquet 成员。与日野下花帆搭档，继承已毕业的乙宗梢的位置。性格温柔细腻。' WHERE character_id=45;

UPDATE `character` SET hobby='未知', description='104期生。DOLLCHESTRA 成员。与村野沙耶香搭档，继承已毕业的夕雾缀理的位置。' WHERE character_id=46;

UPDATE `character` SET hobby='未知', description='104期生。Mira-Cra Park! 成员。与大泽瑠璃乃搭档，继承已毕业的藤岛慈的位置。' WHERE character_id=47;

UPDATE `character` SET hobby='未知', description='105期生。Edel Note 所属。来自海外的留学生，为莲之空带来国际化视野。' WHERE character_id=48;

UPDATE `character` SET hobby='未知', description='104期生。Edel Note 所属。与赛菈丝搭档。性格沉稳。' WHERE character_id=49;

UPDATE `character` SET hobby='未知', description='102期生（已毕业）。Cerise Bouquet 原成员。花帆的学姐与引路人，在开学第一天救了花帆并引导她走向学园偶像之路。莲之空首批毕业生之一。' WHERE character_id=50;

UPDATE `character` SET hobby='未知', description='102期生（已毕业）。DOLLCHESTRA 原成员。拥有令人惊叹的舞台表现力，是沙耶香加入俱乐部的契机。被称为"天才型"偶像。莲之空首批毕业生之一。' WHERE character_id=51;

UPDATE `character` SET hobby='未知', description='102期生（已毕业）。Mira-Cra Park! 原成员。性格活泼，为团队带来欢乐。莲之空首批毕业生之一。' WHERE character_id=52;

-- ===== A-RISE（对手团） =====
UPDATE `character` SET hobby='跳舞、编舞、唱歌', cheering_color='#e91e63', description='UTX高中三年级生，A-RISE的领队兼Center。拥有天生领袖气质，处事沉着冷静，对Live充满自信。外表娇小但气场强大，标志性特征是额前短刘海。带领A-RISE获得第一届LoveLive!全国大赛冠军。败给μ''s后以乐观心态鼓励她们前进，与高坂穗乃果成为好友。剧场版中与西木野真姬共同作曲《SUNNY DAY SONG》。座右铭：不拼命的努力。' WHERE character_id=53;

UPDATE `character` SET hobby='跳舞、唱歌、健身', cheering_color='#ff7043', description='UTX高中三年级生，A-RISE成员。身高163cm，身材高挑，是A-RISE中的舞蹈担当。与绮罗翼、优木杏树组成三人团体，以默契的配合和爆发力十足的舞台表现著称。' WHERE character_id=54;

UPDATE `character` SET hobby='跳舞、唱歌', cheering_color='#ffca28', description='UTX高中三年级生，A-RISE成员。A-RISE三人中个性最为温和的成员，以稳定扎实的唱功和柔和的笑容支持团体。性格善良，经常充当翼和英玲奈之间的调和剂。' WHERE character_id=55;

-- ===== Saint Snow（对手团） =====
UPDATE `character` SET hobby='骑马、制作和果子、滑雪', description='函馆圣泉女子高等学院三年级生，Saint Snow成员（姐姐）。举止温和文雅，比妹妹理亚更识大体，是典型的大和抚子型角色。对舞台演出抱持极高标准。受A-RISE影响走上学园偶像之路。非常疼爱妹妹理亚，想和她一起继承家里的和式甜点店。' WHERE character_id=56;

UPDATE `character` SET hobby='Rap、后空翻、体育', description='函馆圣泉女子高等学院一年级生，Saint Snow成员（妹妹）。沉默寡言、要强且是姐控。拥有极强的体育能力，擅长后空翻。在团体中负责Rap部分。与姐姐圣良组成Saint Snow，是Aqours在LoveLive大赛中的强劲对手。' WHERE character_id=57;

-- ===== Sunny Passion（对手团） =====
UPDATE `character` SET hobby='唱歌、跳舞', description='神津女子高等学校学生，Sunny Passion成员——"夜之妩媚"。拥有沉鱼落雁的美貌和优雅的举止。与悠奈自幼相识，共同追逐学园偶像梦想。是Liella!的前辈与好友。' WHERE character_id=58;

UPDATE `character` SET hobby='唱歌、跳舞、搞笑', description='神津女子高等学校学生，Sunny Passion的"太阳"。性格如向日葵般开朗，温暖人心。标志性口头禅"PA（パー）！"配合双手比"ハ"字。曾点拨涩谷香音帮助她察觉同伴的异样。视Liella!为"最强的对手，也是最喜欢的组合"。唐可可是她的死忠粉。' WHERE character_id=59;

-- ===== 人生不易部（BLUEBIRD）=====
UPDATE `character` SET hobby='即兴舞蹈、模仿恐龙叫声、吃面食', description='人生不易部部长。L高浅草分校1年生。父母在阿根廷挖恐龙化石，与祖母住在浅草。数学极差（九九乘法都没背完），中考失利进入L高。性格开朗活泼冒险，心情好时会不由自主起舞，看一遍影片就能跟着跳。鼻子很灵，运气极好常中奖。座右铭：纵使败北仍有下次机会。', cheering_color='#FFD700' WHERE character_id=60;

UPDATE `character` SET hobby='编程、数据挖掘、打游戏', description='人生不易部副部长。L高浅草分校1年生。港区麻布出身，四姐妹中的长女。理性至上效率主义，自认没有女子力。兴趣是编程，梦想成为IT企业社长。常忙到日夜颠倒。负责统整会议记录和所有文书工作。讨厌虫子。', cheering_color='#90CAF9' WHERE character_id=65;

UPDATE `character` SET hobby='攀岩、自行车、肌肉锻炼', description='L高浅草分校1年生。出身沼津，以成为攀岩专业运动员为目标。喜欢独自活动身体的时间，独立但意外有些少根筋。初期创立社团的四位成员之一。拥有食品运动营养师资格。', cheering_color='#CE93D8' WHERE character_id=67;

UPDATE `character` SET hobby='服装设计、书法、微波炉料理', description='L高浅草分校1年生。浅草老字号绸缎店独生女，自称"现代大和抚子""和服偶像"。怀有向世界推广和服文化的野心。仲见世通的偶像，能干的商业人气少女，常身着和服进行推广活动。拥有一头及膝长发。', cheering_color='#EF5350' WHERE character_id=66;

UPDATE `character` SET hobby='做点心、料理、熬夜', description='L高福井分校2年生。拥有一家一周开业一次的甜品店，梦想作为糕点师独立开业并在世界开店。对糕点学校的理论做法有疑问，为争取个人修行时间入读L高。有话直说的类型。与调布乃理子是好友。喜欢寿司等高级食材。', cheering_color='#FFB74D' WHERE character_id=61;

UPDATE `character` SET hobby='看动画、唱歌、吃甜食', description='L高福井分校1年生。岐阜县出身，现居福井。性格内向没有自信，自认是"量产型"。梦想成为声优，已签事务所但试镜不顺。有绝对音感，小时常在祖母的小酒馆唱歌。与金泽奇迹是好友。在意自己的腿，总穿长裙。' WHERE character_id=64;

UPDATE `character` SET hobby='看剧、芭蕾、下午茶', description='L高梅田分校1年生。稳重有品位的大小姐，从小学习芭蕾，热爱音乐剧。体弱，渴望出演男役（宝冢式男角）但因体力原因有困难。为优先剧团课业入读通信制L高。想要帮助波尔卡的善良女孩。', cheering_color='#F48FB1' WHERE character_id=62;

UPDATE `character` SET hobby='时尚、美容、编织、化妆', description='L高梅田分校2年生。大阪出身，父母在加州，从小随父母四处飞行而频繁转学。名字读作"Aurora"（极光）。喜爱美妆和头发护理，经营美妆频道，梦想开设美妆主题乐园。座右铭：爱即正义。与佐佐木翔音负责影片剪辑。', cheering_color='#BA68C8' WHERE character_id=63;

UPDATE `character` SET hobby='露营、昆虫、小动物、天文馆', description='L高梅田分校1年生。大阪中之岛出身，对环境问题有强烈危机感，为实践环保入读L高。认真努力但有点跳脱。有一个名为"雪ちゃん"的雪豹玩偶每晚抱着睡。不擅长运动。在辉夜鼓励下加入学园偶像活动。', cheering_color='#81C784' WHERE character_id=68;

UPDATE `character` SET hobby='直播、读书、拼图、制服收藏', description='L高仙台分校1年生。家里蹲，与父母关系不好，长期不登校。戴着白色猫耳耳机的实况主。园田海未的铁粉，房间里挂着海未海报。擅长音乐，会钢琴和小提琴。最初觉得人生不易部水准不够而"监视"，最后真香入部。身高血型等信息未公开，引发不少讨论。', cheering_color='#FFAB91' WHERE character_id=69;
