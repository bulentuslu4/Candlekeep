// Rütbeler, XP hesabı ve başarımlar.
// XP saklanmaz, her seferinde raftan ve quiz geçmişinden hesaplanır; böylece hiçbir şey kaymaz.

import { CATALOG } from '../catalog/index.js';
import { DONE } from '../store.js';

/* ---------- Rütbeler ---------- */
export const RANKS = [
  'Küllü', 'Yolcu', 'Arayıcı', 'Yeminli', 'Kılıç Adayı',
  'Şövalye', 'Kül Şövalyesi', 'Kül Lordu', 'Alevin Bekçisi', 'İlk Alevin Varisi',
];
const need = (lvl) => Math.round(300 * Math.pow(lvl - 1, 1.7)); // lvl 1 → 0 XP

export function rankOf(xp) {
  let lvl = 1;
  while (lvl < RANKS.length && xp >= need(lvl + 1)) lvl++;
  const from = need(lvl);
  const to = lvl < RANKS.length ? need(lvl + 1) : null;
  return { lvl, name: RANKS[lvl - 1], xp, from, to, pct: to ? (xp - from) / (to - from) : 1, next: to ? RANKS[lvl] : null };
}

/* ---------- XP ---------- */
export const XP = {
  bookRead: 15, gamePlayed: 12, gameFinished: 5, rating: 3, quote: 1, quoteCap: 300, series: 40,
  answer: { 1: 15, 2: 30, 3: 50 }, perfect: 60,
};

