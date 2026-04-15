// Sets page — Grid of all sets
import { getModernSets, setLogoUrl } from '../api.js';

export async function renderSets(container) {
  const sets = await getModernSets();

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">Tutti i Set</h1>
        <p class="page-subtitle">${sets.length} espansioni moderne · Clicca per esplorare</p>
      </div>
      <div class="sets-grid stagger" id="sets-grid">
        ${sets.map(s => `
          <div class="set-card" data-set="${s.id}">
            ${s.logo
              ? `<img class="set-card-logo" src="${setLogoUrl(s.logo)}" alt="${s.name}" loading="lazy">`
              : `<div class="set-card-logo" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;opacity:0.6;">${s.name}</div>`
            }
            <div class="set-card-name">${s.name}</div>
            <div class="set-card-count">${s.cardCount?.official || s.cardCount?.total || '?'} carte</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.set-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.hash = `#/set/${card.dataset.set}`;
    });
  });
}
