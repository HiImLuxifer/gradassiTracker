// TCGdex API wrapper — Italian locale
const BASE = 'https://api.tcgdex.net/v2/it';

// Simple in-memory cache
const cache = new Map();

async function fetchJson(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

/** Get all sets */
export async function getSets() {
  return fetchJson(`${BASE}/sets`);
}

/** Get a single set with all its cards */
export async function getSet(id) {
  return fetchJson(`${BASE}/sets/${id}`);
}

/** Get full card detail (with pricing) */
export async function getCard(id) {
  return fetchJson(`${BASE}/cards/${id}`);
}

/** Search cards by name */
export async function searchCards(query) {
  // TCGdex supports query params for filtering
  const url = `${BASE}/cards?name=like:${encodeURIComponent(query)}`;
  return fetchJson(url);
}

/**
 * Get modern sets only (Scarlet & Violet era onwards, plus Mega Evolution era)
 * Sorted by most recent first
 */
export async function getModernSets() {
  const allSets = await getSets();
  // Modern set IDs start with sv, me, or A/B (TCG Pocket)
  // We focus on main series: sv and me
  const modern = allSets.filter(s => {
    const id = s.id;
    return id.startsWith('sv') || id.startsWith('me') || id.startsWith('swsh');
  });
  // reverse so newest first
  return modern.reverse();
}

/** Format EUR price */
export function formatPrice(val) {
  if (val == null || val === 0) return 'N/D';
  return `€${val.toFixed(2)}`;
}

/** Get card image URL (high quality) */
export function cardImageUrl(imageBase) {
  return imageBase ? imageBase + '/high.webp' : '';
}

/** Get card image URL (low quality for thumbnails) */
export function cardThumbUrl(imageBase) {
  return imageBase ? imageBase + '/low.webp' : '';
}

// --- Nuovo Sistema di Cache Locale Prezzi ---

let localPricesCache = null;

/** 
 * Get updated local prices data
 */
export async function getLocalPrices() {
  if (localPricesCache) return localPricesCache;
  try {
    const res = await fetch('/data/it-prices.json');
    if (!res.ok) throw new Error('Prices non trovati');
    localPricesCache = await res.json();
    return localPricesCache;
  } catch (e) {
    console.warn('Impossibile caricare la cache dei prezzi locali (forse lo script non è stato eseguito).');
    return null;
  }
}

/** Get set logo URL */
export function setLogoUrl(logoBase) {
  if (!logoBase) return null;
  return logoBase + '.webp';
}
