// Quiz: rütbe kartı, paketler, soru akışı, sonuç ve başarımlar.

import { h, toast } from '../util.js';
import * as store from '../store.js';
import { DONE } from '../store.js';
import { PACKS } from '../quiz/packs.js';
import {
  RANKS, rankOf, totalXP, XP, BADGES, UNIVERSE_BADGES, evaluateBadges, universeProgress,
} from '../quiz/progress.js';

const DIFF = { 0: 'Karışık', 1: 'Kolay', 2: 'Orta', 3: 'Zor' };
const RUN_SIZE = 10;
let run = null;

export function eligible(pack) {
  const items = store.getState().items;
  return pack.questions.filter((q) => {
    const it = items[q.req];
    return it && DONE[it.kind].includes(it.status);
  });
}

const packsWithEligible = () => PACKS.map((pack) => ({ pack, eligible: eligible(pack) }));

/** Yeni kazanılan başarımları bildirir */
export function checkBadges() {
  const fresh = evaluateBadges(store.getState(), packsWithEligible());
  if (fresh.length) {
    store.saveSilently();
    fresh.forEach((n) => toast(`Başarım açıldı: ${n}`));
  }
  return fresh;
}

export function currentRank() {
  return rankOf(totalXP(store.getState()));
}

/* ---------- Soru seçimi ---------- */
function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

function pick(pack, diff) {
  const answered = store.getState().quiz.answered;
  const pool = eligible(pack).filter((q) => !diff || q.d === diff);
  // Önce hiç görülmemişler, sonra yanlış bilinenler, sonra en eski görülenler
  const score = (q) => {
    const a = answered[q.id];
    if (!a) return 0;
    return 1 + (a.right > a.wrong ? 1 : 0) + a.last / 1e15;
  };
  return shuffle(pool)
    .sort((a, b) => score(a) - score(b))
    .slice(0, RUN_SIZE)
    .map((q) => ({ ...q, options: shuffle(q.a.map((text, i) => ({ text, right: i === 0 }))) }));
}

function start(pack, diff, root) {
  const qs = pick(pack, diff);
  if (!qs.length) { toast('Bu seviyede açık soru yok.'); return; }
  run = { pack, diff, qs, i: 0, answers: [], chosen: null, xpBefore: totalXP(store.getState()) };
  renderQuiz(root);
  window.scrollTo(0, 0);
}

/* ---------- Soru ekranı ---------- */
function renderRun(root) {
  const { pack, qs, i } = run;
  const q = qs[i];
  const done = run.chosen !== null;

  const choose = (idx) => {
    if (run.chosen !== null) return;
    run.chosen = idx;
    run.answers.push({ id: q.id, right: q.options[idx].right, d: q.d });
    renderRun(root);
  };

  const next = () => {
    run.i++;
    run.chosen = null;
    if (run.i >= qs.length) finish(root);
    else renderRun(root);
  };

  const opts = q.options.map((o, idx) => {
    let cls = 'opt';
    if (done) {
      if (o.right) cls += ' right';
      else if (idx === run.chosen) cls += ' wrong';
      else cls += ' dim';
    }
    return h('button', { type: 'button', class: cls, disabled: done, onclick: () => choose(idx) },
      h('span', { class: 'opt-key' }, String(idx + 1)), h('span', null, o.text));
  });

  const wasRight = done && q.options[run.chosen].right;
  root.replaceChildren(h('section', { class: 'quiz-run' },
    h('div', { class: 'run-head' },
      h('span', null, `${pack.title}, ${DIFF[run.diff].toLocaleLowerCase('tr')}`),
      h('span', { class: 'run-count' }, `${i + 1} / ${qs.length}`),
      h('button', { type: 'button', class: 'link', onclick: () => { run = null; renderQuiz(root); } }, 'Bırak')),
    h('div', { class: 'run-bar' }, h('span', { style: { width: `${(i / qs.length) * 100}%` } })),
    h('p', { class: 'q-diff' }, DIFF[q.d]),
    h('h2', { class: 'q-text' }, q.q),
    h('div', { class: 'opts' }, opts),
    done && h('div', { class: 'feedback ' + (wasRight ? 'ok' : 'no') },
      h('strong', null, wasRight ? `Doğru, +${XP.answer[q.d]} XP` : 'Olmadı'),
      !wasRight && h('span', null, ` Doğrusu: ${q.a[0]}.`),
      q.ex && h('span', null, ' ' + q.ex)),
    done && h('button', { type: 'button', class: 'btn primary next-btn', onclick: next },
      i + 1 < qs.length ? 'Sonraki soru' : 'Sonucu gör')));

  root.onkeydown = (e) => {
    if (!run) return;
    const n = parseInt(e.key, 10);
    if (!done && n >= 1 && n <= q.options.length) choose(n - 1);
    else if (done && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next(); }
  };
  root.focus({ preventScroll: true });
}

