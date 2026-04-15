// Set Detail — shows all cards in a set with sort & filter
import { getSet, cardThumbUrl, setLogoUrl, formatPrice, getCard } from '../api.js';

// Module-level state for sorting/filtering
let priceMap = new Map();   // cardId → price (number)
let rarityMap = new Map();  // cardId → rarity (string)
let allCards = [];
let currentContainer = null;

export async function renderSetDetail(container, setId) {
  const setData = await getSet(setId);
  allCards = setData.cards || [];
  currentContainer = container;
  priceMap = new Map();
  rarityMap = new Map();

  // Extract unique rarities from card data (if available at set level)
  const rarities = [...new Set(allCards.map(c => c.rarity).filter(Boolean))].sort();

  container.innerHTML = `
    <div class="fade-in">
      <div class="breadcrumb">
        <a href="#/sets">Set</a>
        <span class="breadcrumb-separator">›</span>
        <span>${setData.name}</span>
      </div>

      <div class="set-detail-header">
        ${setData.logo ? `<img class="set-detail-logo" src="${setLogoUrl(setData.logo)}" alt="${setData.name}">` : ''}
        <div>
          <h1 class="page-title" style="margin-bottom:0.25rem;">${setData.name}</h1>
          <div class="set-detail-meta">
            <span class="chip">${setData.cardCount?.official || allCards.length} carte</span>
            ${setData.releaseDate ? `<span class="chip">📅 ${setData.releaseDate}</span>` : ''}
            ${setData.serie ? `<span class="chip">${setData.serie.name}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="filter-bar">
        <input type="text" class="search-input" id="set-filter" placeholder="Filtra carte per nome..." style="max-width:300px;">
        <select class="search-select" id="set-sort">
          <option value="number">📋 Per numero</option>
          <option value="name-asc">🔤 A → Z</option>
          <option value="name-desc">🔤 Z → A</option>
          <option value="price-desc">💰 Prezzo ↓</option>
          <option value="price-asc">💰 Prezzo ↑</option>
        </select>
        ${rarities.length > 0 ? `
          <select class="search-select" id="set-rarity-filter">
            <option value="">✨ Tutte le rarità</option>
            ${rarities.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        ` : ''}
        <span class="results-count" id="set-results-count">${allCards.length} carte</span>
      </div>

      <div class="card-list-grid stagger" id="card-list">
        ${allCards.map((c, i) => renderCardItem(c, i)).join('')}
      </div>

      <div id="card-prices-loading" style="text-align:center;margin-top:1rem;color:var(--text-secondary);font-size:var(--font-size-sm);">
        ⏳ Caricamento prezzi in corso...
      </div>
    </div>
  `;

  // --- Event listeners ---
  const filterInput = document.getElementById('set-filter');
  const sortSelect = document.getElementById('set-sort');
  const raritySelect = document.getElementById('set-rarity-filter');

  filterInput.addEventListener('input', applyFilters);
  sortSelect.addEventListener('change', applySort);
  if (raritySelect) raritySelect.addEventListener('change', applyFilters);

  // Click handlers
  bindCardClicks(container);

  // Load prices asynchronously for all cards (in batches)
  loadPricesAsync(allCards, container);
}

/** Apply text + rarity filters (visibility toggle) */
function applyFilters() {
  const q = (document.getElementById('set-filter')?.value || '').toLowerCase();
  const raritySelect = document.getElementById('set-rarity-filter');
  const rarity = raritySelect ? raritySelect.value : '';
  const countEl = document.getElementById('set-results-count');
  let visible = 0;

  currentContainer.querySelectorAll('.card-list-item').forEach(item => {
    const nameMatch = item.dataset.name.toLowerCase().includes(q);
    const rarityMatch = !rarity || item.dataset.rarity === rarity;
    const show = nameMatch && rarityMatch;
    item.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  if (countEl) countEl.textContent = `${visible} carte`;
}

/** Sort cards and re-render the grid */
function applySort() {
  const sortValue = document.getElementById('set-sort')?.value || 'number';
  const grid = document.getElementById('card-list');
  if (!grid) return;

  // Make a working copy with original index for stable number sort
  let sorted = allCards.map((c, i) => ({ ...c, _origIdx: i }));

  switch (sortValue) {
    case 'name-asc':
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'));
      break;
    case 'name-desc':
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'it'));
      break;
    case 'price-desc':
      sorted.sort((a, b) => (priceMap.get(b.id) || 0) - (priceMap.get(a.id) || 0));
      break;
    case 'price-asc':
      sorted.sort((a, b) => {
        const pa = priceMap.get(a.id) ?? Infinity;
        const pb = priceMap.get(b.id) ?? Infinity;
        return pa - pb;
      });
      break;
    case 'number':
    default:
      sorted.sort((a, b) => a._origIdx - b._origIdx);
      break;
  }

  // Re-render grid
  grid.innerHTML = sorted.map((c, i) => renderCardItem(c, i)).join('');

  // Re-apply prices from priceMap
  priceMap.forEach((price, cardId) => {
    const priceEl = document.getElementById(`price-${cardId.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (priceEl) priceEl.textContent = formatPrice(price);
  });

  // Re-bind clicks
  bindCardClicks(currentContainer);

  // Re-apply active filters
  applyFilters();
}

