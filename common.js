// アプリ本体と QR 作成ページの共通処理

const STORE_FAMILY = 'oyaQuiz.family';
const STORE_BEST = 'oyaQuiz.best';

function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

// 入力のゆれを吸収する（カタカナ→ひらがな、全角半角、長音記号、空白や記号）
function normalizeAnswer(s) {
  s = String(s || '').normalize('NFKC').toLowerCase();
  s = s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  s = s.replace(/[~〜\-−‐]/g, 'ー');
  s = s.replace(/[\s・。、.,!?！？「」『』()（）]/g, '');
  return s;
}

function chars(s) {
  return Array.from(s);
}

// 家族の問題 ⇔ URL の # 以降に載せる文字列
// 形式: {v:1, s:[[問題文, ひらがな, 表示, ヒント], ...]}
function encodeFamily(list) {
  const payload = { v: 1, s: list.map(x => [x.q, x.kana, x.display || '', x.hint || '']) };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeFamily(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  if (!payload || payload.v !== 1 || !Array.isArray(payload.s)) throw new Error('形式が違います');
  return payload.s
    .filter(r => Array.isArray(r) && r[0] && r[1])
    .map(r => ({ cat: '家族の問題', q: String(r[0]), kana: normalizeAnswer(r[1]), display: String(r[2] || r[1]), hint: String(r[3] || '') }));
}
