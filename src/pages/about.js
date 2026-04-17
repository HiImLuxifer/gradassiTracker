// About / Info page
export async function renderAbout(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">Chi Siamo</h1>
      </div>

      <div class="about-content">
        <div class="card-info-section" style="margin-bottom:2rem;">
          <h3 style="font-size:var(--font-size-lg);text-transform:none;letter-spacing:0;">
            ⚡ GradassiTracker — Tracker Pokémon TCG Italiano
          </h3>
          <p style="margin-top:1rem;">
            Benvenuto su <strong>GradassiTracker</strong>, il primo strumento pensato per i collezionisti 
            di carte Pokémon TCG <strong>in lingua italiana</strong>.
          </p>
          <p>
            Mentre la maggior parte dei tool di analisi si concentra sulle carte in inglese e 
            sul mercato americano, noi ci focalizziamo sulle carte italiane con prezzi 
            direttamente da <strong>CardTrader</strong> in Euro (€).
          </p>
        </div>

        <h2>🎯 Cosa puoi fare</h2>
        <p>
          <strong>Esplorare i set</strong> — Naviga tra tutte le espansioni Pokémon TCG disponibili 
          in italiano, dalle più moderne alle classiche.
        </p>
        <p>
          <strong>Controllare i prezzi</strong> — Ogni carta mostra il prezzo medio, minimo, il trend 
          e le medie a 1, 7 e 30 giorni da TCGdex (Fallback) e CardTrader.
        </p>
        <p>
          <strong>Cercare carte</strong> — Cerca per nome tra migliaia di carte in italiano.
        </p>

        <h2>📊 Da dove vengono i dati?</h2>
        <p>
          I dati delle carte provengono da <a href="https://tcgdex.dev" target="_blank" rel="noopener">TCGdex</a>, 
          un'API open-source multilingue per il Pokémon TCG. I prezzi sono aggregati da 
          <a href="https://www.cardtrader.com" target="_blank" rel="noopener">CardTrader</a>, il 
          più grande marketplace per carte collezionabili.
        </p>

        <h2>🔗 Seguici</h2>
        <div class="about-links">
          <a href="https://linktr.ee/gradassitcg" target="_blank" rel="noopener" class="about-link-card">
            🌳 Linktree
          </a>
          <a href="https://www.instagram.com/gradassitcg" target="_blank" rel="noopener" class="about-link-card">
            📸 Instagram
          </a>
          <a href="https://www.tiktok.com/@gradassitcg" target="_blank" rel="noopener" class="about-link-card">
            🎵 TikTok
          </a>
        </div>

        <div style="margin-top:3rem;padding:1.5rem;border-radius:var(--radius-md);background:rgba(74,158,172,0.1);border:1px solid var(--border-color);">
          <p style="font-size:var(--font-size-sm);color:var(--text-secondary);margin:0;">
            <strong>Disclaimer:</strong> GradassiTracker non è affiliato, sponsorizzato o approvato da 
            The Pokémon Company International, Nintendo o Creatures Inc. I prezzi mostrati sono 
            indicativi e basati su dati aggregati da fonti terze.
          </p>
        </div>
      </div>
    </div>
  `;
}
