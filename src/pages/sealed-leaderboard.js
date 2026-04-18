// Sealed Leaderboard — Booster Box & ETB prices (hardcoded data with links)
// TCGdex doesn't provide sealed product pricing, so we use static data
import { getLocalPrices } from '../api.js';

const BOOSTER_BOXES = [
  {
    name: 'Scintille Folgoranti',
    setId: 'sv08',
    price: 125.00,
    image: 'https://assets.tcgdex.net/it/sv/sv08/logo.webp',
  },
  {
    name: 'Corona Astrale',
    setId: 'sv07',
    price: 110.00,
    image: 'https://assets.tcgdex.net/it/sv/sv07/logo.webp',
  },
  {
    name: 'Forze Temporali',
    setId: 'sv05',
    price: 105.00,
    image: 'https://assets.tcgdex.net/it/sv/sv05/logo.webp',
  },
  {
    name: 'Ossidiana Infuocata',
    setId: 'sv03',
    price: 105.00,
    image: 'https://assets.tcgdex.net/it/sv/sv03/logo.webp',
  },
  {
    name: 'Evoluzioni a Paldea',
    setId: 'sv02',
    price: 135.00,
    image: 'https://assets.tcgdex.net/it/sv/sv02/logo.webp',
  },
  {
    name: 'Scarlatto e Violetto',
    setId: 'sv01',
    price: 95.00,
    image: 'https://assets.tcgdex.net/it/sv/sv01/logo.webp',
  },
];

const BOOSTER_BUNDLES = [
  {
    name: 'Destino di Paldea',
    setId: 'sv04.5',
    price: 45.00,
    image: 'https://assets.tcgdex.net/it/sv/sv04.5/logo.webp',
  },
  {
    name: '151',
    setId: 'sv03.5',
    price: 65.00,
    image: 'https://assets.tcgdex.net/it/sv/sv03.5/logo.webp',
  },
];

const ETB_BOXES = [
  {
    name: 'Scintille Folgoranti',
    setId: 'sv08',
    price: 45.00,
    image: 'https://assets.tcgdex.net/it/sv/sv08/logo.webp',
  },
  {
    name: 'Corona Astrale',
    setId: 'sv07',
    price: 40.00,
    image: 'https://assets.tcgdex.net/it/sv/sv07/logo.webp',
  },
  {
    name: 'Destino di Paldea',
    setId: 'sv04.5',
    price: 45.00,
    image: 'https://assets.tcgdex.net/it/sv/sv04.5/logo.webp',
  },
  {
    name: 'Forze Temporali',
    setId: 'sv05',
    price: 40.00,
    image: 'https://assets.tcgdex.net/it/sv/sv05/logo.webp',
  },
  {
    name: 'Ossidiana Infuocata',
    setId: 'sv03',
    price: 40.00,
    image: 'https://assets.tcgdex.net/it/sv/sv03/logo.webp',
  },
  {
    name: 'Evoluzioni a Paldea',
    setId: 'sv02',
    price: 40.00,
    image: 'https://assets.tcgdex.net/it/sv/sv02/logo.webp',
  },
  {
    name: '151',
    setId: 'sv03.5',
    price: 65.00,
    image: 'https://assets.tcgdex.net/it/sv/sv03.5/logo.webp',
  },
  {
    name: 'Scarlatto e Violetto',
    setId: 'sv01',
    price: 40.00,
    image: 'https://assets.tcgdex.net/it/sv/sv01/logo.webp',
  },
];

