import { getLocalPrices, formatPrice } from '../api.js';

export async function renderSealedDetail(container, type, setId) {
  const localData = await getLocalPrices();
  if (!localData || !localData.sealed || !localData.sealed[setId]) {
    container.innerHTML = `<div class="empty-state"><h3>Prodotto non trovato</h3></div>`;
    return;
  }

  const sealedSet = localData.sealed[setId];
  
  let price = null;
  let image = null;
  let slug = null;
  let blueprintId = null;
  let history = [];
  let label = '';
  
  if (type === 'booster') {
    price = sealedSet.bbPrice;
    image = sealedSet.bbImage;
    slug = sealedSet.bbSlug;
    blueprintId = sealedSet.bbBlueprintId;
    history = sealedSet.bbHistory || [];
    label = 'Booster Box';
  } else if (type === 'bundle') {
    price = sealedSet.bundlePrice;
    image = sealedSet.bundleImage;
    slug = sealedSet.bundleSlug;
    blueprintId = sealedSet.bundleBlueprintId;
    history = sealedSet.bundleHistory || [];
    label = 'Booster Bundle';
  } else if (type === 'etb') {
    price = sealedSet.etbPrice;
    image = sealedSet.etbImage;
    slug = sealedSet.etbSlug;
    blueprintId = sealedSet.etbBlueprintId;
    history = sealedSet.etbHistory || [];
    label = 'Elite Trainer Box';
  }

  // Fallback image if CardTrader didn't have one
  if (!image) {
    const seriesFolder = setId.startsWith('me') ? 'me' : setId.startsWith('swsh') ? 'swsh' : 'sv';
    image = `https://assets.tcgdex.net/it/${seriesFolder}/${setId}/logo.webp`;
  }

  container.innerHTML = `
    <div class="fade-in">
      <div class="breadcrumb">
        <a href="#/sealed-leaderboard">Sealed</a>
        <span class="breadcrumb-separator">›</span>
        <span>${sealedSet.name || setId} - ${label}</span>
      </div>

      <div class="card-detail">
        <div class="card-image-wrapper">
          <img src="${image}" alt="${label} ${sealedSet.name}" style="object-fit:contain; max-height:400px;">
        </div>

        <div class="card-info">
          <div>
            <h1 style="font-size:var(--font-size-2xl);font-weight:900;margin-bottom:0.25rem;">
              ${label}
            </h1>
            <p style="color:var(--text-secondary);font-size:var(--font-size-sm);">
              ${sealedSet.name || setId}
            </p>
          </div>

          <div class="card-info-section">
            <h3>💰 Prezzo CardTrader</h3>
            <div class="card-price-big">${formatPrice(price)}</div>
            <p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-top:0.25rem;">
              Minimo Globale ITA · Sigillato
            </p>
          </div>

          ${history.length > 0 ? `
            <div class="card-info-section">
              <h3>📈 Storico Prezzi</h3>
              <div style="background:var(--bg-secondary); border-radius:var(--radius-md); overflow:hidden; margin-top:0.5rem;">
                <table style="width:100%; text-align:left; border-collapse:collapse; font-size:var(--font-size-sm);">
                  <thead>
                    <tr style="background:rgba(255,255,255,0.05); border-bottom:1px solid var(--border-color);">
                      <th style="padding:0.5rem 0.75rem; font-weight:600;">Data</th>
                      <th style="padding:0.5rem 0.75rem; font-weight:600; text-align:right;">Prezzo (ITA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${[...history].reverse().map((h, i) => `
                      <tr style="border-bottom:1px solid var(--border-color);">
                        <td style="padding:0.5rem 0.75rem; color:var(--text-secondary);">${new Date(h.date).toLocaleDateString('it-IT')}</td>
                        <td style="padding:0.5rem 0.75rem; text-align:right; font-weight:600; color:${i === 0 ? '#48C78E' : 'var(--text-primary)'};">${formatPrice(h.price)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <div style="text-align:center;margin-top:0.5rem;">
            <a href="${slug ? `https://www.cardtrader.com/it/cards/${slug}` : blueprintId ? `https://www.cardtrader.com/it/cards/${blueprintId}` : `https://www.cardtrader.com/it/search?query=${encodeURIComponent(`Pokémon ${sealedSet.name} ${label} ITA`)}`}"
               target="_blank" rel="noopener"
               class="btn btn-primary">
              🛒 Vedi su CardTrader
            </a>
          </div>

        </div>
      </div>
    </div>
  `;
}
