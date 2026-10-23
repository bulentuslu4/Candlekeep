import { BOOKS, BOOK_CATEGORIES, EN } from './books.js';
import { GAMES, GAME_CATEGORIES } from './games.js';
import { slug, norm } from '../util.js';

export const CATEGORIES = { book: BOOK_CATEGORIES, game: GAME_CATEGORIES };

function build(kind, groups, cats) {
  const out = [];
  const used = new Set();
  for (const c of cats) {
    for (const e of groups[c.id] || []) {
      let id = (kind === 'book' ? 'b-' : 'g-') + slug(e.t);
      while (used.has(id)) id += '-2';
      used.add(id);
      out.push({
        id,
        kind,
        category: c.id,
        title: e.t,
        titleEn: EN[e.t] || '',
        titleTr: e.tr || '',
        creator: e.a || '',
        series: e.s || '',
        seriesNo: e.n ?? null,
        aliases: e.al || [],
        steam: e.steam || null,
        platform: e.p || (kind === 'game' ? 'PC' : ''),
      });
    }
  }
  return out;
}

export const CATALOG = [
  ...build('book', BOOKS, BOOK_CATEGORIES),
  ...build('game', GAMES, GAME_CATEGORIES),
];

export const CATALOG_BY_ID = new Map(CATALOG.map((e) => [e.id, e]));

export function catalogId(kind, title) {
  return (kind === 'book' ? 'b-' : 'g-') + slug(title);
}

/** Ekranda gösterilecek adlar: ana ad İngilizce (varsa), altında Türkçesi, en altta orijinali. */
export function names(item) {
  const c = item.catalogId ? CATALOG_BY_ID.get(item.catalogId) : CATALOG_BY_ID.get(item.id);
  const en = item.titleEn || c?.titleEn || '';
  const tr = item.titleTr || c?.titleTr || '';
  const main = en || item.title;
  const n = norm(main);
  return {
    main,
    tr: tr && norm(tr) !== n ? tr : '',
    orig: en && norm(item.title) !== n ? item.title : '',
  };
}

/** Elle eklenmiş bir eser katalogdakiyle aynı mı? (İngilizce, Türkçe, orijinal ad ve takma adlara bakar) */
export function findCatalogMatch(kind, title) {
  const n = norm(title);
  if (!n) return null;
  return CATALOG.find((c) => c.kind === kind
    && [c.title, c.titleEn, c.titleTr, ...c.aliases].some((t) => t && norm(t) === n)) || null;
}

export function categoryLabel(kind, id) {
  return CATEGORIES[kind].find((c) => c.id === id)?.label || 'Diğer';
}

// İlk açılışta rafa konacaklar. Hepsi sonradan değiştirilebilir.
export const SEED = [
  // Kitaplar
  ...['A Game of Thrones', 'A Clash of Kings', 'A Storm of Swords', 'A Feast for Crows',
    'A Dance with Dragons', 'The Hedge Knight'].map((t) => ['book', t, 'read']),
  ...['The Last Wish', 'Sword of Destiny', 'Blood of Elves', 'Time of Contempt',
    'Baptism of Fire', 'The Tower of the Swallow', 'The Lady of the Lake'].map((t) => ['book', t, 'read']),
  ...["Harry Potter and the Philosopher's Stone", 'Harry Potter and the Chamber of Secrets',
    'Harry Potter and the Prisoner of Azkaban', 'Harry Potter and the Goblet of Fire',
    'Harry Potter and the Order of the Phoenix', 'Harry Potter and the Half-Blood Prince',
    'Harry Potter and the Deathly Hallows'].map((t) => ['book', t, 'read']),
  ['book', 'The Silmarillion', 'read'],
  ['book', 'The Way of Kings', 'read'],
  ['book', 'Words of Radiance', 'read'],
  ['book', 'Edgedancer', 'read'],
  ['book', 'Warbreaker', 'read'],
  ['book', 'Oathbringer', 'reading', { progress: '3. kısım' }],
  ['book', 'The Song of Achilles', 'read'],
  ['book', 'The Picture of Dorian Gray', 'read'],
  ['book', 'Le Lys dans la vallée', 'read'],
  ['book', 'Die Leiden des jungen Werthers', 'read', { langs: ['DE'] }],
  // Oyunlar
  ["Baldur's Gate 3", 'played', { fav: true }],
  ['Elden Ring', 'played', { fav: true }],
  ...['The Witcher 3: Wild Hunt', 'Red Dead Redemption 2', "Marvel's Spider-Man 2", 'Vampyr',
    'Sekiro: Shadows Die Twice', 'Stardew Valley', 'Graveyard Keeper', 'The Blood of Dawnwalker',
    'Kingdom Come: Deliverance II', 'Divinity: Original Sin 2', 'Pathfinder: Kingmaker',
    'Pathfinder: Wrath of the Righteous', 'Dark Souls III', 'Black Myth: Wukong'].map((t) => [t, 'played']),
  ['Graveyard Keeper 2', 'playing'],
  ['One Piece Bounty Rush', 'playing'],
  ['Overgeared Hero', 'playing'],
].map((row) => (row[0] === 'book' ? row : ['game', ...row]));
