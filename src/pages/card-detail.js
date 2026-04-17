import { getCard, cardImageUrl, formatPrice, setLogoUrl, getLocalPrices } from '../api.js';

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
  const localData = await getLocalPrices();
  if (localData && localData.cards && localData.cards[cardId]) {
    const localCard = localData.cards[cardId];
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

          ${pricing ? `
            <div class="card-info-section">
              <h3>💰 Prezzo CardTrader</h3>
              <div class="card-price-big">${formatPrice(pricing.avg)}</div>
              <p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-top:0.25rem;">
                Prezzo medio · Aggiornato ${pricing.updated ? new Date(pricing.updated).toLocaleDateString('it-IT') : 'N/D'}
              </p>
            </div>

            <div class="card-info-section">
              <h3>📊 Dettaglio Prezzi</h3>
              <div class="card-price-grid">
                <div class="price-item">
                  <div class="price-item-label">${priceSourceLabel}</div>
                  <div class="price-item-value" style="color:#48C78E;">${formatPrice(cmLow)}</div>
                </div>
                <div class="price-item">
                  <div class="price-item-label">Trend</div>
                  <div class="price-item-value" style="color:var(--color-teal-light);">${formatPrice(pricing.trend)}</div>
                </div>
                <div class="price-item">
                  <div class="price-item-label">Media 1gg</div>
                  <div class="price-item-value">${formatPrice(pricing.avg1)}</div>
                </div>
                <div class="price-item">
                  <div class="price-item-label">Media 7gg</div>
                  <div class="price-item-value">${formatPrice(pricing.avg7)}</div>
                </div>
                <div class="price-item">
                  <div class="price-item-label">Media 30gg</div>
                  <div class="price-item-value">${formatPrice(pricing.avg30)}</div>
                </div>
              </div>
            </div>
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