/* ---------- Sonuç ---------- */
function finish(root) {
  const { pack, diff, answers, xpBefore } = run;
  const correct = answers.filter((a) => a.right).length;
  const total = answers.length;
  const perfect = correct === total && total >= 5;
  const xp = answers.reduce((s, a) => s + (a.right ? XP.answer[a.d] : 0), 0) + (perfect ? XP.perfect : 0);
  const before = rankOf(xpBefore);
  store.recordQuiz({ pack: pack.id, diff, correct, total, xp }, answers);
  const fresh = evaluateBadges(store.getState(), packsWithEligible());
  store.saveSilently();
  const after = currentRank();
  run = null;

  const lines = {
    perfect: 'Tek hata yok. Mumlar senin için yanıyor.',
    good: 'Sağlam bir tur.',
    mid: 'Fena değil, yanlışlar bir dahaki tura öncelikli gelecek.',
    low: 'Bu evrende biraz tozlanmışız. Yanlış bildiklerin bir dahakine ilk sırada.',
  };
  const ratio = correct / total;
  const msg = perfect ? lines.perfect : ratio >= 0.7 ? lines.good : ratio >= 0.4 ? lines.mid : lines.low;

  root.onkeydown = null;
  root.replaceChildren(h('section', { class: 'quiz-result' },
    h('p', { class: 'muted' }, pack.title),
    h('h1', { class: 'result-score' }, `${correct} / ${total}`),
    h('p', { class: 'lede' }, msg),
    h('p', { class: 'xp-gain' }, `+${xp} XP${perfect ? ` (kusursuz tur bonusu dahil)` : ''}`),
    after.lvl > before.lvl && h('div', { class: 'levelup' },
      h('span', { class: 'muted' }, 'Yeni rütbe'),
      h('strong', null, after.name)),
    fresh.length > 0 && h('div', { class: 'new-badges' },
      h('span', { class: 'muted' }, 'Açılan başarımlar'),
      fresh.map((n) => h('span', { class: 'badge-pill' }, n))),
    h('div', { class: 'row center' },
      h('button', { type: 'button', class: 'btn primary', onclick: () => start(pack, diff, root) }, 'Bir tur daha'),
      h('button', { type: 'button', class: 'btn', onclick: () => renderQuiz(root) }, 'Paketlere dön'))));
}

/* ---------- Ana ekran ---------- */
function rankCard() {
  const r = currentRank();
  return h('section', { class: 'rank-card' },
    h('div', { class: 'rank-main' },
      h('span', { class: 'rank-lvl', 'aria-label': `Seviye ${r.lvl}` }, r.lvl),
      h('div', null,
        h('h1', { class: 'rank-name' }, r.name),
        h('p', { class: 'muted' }, r.next
          ? `${r.xp} XP. ${r.next} rütbesine ${r.to - r.xp} XP kaldı.`
          : `${r.xp} XP. Zirvedesin.`))),
    h('div', { class: 'xp-bar' }, h('span', { style: { width: `${Math.round(r.pct * 100)}%` } })),
    h('ol', { class: 'ladder' }, RANKS.map((name, i) => h('li', { class: i + 1 < r.lvl ? 'past' : i + 1 === r.lvl ? 'now' : '' }, name))),
    h('details', { class: 'xp-help' },
      h('summary', null, 'XP nasıl kazanılır?'),
      h('p', { class: 'small' },
        `Okuduğun her kitap ${XP.bookRead}, oynadığın her oyun ${XP.gamePlayed} (bitirdiysen +${XP.gameFinished}), verdiğin her puan ${XP.rating}, `,
        `her alıntı ${XP.quote} XP (en fazla ${XP.quoteCap}), bitirdiğin her seri ${XP.series} XP. `,
        `Quiz'de doğru cevap kolayda ${XP.answer[1]}, ortada ${XP.answer[2]}, zorda ${XP.answer[3]} XP; hatasız tura +${XP.perfect}.`)));
}

