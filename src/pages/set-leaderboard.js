// Set Leaderboard — sets ranked by total card value
import { getLocalPrices, formatPrice, getModernSets } from '../api.js';

export async function renderSetLeaderboard(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">📊 Classifica Set</h1>
        <p class="page-subtitle">
          Set Pokémon TCG ordinati per <strong>valore totale</strong> — somma dei prezzi di tutte le carte
        </p>
      </div>

      <div class="leaderboard" style="margin-bottom:2rem;">
        <div class="leaderboard-header">
          <div class="leaderboard-title">💎 Set per Valore Totale</div>
          <div class="leaderboard-desc">
            Somma dei prezzi CardTrader ITA (Near Mint) di tutte le carte presenti nel set
          </div>
        </div>

        <div class="search-controls" style="padding:1rem 1.5rem 0;">
          <select class="search-select" id="set-lb-sort">
            <option value="total-desc">💰 Valore Totale ↓</option>
            <option value="total-asc">💰 Valore Totale ↑</option>
            <option value="avg-desc">📈 Media/Carta ↓</option>
            <option value="avg-asc">📈 Media/Carta ↑</option>
            <option value="cards-desc">🃏 Num. Carte ↓</option>
            <option value="cards-asc">🃏 Num. Carte ↑</option>
            <option value="name-asc">🔤 A → Z</option>
            <option value="name-desc">🔤 Z → A</option>
          </select>
        </div>

        <div id="set-lb-status" style="padding:0.75rem 1.5rem;color:var(--text-secondary);font-size:var(--font-size-sm);">
          ⏳ Calcolo valore set in corso...
        </div>

        <table class="leaderboard-table" id="set-lb-table" style="display:none;">
          <thead>
            <tr>
              <th>#</th>
              <th>Set</th>
              <th>Carte</th>
              <th>Valore Totale</th>
              <th>Media/Carta</th>
              <th>Carta Top</th>
            </tr>
          </thead>
          <tbody id="set-lb-body"></tbody>
        </table>
      </div>
    </div>
  `;

  const statusEl = document.getElementById('set-lb-status');
  const setData = [];

  try {
    const localData = await getLocalPrices();

    if (!localData || !localData.cards || Object.keys(localData.cards).length === 0) {
      statusEl.innerHTML = `⚠️ Nessun dato prezzi trovato. Esegui <code>npm run update-prices</code> prima.`;
      return;
    }

    // Group cards by set
    const setMap = new Map(); // setName → { cards: [], totalPrice, topCard }

    for (const [cardId, card] of Object.entries(localData.cards)) {
      const setName = card.setName;
      if (!setName) continue;

      if (!setMap.has(setName)) {
        setMap.set(setName, {
          name: setName,
          setId: cardId.split('-')[0] + (cardId.includes('.') ? '.' + cardId.split('.')[1].split('-')[0] : ''),
          cards: [],
          totalPrice: 0,
          topCard: null,
          topPrice: 0,
        });
      }

      const entry = setMap.get(setName);
      const price = card.priceITNM || 0;
      entry.cards.push({ ...card, id: cardId, price });
      entry.totalPrice += price;

      if (price > entry.topPrice) {
        entry.topPrice = price;
        entry.topCard = card.name;
      }
    }

    // Extract setId more accurately from card IDs
    for (const [, entry] of setMap) {
      // Find setId from first card's ID pattern (e.g., "sv08-231" → "sv08")
      const firstCard = entry.cards[0];
      if (firstCard) {
        const parts = firstCard.id.split('-');
        if (parts.length >= 2) {
          entry.setId = parts[0];
        }
      }
      // Calculate average
      entry.avgPrice = entry.cards.length > 0 ? entry.totalPrice / entry.cards.length : 0;
      entry.totalPrice = parseFloat(entry.totalPrice.toFixed(2));
      entry.avgPrice = parseFloat(entry.avgPrice.toFixed(2));

      setData.push(entry);
    }

    // Sort by total price desc
    setData.sort((a, b) => b.totalPrice - a.totalPrice);

    // Show update time
    if (localData.updatedAt) {
      const updatedDate = new Date(localData.updatedAt).toLocaleString('it-IT');
      document.querySelector('.leaderboard-desc').innerHTML += `<br><span style="color:var(--color-teal);font-size:0.9em;display:inline-block;margin-top:4px;">⏱ Ultimo Aggiornamento: ${updatedDate}</span>`;
    }

    // Render
    renderSetTable(setData);

    statusEl.style.display = 'none';
    document.getElementById('set-lb-table').style.display = '';

    // Bind sort
    document.getElementById('set-lb-sort').addEventListener('change', () => {
      sortAndRender(setData);
    });

  } catch (err) {
    console.error('Set leaderboard error:', err);
    statusEl.innerHTML = `⚠️ Errore nel caricamento. <a href="#/set-leaderboard" style="color:var(--color-teal-light);">Riprova</a>`;
  }
}

function sortAndRender(data) {
  const sort = document.getElementById('set-lb-sort')?.value || 'total-desc';
  const sorted = [...data];

  switch (sort) {
    case 'total-desc': sorted.sort((a, b) => b.totalPrice - a.totalPrice); break;
    case 'total-asc': sorted.sort((a, b) => a.totalPrice - b.totalPrice); break;
    case 'avg-desc': sorted.sort((a, b) => b.avgPrice - a.avgPrice); break;
    case 'avg-asc': sorted.sort((a, b) => a.avgPrice - b.avgPrice); break;
    case 'cards-desc': sorted.sort((a, b) => b.cards.length - a.cards.length); break;
    case 'cards-asc': sorted.sort((a, b) => a.cards.length - b.cards.length); break;
    case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name, 'it')); break;
    case 'name-desc': sorted.sort((a, b) => b.name.localeCompare(a.name, 'it')); break;
  }

  renderSetTable(sorted);
}

function renderSetTable(sets) {
  const tbody = document.getElementById('set-lb-body');
  if (!tbody) return;

  tbody.innerHTML = sets.map((s, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const seriesFolder = s.setId.startsWith('me') ? 'me' : s.setId.startsWith('swsh') ? 'swsh' : 'sv';
    const logoUrl = `https://assets.tcgdex.net/it/${seriesFolder}/${s.setId}/logo.webp`;

    return `
      <tr data-set-id="${s.setId}" class="clickable-row">
        <td>
          <span class="rank-badge ${rankClass}">${i + 1}</span>
        </td>
        <td>
          <div class="table-card-cell">
            <img src="${logoUrl}" alt="" class="table-thumb sealed-thumb" loading="lazy" 
                 onerror="this.style.display='none'">
            <div>
              <div class="card-name">${s.name}</div>
            </div>
          </div>
        </td>
        <td><span class="chip">${s.cards.length}</span></td>
        <td><span class="price-tag neutral" style="font-weight:700;">${formatPrice(s.totalPrice)}</span></td>
        <td><span class="price-tag neutral">${formatPrice(s.avgPrice)}</span></td>
        <td>
          <div style="font-size:var(--font-size-sm);">
            <span>${s.topCard || '—'}</span>
            <span style="color:var(--color-teal-light);margin-left:0.25rem;">${formatPrice(s.topPrice)}</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Click handlers → navigate to set detail
  tbody.querySelectorAll('.clickable-row').forEach(row => {
    row.addEventListener('click', () => {
      window.location.hash = `#/set/${row.dataset.setId}`;
    });
  });
}