export async function renderSealedLeaderboard(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">📦 Classifica Sealed</h1>
        <p class="page-subtitle">
          Prezzi indicativi dei prodotti <strong>sigillati</strong> Pokémon TCG — dati orientativi, vedi CardTrader per i prezzi aggiornati
        </p>
      </div>

      <div class="search-controls" style="margin-bottom:1.5rem;">
        <select class="search-select" id="sealed-lb-sort">
          <option value="price-desc">💰 Prezzo ↓</option>
          <option value="price-asc">💰 Prezzo ↑</option>
          <option value="name-asc">🔤 A → Z</option>
          <option value="name-desc">🔤 Z → A</option>
        </select>
      </div>

      <div class="sealed-grid">
        <div class="sealed-column">
          <div class="leaderboard">
            <div class="leaderboard-header">
              <div class="leaderboard-title">📦 Booster Box</div>
              <div class="leaderboard-desc">Box da 36 buste — prezzi indicativi in EUR</div>
            </div>
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Set</th>
                  <th>Prezzo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="sealed-booster-body">
              </tbody>
            </table>
          </div>
        </div>

        <div class="sealed-column">
          <div class="leaderboard">
            <div class="leaderboard-header">
              <div class="leaderboard-title">🛍️ Booster Bundle</div>
              <div class="leaderboard-desc">Box da 6 buste — prezzi indicativi in EUR</div>
            </div>
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Set</th>
                  <th>Prezzo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="sealed-bundle-body">
              </tbody>
            </table>
          </div>
        </div>

        <div class="sealed-column">
          <div class="leaderboard">
            <div class="leaderboard-header">
              <div class="leaderboard-title">🎁 Elite Trainer Box</div>
              <div class="leaderboard-desc">ETB con buste, accessori e promo — prezzi indicativi in EUR</div>
            </div>
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Set</th>
                  <th>Prezzo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="sealed-etb-body">
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="sealed-disclaimer">
        <p>⚠️ I prezzi sono indicativi e potrebbero non essere aggiornati. Per i prezzi reali, controlla <a href="https://www.cardtrader.com/it/Pokemon" target="_blank" rel="noopener">CardTrader</a>.</p>
      </div>
    </div>
  `;

  try {
    const localData = await getLocalPrices();
    if (localData && localData.sealed) {
      
      // Inject dynamically found sets that are not in the hardcoded list
      const existingBoxIds = new Set(BOOSTER_BOXES.map(b => b.setId));
      const existingBundleIds = new Set(BOOSTER_BUNDLES.map(b => b.setId));
      const existingEtbIds = new Set(ETB_BOXES.map(b => b.setId));
      
      Object.keys(localData.sealed).forEach(setId => {
         const sl = localData.sealed[setId];
         const seriesFolder = setId.startsWith('me') ? 'me' : setId.startsWith('swsh') ? 'swsh' : 'sv';
         let setName = sl.name || ('Set ' + setId);

         if (!existingBoxIds.has(setId)) {
            BOOSTER_BOXES.push({
              name: setName, setId, price: 0,
              image: `https://assets.tcgdex.net/it/${seriesFolder}/${setId}/logo.webp`, 
            });
         }
         if (!existingBundleIds.has(setId)) {
            BOOSTER_BUNDLES.push({
              name: setName, setId, price: 0,
              image: `https://assets.tcgdex.net/it/${seriesFolder}/${setId}/logo.webp`, 
            });
         }
         if (!existingEtbIds.has(setId)) {
            ETB_BOXES.push({
              name: setName, setId, price: 0,
              image: `https://assets.tcgdex.net/it/${seriesFolder}/${setId}/logo.webp`, 
            });
         }
      });

      BOOSTER_BOXES.forEach(box => {
         const sl = localData.sealed[box.setId];
         if (sl) {
            if (sl.bbPrice) box.price = sl.bbPrice;
            if (sl.bbBlueprintId) box.blueprintId = sl.bbBlueprintId;
            if (sl.bbSlug) box.bbSlug = sl.bbSlug;
         }
      });
      BOOSTER_BUNDLES.forEach(bundle => {
         const sl = localData.sealed[bundle.setId];
         if (sl) {
            if (sl.bundlePrice) bundle.price = sl.bundlePrice;
            if (sl.bundleBlueprintId) bundle.bundleBlueprintId = sl.bundleBlueprintId;
            if (sl.bundleSlug) bundle.bundleSlug = sl.bundleSlug;
         }
      });
      ETB_BOXES.forEach(box => {
         const sl = localData.sealed[box.setId];
         if (sl) {
            if (sl.etbPrice) box.price = sl.etbPrice;
            if (sl.etbBlueprintId) box.etbBlueprintId = sl.etbBlueprintId;
            if (sl.etbSlug) box.etbSlug = sl.etbSlug;
         }
      });
      const subtitle = container.querySelector('.page-subtitle');
      if (subtitle && localData.updatedAt) {
         subtitle.innerHTML += `<br><small style="color:var(--text-secondary)">Ultimo aggiornamento CardTrader: ${new Date(localData.updatedAt).toLocaleString('it-IT')}</small>`;
      }
    }
  } catch(e) {
    console.error("Errore caricamento prezzi sealed", e);
  }

  // Initial render
  updateSealedTables();

  // Bind sort
  document.getElementById('sealed-lb-sort').addEventListener('change', updateSealedTables);

  // Bind set clicks (delegated)
  container.addEventListener('click', (e) => {
    const row = e.target.closest('.clickable-row[data-set-id]');
    if (!row) return;
    if (e.target.closest('.sealed-link')) return;
    window.location.hash = `#/set/${row.dataset.setId}`;
  });
}

