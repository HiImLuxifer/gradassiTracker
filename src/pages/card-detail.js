import { getCard, cardImageUrl, formatPrice, setLogoUrl, getLocalPrices } from '../api.js';

/**
 * Calculate weekly price variation from history array
 */
function calcWeeklyVariation(history) {
  if (!history || history.length < 2) return null;
  const latest = history[history.length - 1];
  // Find price ~7 days ago
  const now = new Date(latest.date);
  let bestMatch = null;
  let bestDiff = Infinity;
  for (let i = history.length - 2; i >= 0; i--) {
    const d = new Date(history[i].date);
    const daysDiff = Math.abs((now - d) / (1000 * 60 * 60 * 24) - 7);
    if (daysDiff < bestDiff) {
      bestDiff = daysDiff;
      bestMatch = history[i];
    }
  }
  if (!bestMatch || bestMatch.price === 0) return null;
  const pct = ((latest.price - bestMatch.price) / bestMatch.price) * 100;
  return parseFloat(pct.toFixed(1));
}

/**
 * Build price bands HTML mini bar chart
 */
function renderPriceBands(priceBands, minPrice) {
  if (!priceBands) return '';
  const total = priceBands.low.count + priceBands.mid.count + priceBands.high.count;
  if (total === 0) return '';

  const pctLow = Math.round((priceBands.low.count / total) * 100);
  const pctMid = Math.round((priceBands.mid.count / total) * 100);
  const pctHigh = Math.round((priceBands.high.count / total) * 100);

  return `
    <div class="price-bands">
      <div class="price-band-row">
        <span class="price-band-label">€${minPrice.toFixed(2)} – €${priceBands.low.max.toFixed(2)}</span>
        <div class="price-band-bar-track">
          <div class="price-band-bar price-band-low" style="width:${Math.max(pctLow, 4)}%"></div>
        </div>
        <span class="price-band-count">${priceBands.low.count}</span>
      </div>
      <div class="price-band-row">
        <span class="price-band-label">€${priceBands.low.max.toFixed(2)} – €${priceBands.mid.max.toFixed(2)}</span>
        <div class="price-band-bar-track">
          <div class="price-band-bar price-band-mid" style="width:${Math.max(pctMid, 4)}%"></div>
        </div>
        <span class="price-band-count">${priceBands.mid.count}</span>
      </div>
      <div class="price-band-row">
        <span class="price-band-label">€${priceBands.mid.max.toFixed(2)} – €${priceBands.high.max.toFixed(2)}</span>
        <div class="price-band-bar-track">
          <div class="price-band-bar price-band-high" style="width:${Math.max(pctHigh, 4)}%"></div>
        </div>
        <span class="price-band-count">${priceBands.high.count}</span>
      </div>
    </div>
  `;
}

