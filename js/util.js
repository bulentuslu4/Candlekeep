// Küçük yardımcılar: DOM oluşturma, metin normalleştirme, bildirim, çekmece.

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  let lateValue;
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'style' && typeof v === 'object') for (const [sk, sv] of Object.entries(v)) el.style.setProperty(sk.startsWith('--') ? sk : sk.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()), sv);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') lateValue = v;
      else if (k === 'checked' || k === 'selected' || k === 'disabled') el[k] = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  if (lateValue !== undefined) el.value = lateValue;
  return el;
}

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function fold(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ß/g, 'ss')
    .toLowerCase();
}

export function slug(s) {
  return fold(s).replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Eşleştirme ve arama için: küçük harf, aksansız, noktalama yok, the/a/an atılmış.
export function norm(s) {
  return fold(s)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w && !['the', 'a', 'an'].includes(w))
    .join(' ');
}

export function hashHue(s) {
  let x = 0;
  for (const ch of String(s)) x = (x * 31 + ch.codePointAt(0)) >>> 0;
  return x % 360;
}

export function fmtRating(r) {
  if (r == null || r === '') return '';
  return Number(r).toFixed(1).replace(/\.0$/, '');
}

export function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function readFile(file, as = 'text') {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    if (as === 'buffer') r.readAsArrayBuffer(file);
    else r.readAsText(file, 'utf-8');
  });
}

/* ---------- Bildirim (toast) ---------- */
export function toast(message, action) {
  const root = $('#toast-root');
  const t = h('div', { class: 'toast', role: 'status' },
    h('span', null, message),
    action && h('button', {
      class: 'toast-action',
      onclick: () => { action.run(); close(); },
    }, action.label));
  root.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  const timer = setTimeout(close, action ? 6000 : 3000);
  function close() {
    clearTimeout(timer);
    t.classList.remove('show');
    setTimeout(() => t.remove(), 250);
  }
}

/* ---------- Çekmece ve pencere ---------- */
let openPanel = null;
export function openDrawer(content, { wide = false, onClose } = {}) {
  closeDrawer();
  const panel = h('aside', { class: 'drawer' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true' },
    h('button', { class: 'drawer-close', 'aria-label': 'Kapat', onclick: closeDrawer }, '×'),
    content);
  const shade = h('div', { class: 'shade', onclick: closeDrawer });
  const wrap = h('div', { class: 'overlay' }, shade, panel);
  $('#drawer-root').append(wrap);
  document.body.classList.add('locked');
  requestAnimationFrame(() => wrap.classList.add('open'));
  const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
  document.addEventListener('keydown', onKey);
  openPanel = { wrap, onKey, onClose };
  panel.querySelector('input, select, textarea, button:not(.drawer-close)')?.focus({ preventScroll: true });
  return panel;
}

export function closeDrawer() {
  if (!openPanel) return;
  const { wrap, onKey, onClose } = openPanel;
  openPanel = null;
  document.removeEventListener('keydown', onKey);
  wrap.classList.remove('open');
  document.body.classList.remove('locked');
  setTimeout(() => wrap.remove(), 220);
  onClose?.();
}
