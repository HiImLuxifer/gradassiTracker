// Card Leaderboard — top cards ranked by CardTrader price
import { getModernSets, getSet, getCard, formatPrice, cardThumbUrl, getLocalPrices } from '../api.js';

// How many recent sets to scan for cards
const SETS_TO_SCAN = 6;
// How many cards per set to fetch (last N cards contain the secret rares and highly valuable cards)
const CARDS_PER_SET = 150;
// Batch size for API calls
const BATCH_SIZE = 15;

export async function renderCardLeaderboard(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">🏆 Classifica Carte</h1>
        <p class="page-subtitle">
          Le carte Pokémon TCG <strong>italiane</strong> più costose — ordinate per prezzo CardTrader/TCGdex
        </p>
      </div>

      <div class="leaderboard" style="margin-bottom:2rem;">
        <div class="leaderboard-header">
          <div class="leaderboard-title">💎 Top Carte per Valore</div>
          <div class="leaderboard-desc">
            Carte con il prezzo medio più alto dai set recenti — clicca per i dettagli
          </div>
        </div>

        <div class="search-controls" style="padding:1rem 1.5rem 0;">
          <input type="text" class="search-input" id="card-lb-search" placeholder="Cerca carta per nome..." style="max-width:300px;">
          <select class="search-select" id="card-lb-sort">
            <option value="price-desc">💰 Prezzo ↓</option>
            <option value="price-asc">💰 Prezzo ↑</option>
            <option value="name-asc">🔤 A → Z</option>
            <option value="name-desc">🔤 Z → A</option>
          </select>
          <select class="search-select" id="card-lb-rarity">
            <option value="">✨ Tutte le rarità</option>
          </select>
        </div>

        <div id="card-lb-status" style="padding:0.75rem 1.5rem;color:var(--text-secondary);font-size:var(--font-size-sm);">
          ⏳ Caricamento carte dai set recenti...
        </div>

        <table class="leaderboard-table" id="card-lb-table" style="display:none;">
          <thead>
            <tr>
              <th>#</th>
              <th>Carta</th>
              <th>Set</th>
              <th>Rarità</th>
              <th>Prezzo Medio</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody id="card-lb-body"></tbody>
        </table>
      </div>
    </div>
  `;

  // Start loading data
  const allCardData = [];
  const statusEl = document.getElementById('card-lb-status');

    try {
      // PROVA A LEGGERE IL JSON LOCALE
      const localData = await getLocalPrices();
      if (localData && localData.cards && Object.keys(localData.cards).length > 0) {
        statusEl.textContent = `⏳ Caricamento classifica locale super veloce...`;
        
        // Costruiamo allCardData dal json super compatto
        for (const id in localData.cards) {
          const c = localData.cards[id];
          if (c.priceITNM && c.priceITNM > 0) {
            allCardData.push({
              id: id,
              name: c.name,
              image: c.image,
              rarity: c.rarity,
              setName: c.setName,
              price: c.priceITNM,
              trend: c.priceITNM // Manca il trend dettagliato, potremmo aggiungerlo allo script futuro
            });
          }
        }
        
      } else {
        // FALLBACK: SE IL FILE NON ESISTE, USO IL VECCHIO METODO (Molto lento)
        statusEl.textContent = `⚠️ Nessun file generato! Analizzo set in TCGdex in tempo reale...`;
        const sets = await getModernSets();
        const recentSets = sets.slice(0, SETS_TO_SCAN);

        for (let si = 0; si < recentSets.length; si++) {
          const setInfo = recentSets[si];
          statusEl.textContent = `⏳ Caricamento ${setInfo.name}... (${si + 1}/${recentSets.length})`;

          const setData = await getSet(setInfo.id);
          const allSetCards = setData.cards || [];
          const startIdx = Math.max(0, allSetCards.length - CARDS_PER_SET);
          const cards = allSetCards.slice(startIdx);

          for (let i = 0; i < cards.length; i += BATCH_SIZE) {
            const batch = cards.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(
              batch.map(c => getCard(c.id))
            );

            results.forEach(r => {
              if (r.status === 'fulfilled') {
                const card = r.value;
                const price = card.pricing?.cardmarket?.avg;
                if (price && price > 0) {
                  allCardData.push({
                    id: card.id,
                    name: card.name,
                    image: card.image,
                    rarity: card.rarity || '—',
                    setName: setData.name,
                    setId: setData.id,
                    price: price,
                    trend: card.pricing?.cardmarket?.trend || 0,
                    low: card.pricing?.cardmarket?.low || 0,
                  });
                }
              }
            });
          }
        }
      }

      // 3. Sort by price descending
      allCardData.sort((a, b) => b.price - a.price);

      // 4. Populate rarity filter
      const rarities = [...new Set(allCardData.map(c => c.rarity).filter(r => r && r !== '—'))].sort();
      const raritySelect = document.getElementById('card-lb-rarity');
      rarities.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        raritySelect.appendChild(opt);
      });

      // Se c'è updatedAt, mostriamolo infondo al DB
      if (localData && localData.updatedAt) {
          const updatedDate = new Date(localData.updatedAt).toLocaleString('it-IT');
          document.querySelector('.leaderboard-desc').innerHTML += `<br><span style="color:var(--color-teal);font-size:0.9em;display:inline-block;margin-top:4px;">⏱ Ultimo Aggiornamento Db: ${updatedDate}</span>`;
      }

      // 5. Render table
      renderTable(allCardData);

      statusEl.style.display = 'none';
      document.getElementById('card-lb-table').style.display = '';

      // 6. Bind filters & sorts
      document.getElementById('card-lb-search').addEventListener('input', () => filterCards(allCardData));
      raritySelect.addEventListener('change', () => filterCards(allCardData));
      document.getElementById('card-lb-sort').addEventListener('change', () => filterCards(allCardData));

    } catch (err) {
    console.error('Card leaderboard error:', err);
    statusEl.innerHTML = `⚠️ Errore nel caricamento. <a href="#/card-leaderboard" style="color:var(--color-teal-light);">Riprova</a>`;
  }
}

function filterCards(allCards) {
  const q = (document.getElementById('card-lb-search')?.value || '').toLowerCase();
  const rarity = document.getElementById('card-lb-rarity')?.value || '';
  const sort = document.getElementById('card-lb-sort')?.value || 'price-desc';

  let filtered = allCards.filter(c => {
    const nameMatch = c.name.toLowerCase().includes(q);
    const rarityMatch = !rarity || c.rarity === rarity;
    return nameMatch && rarityMatch;
  });

  if (sort === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'it'));
  } else if (sort === 'name-desc') {
    filtered.sort((a, b) => b.name.localeCompare(a.name, 'it'));
  }

  renderTable(filtered);
}

function renderTable(cards) {
  const tbody = document.getElementById('card-lb-body');
  if (!tbody) return;

  tbody.innerHTML = cards.map((c, i) => {
    const thumb = c.image ? cardThumbUrl(c.image) : '';
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const trendDiff = c.trend - c.price;
    const trendClass = trendDiff > 0 ? 'positive' : trendDiff < 0 ? 'negative' : 'neutral';
    const trendSign = trendDiff > 0 ? '↑' : trendDiff < 0 ? '↓' : '—';

    return `
      <tr data-card-id="${c.id}" class="clickable-row">
        <td>
          <span class="rank-badge ${rankClass}">${i + 1}</span>
        </td>
        <td>
          <div class="table-card-cell">
            ${thumb ? `<img src="${thumb}" alt="" class="table-thumb" loading="lazy">` : ''}
            <div>
              <div class="card-name">${c.name}</div>
            </div>
          </div>
        </td>
        <td><span class="chip">${c.setName}</span></td>
        <td><span class="rarity-label">${c.rarity}</span></td>
        <td><span class="price-tag neutral">${formatPrice(c.price)}</span></td>
        <td><span class="price-tag ${trendClass}">${trendSign} ${formatPrice(c.trend)}</span></td>
      </tr>
    `;
  }).join('');

  // Click handlers
  tbody.querySelectorAll('.clickable-row').forEach(row => {
    row.addEventListener('click', () => {
      window.location.hash = `#/card/${row.dataset.cardId}`;
    });
  });
}
