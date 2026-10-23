// Tüm veri tarayıcının localStorage'ında tek anahtar altında durur.
// Yedek dosyası bu nesnenin aynısıdır; v2'deki XP/başarımlar için `log` tutuluyor.

import { CATALOG_BY_ID, SEED, catalogId } from './catalog/index.js';
import { debounce, toast } from './util.js';

const KEY = 'kutuphane.data.v1';
export const SCHEMA = 1;

export const STATUS = {
  book: [
    { id: 'reading', label: 'Okuyorum' },
    { id: 'read', label: 'Okudum' },
    { id: 'want', label: 'Okuyacağım' },
    { id: 'dropped', label: 'Bıraktım' },
  ],
  game: [
    { id: 'playing', label: 'Oynuyorum' },
    { id: 'finished', label: 'Bitirdim' },
    { id: 'played', label: 'Oynadım' },
    { id: 'want', label: 'Oynayacağım' },
    { id: 'dropped', label: 'Bıraktım' },
  ],
};
export const DONE = { book: ['read'], game: ['finished', 'played'] };

export function statusLabel(kind, id) {
  return STATUS[kind].find((s) => s.id === id)?.label || '';
}

function empty() {
  return {
    schema: SCHEMA,
    items: {},
    dismissed: {},
    quotes: [],
    settings: { theme: 'parsomen', lastBackup: null },
    log: [],
    createdAt: Date.now(),
  };
}

let state;
const listeners = new Set();

export function getState() {
  return state;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      state = migrate(JSON.parse(raw));
      return { fresh: false };
    }
  } catch (e) {
    console.error('Kayıt okunamadı', e);
  }
  state = empty();
  seed();
  persist();
  return { fresh: true };
}

function migrate(s) {
  const base = empty();
  return { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}) } };
}

function seed() {
  for (const [kind, title, status, extra] of SEED) {
    const cid = catalogId(kind, title);
    if (!CATALOG_BY_ID.has(cid)) {
      console.warn('Başlangıç listesinde katalogda olmayan eser:', title);
      continue;
    }
    addFromCatalog(cid, status, extra, { silent: true, noLog: true });
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error(e);
    toast('Kaydedilemedi: tarayıcı depolama alanı dolmuş olabilir. Yedek alıp eski alıntıları temizle.');
  }
}
const persistSoon = debounce(persist, 250);

