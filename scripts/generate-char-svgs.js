// 为每个角色生成独立 SVG + index.json 映射
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'src', 'client', 'images', 'chars');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const chars = [
  { id:1,  name:'穂乃果', group:"μ's",       color:'#ff8c42' },
  { id:2,  name:'絵里',   group:"μ's",       color:'#5bc0de' },
  { id:3,  name:'小鳥',   group:"μ's",       color:'#b0bec5' },
  { id:4,  name:'海未',   group:"μ's",       color:'#1a3a8a' },
  { id:5,  name:'凛',     group:"μ's",       color:'#fdd835' },
  { id:6,  name:'真姫',   group:"μ's",       color:'#e53935' },
  { id:7,  name:'希',     group:"μ's",       color:'#9c27b0' },
  { id:8,  name:'花陽',   group:"μ's",       color:'#43a047' },
  { id:9,  name:'にこ',   group:"μ's",       color:'#e91e8c' },
  { id:10, name:'千歌',   group:'Aqours',    color:'#ff9800' },
  { id:11, name:'梨子',   group:'Aqours',    color:'#f48fb1' },
  { id:12, name:'曜',     group:'Aqours',    color:'#4fc3f7' },
  { id:13, name:'善子',   group:'Aqours',    color:'#9e9e9e' },
  { id:14, name:'花丸',   group:'Aqours',    color:'#fdd835' },
  { id:15, name:'ルビィ', group:'Aqours',    color:'#f06292' },
  { id:16, name:'果南',   group:'Aqours',    color:'#66bb6a' },
  { id:17, name:'ダイヤ', group:'Aqours',    color:'#e53935' },
  { id:18, name:'鞠莉',   group:'Aqours',    color:'#ab47bc' },
  { id:19, name:'歩夢',   group:'虹ヶ咲',    color:'#f8bbd0' },
  { id:20, name:'かすみ', group:'虹ヶ咲',    color:'#fff176' },
  { id:21, name:'しずく', group:'虹ヶ咲',    color:'#80deea' },
  { id:22, name:'果林',   group:'虹ヶ咲',    color:'#283593' },
  { id:23, name:'愛',     group:'虹ヶ咲',    color:'#e65100' },
  { id:24, name:'彼方',   group:'虹ヶ咲',    color:'#7b1fa2' },
  { id:25, name:'せつ菜', group:'虹ヶ咲',    color:'#d32f2f' },
  { id:26, name:'エマ',   group:'虹ヶ咲',    color:'#81c784' },
  { id:27, name:'璃奈',   group:'虹ヶ咲',    color:'#eceff1' },
  { id:28, name:'栞子',   group:'虹ヶ咲',    color:'#26a69a' },
  { id:29, name:'ミア',   group:'虹ヶ咲',    color:'#90a4ae' },
  { id:30, name:'嵐珠',   group:'虹ヶ咲',    color:'#e91e63' },
  { id:31, name:'香音',   group:'Liella!',   color:'#ffa726' },
  { id:32, name:'可可',   group:'Liella!',   color:'#42a5f5' },
  { id:33, name:'千砂都', group:'Liella!',   color:'#f48fb1' },
  { id:34, name:'すみれ', group:'Liella!',   color:'#9ccc65' },
  { id:35, name:'恋',     group:'Liella!',   color:'#4dd0e1' },
  { id:36, name:'きな子', group:'Liella!',   color:'#ffee58' },
  { id:37, name:'メイ',   group:'Liella!',   color:'#e53935' },
  { id:38, name:'四季',   group:'Liella!',   color:'#29b6f6' },
  { id:39, name:'夏美',   group:'Liella!',   color:'#ec407a' },
  { id:40, name:'ウィーン', group:'Liella!', color:'#ab47bc' },
  { id:41, name:'冬毬',   group:'Liella!',   color:'#26a69a' },
  { id:42, name:'花帆',   group:'蓮ノ空',    color:'#ffb74d' },
  { id:43, name:'沙耶香', group:'蓮ノ空',    color:'#5c6bc0' },
  { id:44, name:'瑠璃乃', group:'蓮ノ空',    color:'#f06292' },
  { id:45, name:'吟子',   group:'蓮ノ空',    color:'#64b5f6' },
  { id:46, name:'小鈴',   group:'蓮ノ空',    color:'#ffd54f' },
  { id:47, name:'姫芽',   group:'蓮ノ空',    color:'#ba68c8' },
  { id:48, name:'セラス', group:'蓮ノ空',    color:'#ef5350' },
  { id:49, name:'泉',     group:'蓮ノ空',    color:'#4fc3f7' },
  { id:53, name:'ツバサ', group:'A-RISE',    color:'#e91e63' },
  { id:54, name:'英玲奈', group:'A-RISE',    color:'#ff7043' },
  { id:55, name:'杏樹',   group:'A-RISE',    color:'#ffca28' },
  { id:56, name:'聖良',   group:'SaintSnow', color:'#42a5f5' },
  { id:57, name:'理亞',   group:'SaintSnow', color:'#eceff1' },
  { id:58, name:'摩央',   group:'SunnyPass', color:'#ce93d8' },
  { id:59, name:'悠奈',   group:'SunnyPass', color:'#ffb74d' },
];

const mapping = {};
for (const c of chars) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 230">
  <defs><radialGradient id="g" cx="50%" cy="25%"><stop offset="0%" stop-color="${c.color}" stop-opacity="0.35"/><stop offset="100%" stop-color="${c.color}" stop-opacity="0.06"/></radialGradient></defs>
  <rect width="200" height="230" fill="url(#g)" rx="12"/>
  <text x="100" y="105" text-anchor="middle" font-size="26" fill="${c.color}" font-weight="bold" opacity="0.4">${c.group}</text>
  <text x="100" y="150" text-anchor="middle" font-size="44" fill="${c.color}" font-weight="bold" opacity="0.55">${c.name}</text>
</svg>`;
  const file = `char-${c.id}-${c.name}.svg`;
  fs.writeFileSync(path.join(outDir, file), svg);
  mapping[c.id] = file;
}
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(mapping));
console.log(`${Object.keys(mapping).length} 个 SVG + index.json → ${outDir}`);