export async function renderCardDetail(container, cardId) {
  const card = await getCard(cardId);
  const imgUrl = card.image ? cardImageUrl(card.image) : '';
  const pricing = card.pricing?.cardmarket || null;
  const set = card.set || {};

  let cmLow = pricing?.low;
  let priceSourceLabel = 'Minimo Globale';

  // Applica prezzo locale accurato se esiste
  let bpId = null;
  let bpSlug = null;
  let localCard = null;
  const localData = await getLocalPrices();
  if (localData && localData.cards && localData.cards[cardId]) {
    localCard = localData.cards[cardId];
    if (localCard.priceITNM) {
      cmLow = localCard.priceITNM;
      priceSourceLabel = 'Prezzo CardTrader ITA';
    }
    if (localCard.blueprintId) {
      bpId = localCard.blueprintId;
    }
    if (localCard.slug) {
      bpSlug = localCard.slug;
    }
  }

  // Market intelligence data
  const hasMarketData = localCard && (localCard.priceMax != null || localCard.availableQty > 0);
  const weeklyVar = localCard?.history ? calcWeeklyVariation(localCard.history) : null;
  const priceBandsHtml = localCard?.priceBands ? renderPriceBands(localCard.priceBands, localCard.priceITNM) : '';

  // Variation badge
  let variationBadge = '';
  if (weeklyVar !== null) {
    const isPositive = weeklyVar > 0;
    const isNeutral = weeklyVar === 0;
    const badgeClass = isNeutral ? 'neutral' : (isPositive ? 'negative' : 'positive');
    const arrow = isNeutral ? '→' : (isPositive ? '▲' : '▼');
    variationBadge = `<span class="variation-badge ${badgeClass}">${arrow} ${Math.abs(weeklyVar)}%</span>`;
  }

  // Price range bar position (where current price falls in the min-max range)
  let rangeBarHtml = '';
  if (localCard?.priceITNM && localCard?.priceMax && localCard.priceMax > localCard.priceITNM) {
    rangeBarHtml = `
      <div class="price-range-visual">
        <div class="price-range-labels">
          <span>Min ${formatPrice(localCard.priceITNM)}</span>
          <span>Max ${formatPrice(localCard.priceMax)}</span>
        </div>
        <div class="price-range-track">
          <div class="price-range-fill"></div>
          <div class="price-range-marker" style="left:0%">
            <div class="price-range-marker-dot"></div>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="fade-in">
      <div class="breadcrumb">
        <a href="#/sets">Set</a>
        <span class="breadcrumb-separator">›</span>
        <a href="#/set/${set.id}">${set.name || 'Set'}</a>
        <span class="breadcrumb-separator">›</span>
        <span>${card.name} #${card.localId}</span>
      </div>

      <div class="card-detail">
        <div class="card-image-wrapper">
          ${imgUrl ? `<img src="${imgUrl}" alt="${card.name}">` : '<div style="aspect-ratio:367/512;background:rgba(255,255,255,0.05);border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:center;font-size:2rem;opacity:0.3;">🃏</div>'}
        </div>

        <div class="card-info">
          <div>
            <h1 style="font-size:var(--font-size-2xl);font-weight:900;margin-bottom:0.25rem;">
              ${card.name}
            </h1>
            <p style="color:var(--text-secondary);font-size:var(--font-size-sm);">
              ${set.name || ''} · #${card.localId}${card.rarity ? ` · ${card.rarity}` : ''}
            </p>
          </div>

          ${pricing || localCard ? `
            <!-- Main Price + Variation -->
            <div class="card-info-section">
              <h3>💰 Prezzo CardTrader</h3>
              <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                <div class="card-price-big">${formatPrice(cmLow)}</div>
                ${variationBadge}
              </div>
              <p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-top:0.25rem;">
                ${priceSourceLabel}${weeklyVar !== null ? ' · Var. settimanale' : ''}
              </p>
            </div>

            <!-- Market Intelligence Grid -->
            <div class="card-info-section">
              <h3>📊 Analisi di Mercato</h3>
              <div class="market-stats-grid">
                <div class="market-stat-card">
                  <div class="market-stat-icon">📉</div>
                  <div class="market-stat-data">
                    <div class="market-stat-value" style="color:#48C78E;">${formatPrice(localCard?.priceITNM || cmLow)}</div>
                    <div class="market-stat-label">Prezzo Min</div>
                  </div>
                </div>
                <div class="market-stat-card">
                  <div class="market-stat-icon">📈</div>
                  <div class="market-stat-data">
                    <div class="market-stat-value" style="color:#FF6B6B;">${localCard?.priceMax ? formatPrice(localCard.priceMax) : 'N/D'}</div>
                    <div class="market-stat-label">Prezzo Max</div>
                  </div>
                </div>
                <div class="market-stat-card">
                  <div class="market-stat-icon">📦</div>
                  <div class="market-stat-data">
                    <div class="market-stat-value" style="color:var(--color-teal-light);">${localCard?.availableQty || 0}</div>
                    <div class="market-stat-label">Copie in vendita</div>
                  </div>
                </div>
                <div class="market-stat-card">
                  <div class="market-stat-icon">🏪</div>
                  <div class="market-stat-data">
                    <div class="market-stat-value" style="color:var(--color-cream-dark);">${localCard?.offerCount || 0}</div>
                    <div class="market-stat-label">Venditori</div>
                  </div>
                </div>
              </div>

              ${rangeBarHtml}
            </div>

            ${priceBandsHtml ? `
              <div class="card-info-section">
                <h3>🎯 Distribuzione Offerte</h3>
                ${priceBandsHtml}
              </div>
            ` : ''}

            ${pricing ? `
              <div class="card-info-section">
                <h3>🌍 Riferimento Cardmarket</h3>
                <div class="card-price-grid">
                  <div class="price-item">
                    <div class="price-item-label">Trend</div>
                    <div class="price-item-value" style="color:var(--color-teal-light);">${formatPrice(pricing.trend)}</div>
                  </div>
                  <div class="price-item">
                    <div class="price-item-label">Minimo</div>
                    <div class="price-item-value">${formatPrice(pricing.low)}</div>
                  </div>
                </div>
              </div>
            ` : ''}
          ` : `
            <div class="card-info-section">
              <h3>💰 Prezzo</h3>
              <p style="color:var(--text-secondary);">Dati di prezzo non disponibili per questa carta.</p>
            </div>
          `}

          <div class="card-info-section">
            <h3>📋 Dettagli Carta</h3>
            <table style="width:100%;font-size:var(--font-size-sm);">
              ${card.category ? `<tr><td style="color:var(--text-secondary);padding:0.3rem 0;">Categoria</td><td style="text-align:right;font-weight:600;">${card.category}</td></tr>` : ''}
              ${card.hp ? `<tr><td style="color:var(--text-secondary);padding:0.3rem 0;">HP</td><td style="text-align:right;font-weight:600;">${card.hp}</td></tr>` : ''}
              ${card.types?.length ? `<tr><td style="color:var(--text-secondary);padding:0.3rem 0;">Tipo</td><td style="text-align:right;font-weight:600;">${card.types.join(', ')}</td></tr>` : ''}
              ${card.stage ? `<tr><td style="color:var(--text-secondary);padding:0.3rem 0;">Stadio</td><td style="text-align:right;font-weight:600;">${card.stage}</td></tr>` : ''}
              ${card.evolveFrom ? `<tr><td style="color:var(--text-secondary);padding:0.3rem 0;">Si evolve da</td><td style="text-align:right;font-weight:600;">${card.evolveFrom}</td></tr>` : ''}
              ${card.retreat != null ? `<tr><td style="color:var(--text-secondary);padding:0.3rem 0;">Ritirata</td><td style="text-align:right;font-weight:600;">${card.retreat}</td></tr>` : ''}
              ${card.illustrator ? `<tr><td style="color:var(--text-secondary);padding:0.3rem 0;">Illustratore</td><td style="text-align:right;font-weight:600;">${card.illustrator}</td></tr>` : ''}
              ${card.regulationMark ? `<tr><td style="color:var(--text-secondary);padding:0.3rem 0;">Regolamento</td><td style="text-align:right;font-weight:600;">${card.regulationMark}</td></tr>` : ''}
            </table>
          </div>

          ${localCard?.history?.length > 0 ? `
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
                    ${[...localCard.history].reverse().map((h, i) => `
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

          ${card.attacks?.length ? `
            <div class="card-info-section">
              <h3>⚔️ Attacchi</h3>
              ${card.attacks.map(a => `
                <div style="margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border-color);">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                    <strong>${a.name}</strong>
                    ${a.damage ? `<span class="chip">${a.damage}</span>` : ''}
                  </div>
                  ${a.cost?.length ? `<div style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-bottom:0.25rem;">Costo: ${a.cost.join(', ')}</div>` : ''}
                  ${a.effect ? `<div style="font-size:var(--font-size-sm);color:var(--text-secondary);">${a.effect}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${pricing || localData?.cards[cardId] ? `
            <div style="text-align:center;margin-top:0.5rem;">
              <a href="${
                  bpSlug ? `https://www.cardtrader.com/it/cards/${bpSlug}` :
                  bpId ? `https://www.cardtrader.com/it/cards/${bpId}` :
                  `https://www.cardtrader.com/it/search?query=${encodeURIComponent(`${card.name} ${card.localId} ${set.name}`)}`
                }"
                 target="_blank" rel="noopener"
                 class="btn btn-primary">
                🛒 Vedi su CardTrader
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}