function emit(change) {
  persistSoon();
  for (const fn of listeners) fn(change);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function logEvent(e) {
  state.log.push({ t: Date.now(), ...e });
  if (state.log.length > 5000) state.log.splice(0, state.log.length - 5000);
}

/* ---------- Eserler ---------- */

export function getItem(id) {
  return state.items[id] || null;
}

export function itemsOf(kind) {
  return Object.values(state.items).filter((i) => i.kind === kind);
}

export function addFromCatalog(cid, status, extra = {}, opts = {}) {
  const c = CATALOG_BY_ID.get(cid);
  if (!c) return null;
  const now = Date.now();
  const item = {
    id: c.id,
    catalogId: c.id,
    kind: c.kind,
    title: c.title,
    titleTr: c.titleTr,
    creator: c.creator,
    series: c.series,
    seriesNo: c.seriesNo,
    category: c.category,
    platform: c.platform,
    steam: c.steam,
    tags: [],
    langs: [],
    status,
    rating: null,
    fav: false,
    progress: '',
    note: '',
    cover: '',
    addedAt: now,
    updatedAt: now,
    ...extra,
  };
  state.items[item.id] = item;
  delete state.dismissed[cid];
  if (!opts.noLog) logEvent({ type: 'add', id: item.id, kind: item.kind, to: status });
  if (!opts.silent) emit({ type: 'item', id: item.id });
  return item;
}

export function createCustom(data) {
  const now = Date.now();
  const id = data.id || 'c-' + now.toString(36) + Math.random().toString(36).slice(2, 6);
  const item = {
    id, catalogId: null, kind: data.kind, title: '', titleTr: '', creator: '', series: '',
    seriesNo: null, category: '', platform: data.kind === 'game' ? 'PC' : '', steam: null,
    tags: [], langs: [], status: data.kind === 'book' ? 'read' : 'played', rating: null, fav: false,
    progress: '', note: '', cover: '', addedAt: now, updatedAt: now, ...data,
  };
  state.items[id] = item;
  logEvent({ type: 'add', id, kind: item.kind, to: item.status });
  emit({ type: 'item', id });
  return item;
}

export function updateItem(id, patch) {
  const it = state.items[id];
  if (!it) return;
  if ('status' in patch && patch.status !== it.status) {
    logEvent({ type: 'status', id, kind: it.kind, from: it.status, to: patch.status });
  }
  if ('rating' in patch && patch.rating !== it.rating) {
    logEvent({ type: 'rating', id, kind: it.kind, to: patch.rating });
  }
  Object.assign(it, patch, { updatedAt: Date.now() });
  emit({ type: 'item', id });
}

export function removeItem(id) {
  const it = state.items[id];
  if (!it) return null;
  delete state.items[id];
  logEvent({ type: 'remove', id, kind: it.kind });
  emit({ type: 'item', id });
  return it;
}

export function restoreItem(item) {
  state.items[item.id] = item;
  emit({ type: 'item', id: item.id });
}

export function setDismissed(cid, on) {
  if (on) state.dismissed[cid] = true;
  else delete state.dismissed[cid];
  emit({ type: 'item', id: cid });
}

/* ---------- Alıntılar ---------- */

export function setQuotes(quotes, mode = 'replace') {
  state.quotes = mode === 'replace' ? quotes : [...state.quotes, ...quotes];
  emit({ type: 'quotes' });
}

export function updateQuote(id, patch) {
  const q = state.quotes.find((x) => x.id === id);
  if (!q) return;
  Object.assign(q, patch);
  emit({ type: 'quotes' });
}

export function removeQuote(id) {
  const i = state.quotes.findIndex((x) => x.id === id);
  if (i < 0) return null;
  const [q] = state.quotes.splice(i, 1);
  emit({ type: 'quotes' });
  return { q, i };
}

export function restoreQuote({ q, i }) {
  state.quotes.splice(i, 0, q);
  emit({ type: 'quotes' });
}

export function quotesFor(bookId) {
  return state.quotes.filter((q) => q.bookId === bookId);
}

/* ---------- Ayarlar ---------- */

export function setSetting(key, value) {
  state.settings[key] = value;
  emit({ type: 'settings', key });
}

/* ---------- Yedek ---------- */

export function exportBackup() {
  state.settings.lastBackup = Date.now();
  persist();
  return JSON.stringify({ app: 'kutuphane', schema: SCHEMA, exportedAt: new Date().toISOString(), data: state }, null, 1);
}

export function importBackup(text, mode = 'replace') {
  const obj = JSON.parse(text);
  const data = obj && obj.app === 'kutuphane' ? obj.data : null;
  if (!data || typeof data.items !== 'object') throw new Error('Bu dosya bir Candlekeep yedeği değil.');
  if (mode === 'replace') {
    state = migrate(data);
  } else {
    const incoming = migrate(data);
    for (const [id, it] of Object.entries(incoming.items)) {
      const mine = state.items[id];
      if (!mine || (it.updatedAt || 0) > (mine.updatedAt || 0)) state.items[id] = it;
    }
    Object.assign(state.dismissed, incoming.dismissed);
    const known = new Set(state.quotes.map((q) => q.id));
    state.quotes.push(...incoming.quotes.filter((q) => !known.has(q.id)));
    state.log.push(...incoming.log);
    state.log.sort((a, b) => a.t - b.t);
  }
  persist();
  emit({ type: 'all' });
}

export function resetAll() {
  state = empty();
  seed();
  persist();
  emit({ type: 'all' });
}