/** Bind click events on card items */
function bindCardClicks(container) {
  container.querySelectorAll('.card-list-item').forEach(item => {
    item.addEventListener('click', () => {
      window.location.hash = `#/card/${item.dataset.cardId}`;
    });
  });
}

function renderCardItem(card, index) {
  const thumb = card.image ? cardThumbUrl(card.image) : '';
  const rarity = card.rarity || '';
  return `
    <div class="card-list-item" data-card-id="${card.id}" data-name="${card.name}" data-rarity="${rarity}" data-index="${index}">
      ${thumb ? `<img src="${thumb}" alt="${card.name}" loading="lazy">` : '<div style="aspect-ratio:367/512;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);"></div>'}
      <div class="card-list-item-name">${card.name}</div>
      <div class="card-list-item-info">#${card.localId}${rarity ? ` · ${rarity}` : ''}</div>
      <div class="card-list-item-price" id="price-${card.id.replace(/[^a-zA-Z0-9]/g, '_')}">—</div>
    </div>
  `;
}

async function loadPricesAsync(cards, container) {
  const loadingEl = document.getElementById('card-prices-loading');
  let loaded = 0;

  // Load in batches of 5 to avoid hammering the API
  for (let i = 0; i < cards.length; i += 5) {
    const batch = cards.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(c => getCard(c.id))
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const card = result.value;
        const priceEl = document.getElementById(`price-${card.id.replace(/[^a-zA-Z0-9]/g, '_')}`);
        const price = card.pricing?.cardmarket?.avg;
        if (price) {
          priceMap.set(card.id, price);
          if (priceEl) priceEl.textContent = formatPrice(price);
        }
        // Store rarity if fetched
        if (card.rarity) rarityMap.set(card.id, card.rarity);
      }
      loaded++;
    });

    if (loadingEl) {
      loadingEl.textContent = `⏳ Caricamento prezzi... ${loaded}/${cards.length}`;
    }
  }

  if (loadingEl) {
    loadingEl.textContent = `✅ Prezzi caricati per ${loaded} carte`;
    setTimeout(() => { loadingEl.style.opacity = '0'; }, 2000);
  }

  // Update rarity filter if rarities weren't available at set level
  updateRarityFilter();
}

/** Dynamically populate rarity filter if it was empty initially */
function updateRarityFilter() {
  let raritySelect = document.getElementById('set-rarity-filter');
  const filterBar = document.querySelector('.filter-bar');
  const allRarities = [...new Set(
    allCards.map(c => c.rarity || rarityMap.get(c.id)).filter(Boolean)
  )].sort();

  if (allRarities.length === 0) return;

  if (!raritySelect && filterBar) {
    // Create the select if it wasn't rendered initially
    const countEl = document.getElementById('set-results-count');
    const sel = document.createElement('select');
    sel.className = 'search-select';
    sel.id = 'set-rarity-filter';
    sel.innerHTML = `<option value="">✨ Tutte le rarità</option>` +
      allRarities.map(r => `<option value="${r}">${r}</option>`).join('');
    filterBar.insertBefore(sel, countEl);
    sel.addEventListener('change', applyFilters);
  } else if (raritySelect && raritySelect.options.length <= 1) {
    // Update existing empty select
    raritySelect.innerHTML = `<option value="">✨ Tutte le rarità</option>` +
      allRarities.map(r => `<option value="${r}">${r}</option>`).join('');
  }
}
