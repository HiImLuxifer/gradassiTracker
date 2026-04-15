// Home page — Set leaderboard / overview
import { getModernSets, getSet, formatPrice, setLogoUrl } from '../api.js';

export async function renderHome(container) {
  // Fetch modern sets
  const sets = await getModernSets();

  // Display sets overview with basic info
  // We'll show the most recent sets and allow clicking into them
  const recentSets = sets.slice(0, 20);

  // For the top sets, try to fetch pricing data for a few
  // We do this async in the background to populate the leaderboard
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">Classifica Set Pokémon TCG</h1>
        <p class="page-subtitle">
          Traccia i prezzi delle carte Pokémon in <strong>italiano</strong> con dati CardTrader aggiornati.
        </p>
      </div>

      <div class="leaderboard" style="margin-bottom: 2rem;">
        <div class="leaderboard-header">
          <div class="leaderboard-title">🔥 Set Più Recenti</div>
          <div class="leaderboard-desc">
            Le ultime espansioni Pokémon TCG — clicca su un set per vedere tutte le carte e i prezzi
          </div>
        </div>
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Set</th>
              <th>Carte</th>
              <th>Serie</th>
            </tr>
          </thead>
          <tbody id="recent-sets-body">
            ${recentSets.map((s, i) => `
              <tr data-set="${s.id}">
                <td>
                  <span class="rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</span>
                </td>
                <td>
                  <div class="table-card-cell">
                    ${s.logo ? `<img src="${setLogoUrl(s.logo)}" alt="" class="table-thumb" style="height:40px;width:auto;object-fit:contain;">` : ''}
                    <div>
                      <div class="card-name">${s.name}</div>
                    </div>
                  </div>
                </td>
                <td>${s.cardCount?.official || s.cardCount?.total || '—'}</td>
                <td><span class="chip">${getSerieLabel(s.id)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="text-align: center; margin-top: 1.5rem;">
        <a href="#/sets" class="btn btn-primary">Vedi Tutti i Set →</a>
      </div>
    </div>
  `;

  // Click handlers
  container.querySelectorAll('[data-set]').forEach(row => {
    row.addEventListener('click', () => {
      window.location.hash = `#/set/${row.dataset.set}`;
    });
  });
}

function getSerieLabel(id) {
  if (id.startsWith('me')) return 'Megaevoluzione';
  if (id.startsWith('sv')) return 'Scarlatto & Violetto';
  if (id.startsWith('swsh')) return 'Spada & Scudo';
  if (id.startsWith('sm')) return 'Sole & Luna';
  if (id.startsWith('xy')) return 'XY';
  if (id.startsWith('bw')) return 'Nero & Bianco';
  if (id.startsWith('hgss')) return 'HGSS';
  if (id.startsWith('dp')) return 'Diamante & Perla';
  if (id.startsWith('A') || id.startsWith('B')) return 'TCG Pocket';
  return 'Altro';
}