function updateSealedTables() {
  const sort = document.getElementById('sealed-lb-sort')?.value || 'price-desc';

  const sortFn = (a, b) => {
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'name-asc') return a.name.localeCompare(b.name, 'it');
    if (sort === 'name-desc') return b.name.localeCompare(a.name, 'it');
    return 0;
  };

  const sortedBooster = [...BOOSTER_BOXES].sort(sortFn);
  const sortedBundle = [...BOOSTER_BUNDLES].sort(sortFn);
  const sortedEtb = [...ETB_BOXES].sort(sortFn);

  const boosterBody = document.getElementById('sealed-booster-body');
  if (boosterBody) {
    boosterBody.innerHTML = sortedBooster.map((item, i) => {
      return renderSealedRow(item, i, 'booster');
    }).join('');
  }

  const bundleBody = document.getElementById('sealed-bundle-body');
  if (bundleBody) {
    bundleBody.innerHTML = sortedBundle.map((item, i) => {
      return renderSealedRow(item, i, 'bundle');
    }).join('');
  }

  const etbBody = document.getElementById('sealed-etb-body');
  if (etbBody) {
    etbBody.innerHTML = sortedEtb.map((item, i) => {
      return renderSealedRow(item, i, 'etb');
    }).join('');
  }
}

function renderSealedRow(item, index, type) {
  const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
  
  // Determina lo slug o l'ID corretto
  const slug = type === 'booster' ? item.bbSlug : 
               type === 'bundle' ? item.bundleSlug : item.etbSlug;
  const blueprintId = type === 'booster' ? item.bbBlueprintId : 
                      type === 'bundle' ? item.bundleBlueprintId : item.etbBlueprintId;
  const label = type === 'booster' ? 'Booster Box' : 
                type === 'bundle' ? 'Booster Bundle' : 'Elite Trainer Box';

  const link = slug ? `https://www.cardtrader.com/it/cards/${slug}` :
               blueprintId ? `https://www.cardtrader.com/it/cards/${blueprintId}` : 
               `https://www.cardtrader.com/it/search?query=${encodeURIComponent(`Pokémon ${item.name} ${label} ITA`)}`;

  return `
    <tr data-set-id="${item.setId}" class="clickable-row">
      <td>
        <span class="rank-badge ${rankClass}">${index + 1}</span>
      </td>
      <td>
        <div class="table-card-cell">
          <img src="${item.image}" alt="" class="table-thumb sealed-thumb" loading="lazy">
          <div>
            <div class="card-name">${item.name}</div>
          </div>
        </div>
      </td>
      <td><span class="price-tag neutral">${formatPrice(item.price)}</span></td>
      <td>
        <a href="${link}" 
           target="_blank" rel="noopener" class="sealed-link" title="Vedi su CardTrader">
          🔗
        </a>
      </td>
    </tr>
  `;
}

function formatPrice(val) {
  if (val == null || val === 0) return 'N/D';
  return `€${val.toFixed(2)}`;
}
