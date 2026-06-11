// 中文语义向量搜索 —— 基于 Bigram TF-IDF + Cosine Similarity
// 纯 JavaScript，无外部依赖，无原生编译

// ── 中文分词：字符 bigram + 单字 ──
function tokenize(text) {
  if (!text) return [];
  var tokens = [];
  // 2-gram
  for (var i = 0; i < text.length - 1; i++) {
    tokens.push(text.substring(i, i + 2));
  }
  // 单字（高频有意义）
  for (var j = 0; j < text.length; j++) {
    var ch = text[j];
    // 过滤纯标点/空白
    if (/[一-鿿㐀-䶿a-zA-Z0-9]/.test(ch)) {
      tokens.push(ch);
    }
  }
  return tokens;
}

// ── 爱好同义词扩展 ──
var SYNONYMS = {
  '网球':   ['运动','田径','跑步','球类','户外','体力'],
  '运动':   ['网球','跑步','田径','体操','游泳','登山','户外'],
  '田径':   ['运动','跑步','网球','体操'],
  '跑步':   ['运动','田径','网球'],
  '绘画':   ['画画','设计','插图','美术','素描','涂鸦'],
  '设计':   ['绘画','画画','插图','服装'],
  '唱歌':   ['音乐','歌','声乐','卡拉OK','偶像'],
  '钢琴':   ['音乐','弹琴','键盘','作曲','乐器','演奏'],
  '音乐':   ['唱歌','钢琴','作曲','演奏','歌'],
  '科学':   ['实验','化学','物理','研究','观测'],
  '实验':   ['科学','化学','研究'],
  '占卜':   ['塔罗','运势','神秘','预言'],
  '料理':   ['做饭','烘焙','美食','厨房'],
  '游戏':   ['电子','电竞','手游'],
  '舞蹈':   ['跳舞','芭蕾','编舞','表演'],
};
function expandQuery(tokens) {
  var result = tokens.slice();
  for (var i = 0; i < tokens.length; i++) {
    var t = tokens[i];
    var syns = SYNONYMS[t];
    if (syns) {
      for (var j = 0; j < syns.length; j++) {
        if (result.indexOf(syns[j]) < 0) result.push(syns[j]);
      }
    }
  }
  return result;
}

// ── TF-IDF 引擎 ──
var index = null;    // { term: { df: N, idf: N, postings: { docId: tf } } }
var docs = null;     // [ { id, text, tokens, vector } ]
var allTokens = null; // Set of all terms

function buildIndex(characters) {
  docs = [];
  var df = {};  // document frequency for each term

  for (var i = 0; i < characters.length; i++) {
    var c = characters[i];
    var text = (c.name || '') + ' ' + (c.hobby || '') + ' ' + (c.description || '');
    var tokens = tokenize(text);
    // Count term frequency in this doc
    var tf = {};
    for (var j = 0; j < tokens.length; j++) {
      var t = tokens[j];
      tf[t] = (tf[t] || 0) + 1;
    }
    docs.push({ id: c.character_id, name: c.name, text: text, tokens: tokens, tf: tf });

    // Update document frequency
    var seen = {};
    for (var k = 0; k < tokens.length; k++) {
      var term = tokens[k];
      if (!seen[term]) { df[term] = (df[term] || 0) + 1; seen[term] = true; }
    }
  }

  // Compute IDF
  var N = docs.length;
  allTokens = Object.keys(df);
  index = {};
  for (var m = 0; m < allTokens.length; m++) {
    var term = allTokens[m];
    index[term] = { df: df[term], idf: Math.log((N + 1) / (df[term] + 1)) + 1 };
  }

  // Pre-compute TF-IDF vectors for all docs
  for (var n = 0; n < docs.length; n++) {
    docs[n].vector = tfidfVector(docs[n].tf);
  }
}

function tfidfVector(tf) {
  var vec = {};
  var terms = Object.keys(tf);
  for (var i = 0; i < terms.length; i++) {
    var t = terms[i];
    if (index[t]) {
      vec[t] = tf[t] * index[t].idf;
    }
  }
  // L2 normalize
  var sumSq = 0;
  var keys = Object.keys(vec);
  for (var j = 0; j < keys.length; j++) { sumSq += vec[keys[j]] * vec[keys[j]]; }
  var norm = Math.sqrt(sumSq) || 1;
  for (var k = 0; k < keys.length; k++) { vec[keys[k]] /= norm; }
  return vec;
}

// ── Cosine similarity ──
function cosineSimilarity(vecA, vecB) {
  var dot = 0;
  var aKeys = Object.keys(vecA);
  for (var i = 0; i < aKeys.length; i++) {
    var t = aKeys[i];
    if (vecB[t]) dot += vecA[t] * vecB[t];
  }
  // Both vectors are already L2-normalized, so cosine = dot product
  return dot;
}

// ── 搜索 ──
function search(query, topK, minScore) {
  topK = topK || 20;
  minScore = minScore || 0;
  if (!index) return [];

  var rawTokens = tokenize(query);
  var tokens = expandQuery(rawTokens);

  // Build query TF
  var qtf = {};
  for (var i = 0; i < tokens.length; i++) {
    qtf[tokens[i]] = (qtf[tokens[i]] || 0) + 1;
  }
  // Weight exact query terms higher
  for (var j = 0; j < rawTokens.length; j++) {
    qtf[rawTokens[j]] = (qtf[rawTokens[j]] || 0) + 2;
  }

  var qVec = tfidfVector(qtf);

  // Score all docs
  var results = [];
  for (var k = 0; k < docs.length; k++) {
    var score = cosineSimilarity(qVec, docs[k].vector);
    if (score >= minScore) {
      results.push({ character_id: docs[k].id, name: docs[k].name, score: Math.round(score * 1000) / 1000 });
    }
  }

  results.sort(function(a, b) { return b.score - a.score; });
  return results.slice(0, topK);
}

// ── 从数据库重建索引 ──
async function rebuild(poolInstance) {
  var [rows] = await poolInstance.query(
    'SELECT character_id, name, hobby, description FROM `character`'
  );
  buildIndex(rows);
  return { docCount: docs.length, termCount: allTokens ? allTokens.length : 0 };
}

// ── 获取角色详情（带分数） ──
async function getCharactersByIds(poolInstance, scoredIds) {
  if (!scoredIds.length) return [];
  var ids = scoredIds.map(function(s) { return s.character_id; });
  var [rows] = await poolInstance.query(
    'SELECT c.*, g.name AS group_name, cv.name AS cv_name FROM `character` c ' +
    'LEFT JOIN anime_group g ON c.group_id=g.group_id ' +
    'LEFT JOIN cv ON c.cv_id=cv.cv_id ' +
    'WHERE c.character_id IN (?) ORDER BY FIELD(c.character_id, ?)',
    [ids, ids]
  );
  // Attach scores
  var scoreMap = {};
  scoredIds.forEach(function(s) { scoreMap[s.character_id] = s.score; });
  rows.forEach(function(r) { r.similarity = scoreMap[r.character_id]; });
  return rows;
}

module.exports = { tokenize, rebuild, search, getCharactersByIds };
