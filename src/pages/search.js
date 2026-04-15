// Search page — search cards by name with rarity filter and sort
import { searchCards, getCard, cardThumbUrl, formatPrice } from '../api.js';

export async function renderSearch(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">Ricerca Carte</h1>
        <p class="page-subtitle">Cerca tra migliaia di carte Pokémon TCG in italiano</p>
      </div>

      <div class="search-controls">
        <input type="text" class="search-input" id="search-input" placeholder="Cerca carte Pokémon..." autofocus>
        <button class="btn btn-primary" id="search-btn">Cerca</button>
      </div>

      <div id="search-results-info" class="results-count"></div>
      <div id="search-results" class="card-list-grid stagger"></div>
    </div>
  `;

  const input = document.getElementById('search-input');
  const btn = document.getElementById('search-btn');
  const resultsEl = document.getElementById('search-results');
  const infoEl = document.getElementById('search-results-info');

  async function doSearch() {
    const q = input.value.trim();
    if (!q || q.length < 2) {
      infoEl.textContent = 'Inserisci almeno 2 caratteri per cercare.';
      resultsEl.innerHTML = '';
      return;
    }

    infoEl.textContent = '⏳ Ricerca in corso...';
    resultsEl.innerHTML = `
      <div class="loading-container" style="grid-column:1/-1;">
        <div class="spinner"></div>
      </div>
    `;

    try {
      const results = await searchCards(q);

      if (!results || results.length === 0) {
        infoEl.textContent = `Nessun risultato per "${q}"`;
        resultsEl.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <div class="empty-state-icon">🔍</div>
            <p>Nessuna carta trovata. Prova un altro termine.</p>
          </div>
        `;
        return;
      }

      // Limit to 50 results for performance
      const limited = results.slice(0, 50);
      infoEl.textContent = `${results.length} risultati${results.length > 50 ? ' (mostrando i primi 50)' : ''} per "${q}"`;

      resultsEl.innerHTML = limited.map(c => {
        const thumb = c.image ? cardThumbUrl(c.image) : '';
        return `
          <div class="card-list-item" data-card-id="${c.id}" data-name="${c.name}">
            ${thumb ? `<img src="${thumb}" alt="${c.name}" loading="lazy">` : '<div style="aspect-ratio:367/512;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);"></div>'}
            <div class="card-list-item-name">${c.name}</div>
            <div class="card-list-item-info">#${c.localId || c.id}</div>
            <div class="card-list-item-price">—</div>
          </div>
        `;
      }).join('');

      // Click handlers
      resultsEl.querySelectorAll('.card-list-item').forEach(item => {
        item.addEventListener('click', () => {
          window.location.hash = `#/card/${item.dataset.cardId}`;
        });
      });

    } catch (err) {
      console.error('Search error:', err);
      infoEl.textContent = 'Errore durante la ricerca. Riprova.';
      resultsEl.innerHTML = '';
    }
  }

  btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });
}
