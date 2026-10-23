// Kapaklar: kitaplar Open Library'den, oyunlar Steam'den.
// Bulunanlar tarayıcıda önbelleğe alınır; bulunamayanlar için ciltli kitap görünümlü bir kapak çizilir.

import { h, hashHue, slug } from './util.js';
import { names } from './catalog/index.js';

const CACHE_KEY = 'kutuphane.covers.v1';
const RETRY_MS = 14 * 24 * 3600 * 1000;
let cache = {};
try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { cache = {}; }

let saveTimer;
function saveCache() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* önbellek şart değil */ }
  }, 500);
}

const keyOf = (item) => slug(item.title + '|' + (item.creator || ''));

/* ---------- Kitap arama kuyruğu ---------- */
const queue = [];
const waiting = new Map(); // key -> [callback]
let active = 0;
const MAX_ACTIVE = 2;

function firstAuthor(a) {
  if (!a || /^anonim$/i.test(a)) return '';
  return a.split(/\s*(?:&|,| ve | and )\s*/)[0];
}

async function searchOpenLibrary(item) {
  const tries = [];
  const author = firstAuthor(item.creator);
  tries.push({ title: item.title, author });
  if (item.titleTr && item.titleTr !== item.title) tries.push({ title: item.titleTr, author });
  if (author) tries.push({ title: item.title });
  let fallbackWork = null;
  for (const t of tries) {
    const u = new URL('https://openlibrary.org/search.json');
    u.searchParams.set('title', t.title);
    if (t.author) u.searchParams.set('author', t.author);
    u.searchParams.set('limit', '5');
    u.searchParams.set('fields', 'key,cover_i');
    const r = await fetch(u);
    if (!r.ok) throw new Error('Open Library ' + r.status);
    const j = await r.json();
    const doc = (j.docs || []).find((d) => d.cover_i);
    if (doc) return { url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`, work: doc.key || null };
    fallbackWork ||= j.docs?.[0]?.key || null;
  }
  return { url: null, work: fallbackWork };
}

function pump() {
  while (active < MAX_ACTIVE && queue.length) {
    const item = queue.shift();
    const key = keyOf(item);
    active++;
    searchOpenLibrary(item)
      .then((res) => { cache[key] = { ...res, t: Date.now() }; saveCache(); })
      .catch(() => { /* ağ hatası: önbelleğe yazma, sonra tekrar dener */ })
      .finally(() => {
        active--;
        const cbs = waiting.get(key) || [];
        waiting.delete(key);
        cbs.forEach((cb) => cb(cache[key]?.url || null));
        pump();
      });
  }
}

function requestBookCover(item, cb) {
  const key = keyOf(item);
  const c = cache[key];
  if (c && (c.url || Date.now() - c.t < RETRY_MS)) return cb(c.url);
  if (waiting.has(key)) return waiting.get(key).push(cb);
  waiting.set(key, [cb]);
  queue.push(item);
  pump();
}

/* ---------- Görünürlük ---------- */
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      e.target._load?.();
    }
  }, { rootMargin: '400px 0px' })
  : null;

function steamUrls(id) {
  return [
    `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900.jpg`,
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_600x900.jpg`,
    `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
  ];
}

function setImage(box, urls, alt) {
  const list = urls.filter(Boolean);
  if (!list.length) return;
  const img = h('img', { alt, loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' });
  let i = 0;
  img.onload = () => {
    // Open Library bulamazsa 1x1 boş görsel döndürebiliyor
    if (img.naturalWidth < 20) return img.onerror();
    box.classList.add('has-img');
  };
  img.onerror = () => {
    i++;
    if (i < list.length) img.src = list[i];
    else img.remove();
  };
  img.src = list[0];
  box.append(img);
}

/** Bir kapak kutusu oluşturur. size: 'card' | 'large' */
export function coverBox(item, { size = 'card' } = {}) {
  const hue = hashHue(item.title);
  const box = h('div', { class: `cover cover-${size}`, style: { '--h': hue } },
    h('div', { class: 'cover-fallback', 'aria-hidden': 'true' },
      h('span', { class: 'cf-title' }, names(item).main),
      item.creator && h('span', { class: 'cf-author' }, item.creator)));

  const load = () => {
    if (item.cover) return setImage(box, [item.cover], item.title);
    if (item.kind === 'game') {
      if (item.steam) setImage(box, steamUrls(item.steam), item.title);
      return;
    }
    requestBookCover(item, (url) => url && setImage(box, [url], item.title));
  };

  if (item.cover || (item.kind === 'game' && item.steam) || !io) load();
  else { box._load = load; io.observe(box); }
  return box;
}

/** Kapak seçici için: eserin farklı baskılarının kapakları */
export async function editionCovers(item) {
  const key = keyOf(item);
  let work = cache[key]?.work;
  if (!work) {
    const res = await searchOpenLibrary(item);
    cache[key] = { ...res, t: Date.now() };
    saveCache();
    work = res.work;
  }
  if (!work) return [];
  const r = await fetch(`https://openlibrary.org${work}/editions.json?limit=200`);
  if (!r.ok) throw new Error('Open Library ' + r.status);
  const j = await r.json();
  const ids = [];
  const first = cache[key]?.url?.match(/\/id\/(\d+)-/);
  if (first) ids.push(+first[1]);
  for (const e of j.entries || []) for (const c of e.covers || []) if (c > 0 && !ids.includes(c)) ids.push(c);
  return ids.slice(0, 80).map((id) => ({
    thumb: `https://covers.openlibrary.org/b/id/${id}-M.jpg`,
    full: `https://covers.openlibrary.org/b/id/${id}-L.jpg`,
  }));
}