function completedSeries(state) {
  const groups = new Map();
  for (const c of CATALOG) {
    if (!c.series) continue;
    const k = c.kind + '|' + c.series;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  let n = 0;
  for (const list of groups.values()) {
    const main = list.filter((c) => c.seriesNo != null && Number.isInteger(c.seriesNo));
    const check = main.length >= 2 ? main : null;
    if (check && check.every((c) => DONE[c.kind].includes(state.items[c.id]?.status))) n++;
  }
  return n;
}

export function stats(state) {
  const items = Object.values(state.items);
  const booksRead = items.filter((i) => i.kind === 'book' && i.status === 'read').length;
  const games = items.filter((i) => i.kind === 'game' && DONE.game.includes(i.status)).length;
  const finished = items.filter((i) => i.kind === 'game' && i.status === 'finished').length;
  const rated = items.filter((i) => i.rating != null).length;
  const langs = new Set(items.flatMap((i) => i.langs || []));
  const hist = state.quiz?.history || [];
  return {
    booksRead, games, finished, rated, langs: langs.size,
    quotes: state.quotes.length,
    series: completedSeries(state),
    quizzes: hist.length,
    correct: hist.reduce((a, r) => a + r.correct, 0),
    quizXP: hist.reduce((a, r) => a + r.xp, 0),
  };
}

export function totalXP(state) {
  const s = stats(state);
  return s.booksRead * XP.bookRead
    + s.games * XP.gamePlayed + s.finished * XP.gameFinished
    + s.rated * XP.rating
    + Math.min(s.quotes, XP.quoteCap) * XP.quote
    + s.series * XP.series
    + s.quizXP;
}

/* ---------- Başarımlar ---------- */
// Evren başarımları: bronz = o pakette %70+ ile bir quiz bitir, altın = paketteki açık soruların hepsini en az bir kez doğru bil
export const UNIVERSE_BADGES = {
  asoiaf: ['Demir Halka', 'Valyria Çeliği Halka', 'Maester zincirinin ilk ve en nadir halkaları'],
  stormlight: ['Köprü Dört', 'Fırtına Kutsalı', 'Parçalanmış Ovalar\'dan sağ dönenler'],
  witcher: ['Kurt Madalyonu', 'Kaer Morhen Mezunu', 'Kurt Okulu\'nun sınavları'],
  hp: ['Hogwarts Öğrencisi', 'Baş Öğrenci', 'Hogwarts sınavları'],
  monte: ['If Şatosu Mahkûmu', 'Bekle ve Umut Et', 'Edmond Dantès\'in izinde'],
  bg3: ['İribaş Taşıyıcı', 'Doğal 20', 'Sword Coast\'un sınavları'],
  eldenring: ['Lekeli', 'Elden Lord', 'Ara Diyarlar\'ın sınavları'],
  witcher3: ['Gwent Oyuncusu', 'Vahşi Av Avcısı', 'Kıta\'nın sınavları'],
  rdr2: ['Van der Linde Çetesi', 'Beecher\'s Hope', 'Batı\'nın son kanun kaçakları'],
};

export const BADGES = [
  { id: 'ilk-quiz', name: 'İlk Kıvılcım', desc: 'İlk quizini bitir', test: (s) => s.quizzes >= 1 },
  { id: 'kusursuz', name: 'Kusursuz', desc: 'Bir quizi hiç hata yapmadan bitir', test: (s, st) => st.quiz.history.some((r) => r.correct === r.total && r.total >= 5) },
  { id: 'atesten-gecen', name: 'Ateşten Geçen', desc: 'Zor seviyede bir quizi hatasız bitir', test: (s, st) => st.quiz.history.some((r) => r.diff === 3 && r.correct === r.total && r.total >= 5) },
  { id: 'seri-darbe', name: 'Seri Darbe', desc: 'Art arda 3 quizde %80 ve üstü yap', test: (s, st) => {
    let run = 0;
    for (const r of st.quiz.history) { run = r.correct / r.total >= 0.8 ? run + 1 : 0; if (run >= 3) return true; }
    return false;
  } },
  { id: 'mudavim', name: 'Müdavim', desc: '25 quiz bitir', test: (s) => s.quizzes >= 25 },
  { id: 'bilge', name: 'Bilge', desc: 'Toplam 250 doğru cevap ver', test: (s) => s.correct >= 250 },
  { id: 'gece-nobeti', name: 'Gece Nöbeti', desc: 'Gece yarısıyla sabah 5 arasında bir quiz bitir', test: (s, st) => st.quiz.history.some((r) => new Date(r.t).getHours() < 5) },
  { id: 'kitap-100', name: 'Kitap Kurdu', desc: '100 kitabı "Okudum" olarak işaretle', test: (s) => s.booksRead >= 100 },
  { id: 'kitap-250', name: 'Yaşayan Kütüphane', desc: '250 kitabı "Okudum" olarak işaretle', test: (s) => s.booksRead >= 250 },
  { id: 'oyun-100', name: 'Diyarlar Gezgini', desc: '100 oyunu oynadım ya da bitirdim olarak işaretle', test: (s) => s.games >= 100 },
  { id: 'puan-100', name: 'Eleştirmen', desc: '100 esere puan ver', test: (s) => s.rated >= 100 },
  { id: 'alinti-100', name: 'Kâtip', desc: 'Alıntı defterinde 100 alıntı biriktir', test: (s) => s.quotes >= 100 },
  { id: 'cok-dilli', name: 'Çok Dilli', desc: 'Üç farklı dilde kitap okuduğunu işaretle', test: (s) => s.langs >= 3 },
  { id: 'seri-avcisi', name: 'Seri Avcısı', desc: '5 serinin bütün ana kitaplarını bitir', test: (s) => s.series >= 5 },
];

export function universeProgress(state, pack, eligible) {
  const hist = state.quiz.history.filter((r) => r.pack === pack.id);
  const bronze = hist.some((r) => r.correct / r.total >= 0.7 && r.total >= 5);
  const known = eligible.filter((q) => (state.quiz.answered[q.id]?.right || 0) > 0).length;
  const gold = eligible.length >= 5 && known === eligible.length;
  return { bronze, gold, known, total: eligible.length };
}

/** Kazanılmış başarımları hesaplar; yeni kazanılanları döndürür (ve state'e işler) */
export function evaluateBadges(state, packsWithEligible) {
  const s = stats(state);
  const earned = state.achievements;
  const fresh = [];
  const give = (id, name) => { if (!earned[id]) { earned[id] = Date.now(); fresh.push(name); } };
  for (const b of BADGES) if (b.test(s, state)) give(b.id, b.name);
  for (const { pack, eligible } of packsWithEligible) {
    const names = UNIVERSE_BADGES[pack.universe];
    if (!names) continue;
    const p = universeProgress(state, pack, eligible);
    if (p.bronze) give(`u-${pack.universe}-1`, names[0]);
    if (p.gold) give(`u-${pack.universe}-2`, names[1]);
  }
  return fresh;
}