function packCard(pack, list, root) {
  const st = store.getState();
  const total = pack.questions.length;
  const p = universeProgress(st, pack, list);
  const best = st.quiz.history.filter((r) => r.pack === pack.id).reduce((m, r) => Math.max(m, r.correct / r.total), -1);
  const badges = UNIVERSE_BADGES[pack.universe];
  const locked = list.length === 0;
  const countBy = (d) => list.filter((q) => q.d === d).length;
  return h('article', { class: 'pack' + (locked ? ' locked' : '') },
    h('div', { class: 'pack-head' },
      h('h3', null, pack.title),
      h('span', { class: 'muted small' }, pack.kind === 'book' ? 'Kitap' : 'Oyun')),
    h('p', { class: 'muted small' }, pack.sub),
    locked
      ? h('p', { class: 'small' }, pack.kind === 'book'
        ? 'Bu evrenden bitirdiğin bir kitap rafında görünmüyor.'
        : 'Bu oyunu rafında oynadım/bitirdim olarak işaretleyince açılır.')
      : [
        h('p', { class: 'small' }, `${list.length} / ${total} soru açık, ${p.known} tanesini bildin`,
          best >= 0 ? `. En iyi turun: %${Math.round(best * 100)}` : ''),
        h('div', { class: 'pack-badges' },
          h('span', { class: 'badge-pill' + (p.bronze ? ' on' : '') }, badges[0]),
          h('span', { class: 'badge-pill gold' + (p.gold ? ' on' : '') }, badges[1])),
        h('div', { class: 'diff-row' },
          h('button', { type: 'button', class: 'btn primary', onclick: () => start(pack, 0, root) }, 'Karışık'),
          [1, 2, 3].map((d) => h('button', {
            type: 'button', class: 'btn', disabled: !countBy(d), onclick: () => start(pack, d, root),
          }, DIFF[d]))),
      ]);
}

function badgeGrid() {
  const earned = store.getState().achievements;
  const general = BADGES.map((b) => ({ id: b.id, name: b.name, desc: b.desc }));
  const uni = Object.entries(UNIVERSE_BADGES).flatMap(([u, [bronze, gold, flavor]]) => {
    const pack = PACKS.find((p) => p.universe === u);
    return [
      { id: `u-${u}-1`, name: bronze, desc: `${pack.title}: bir quizi %70 ve üstüyle bitir` },
      { id: `u-${u}-2`, name: gold, desc: `${pack.title}: açık soruların hepsini en az bir kez bil. ${flavor}.`, gold: true },
    ];
  });
  const cell = (b) => h('li', { class: 'badge' + (earned[b.id] ? ' on' : '') + (b.gold ? ' gold' : ''), title: b.desc },
    h('span', { class: 'badge-name' }, b.name),
    h('span', { class: 'badge-desc' }, b.desc));
  const count = Object.keys(earned).length;
  return h('section', { class: 'dsection' },
    h('h2', { class: 'section-title' }, `Başarımlar (${count} / ${general.length + uni.length})`),
    h('h3', { class: 'sub-title' }, 'Genel'),
    h('ul', { class: 'badges' }, general.map(cell)),
    h('h3', { class: 'sub-title' }, 'Evrenler'),
    h('ul', { class: 'badges' }, uni.map(cell)));
}

export function renderQuiz(root) {
  if (run) { renderRun(root); return; }
  root.onkeydown = null;
  const all = packsWithEligible();
  const open = all.filter((x) => x.eligible.length);
  const closed = all.filter((x) => !x.eligible.length);
  root.replaceChildren(
    rankCard(),
    h('section', { class: 'dsection' },
      h('h2', { class: 'section-title' }, 'Soru paketleri'),
      h('p', { class: 'muted' }, 'Sorular sadece rafında bitmiş olarak işaretli eserlerden gelir; okumadığın ya da oynamadığın yerden soru çıkmaz.'),
      h('div', { class: 'packs' }, [...open, ...closed].map(({ pack, eligible: list }) => packCard(pack, list, root)))),
    badgeGrid());
}
