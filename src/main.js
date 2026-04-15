// Main app — SPA router + navbar + footer
import { renderHome } from './pages/home.js';
import { renderSets } from './pages/sets.js';
import { renderSetDetail } from './pages/set-detail.js';
import { renderCardDetail } from './pages/card-detail.js';
import { renderSearch } from './pages/search.js';
import { renderAbout } from './pages/about.js';
import { renderCardLeaderboard } from './pages/card-leaderboard.js';
import { renderSealedLeaderboard } from './pages/sealed-leaderboard.js';

// --- Navbar ---
function renderNavbar() {
  const nav = document.getElementById('navbar');
  nav.innerHTML = `
    <div class="nav-inner">
      <div class="nav-logo" id="nav-home-logo">
        <span class="logo-icon">⚡</span>
        <span>Gradassi<span class="logo-accent">TCG</span></span>
      </div>
      <button class="nav-toggle" id="nav-toggle" aria-label="Menu">☰</button>
      <ul class="nav-links" id="nav-links">
        <li><a href="#/" data-nav="home">Home</a></li>
        <li><a href="#/card-leaderboard" data-nav="card-lb">Carte</a></li>
        <li><a href="#/sealed-leaderboard" data-nav="sealed-lb">Sealed</a></li>
        <li><a href="#/sets" data-nav="sets">Set</a></li>
        <li><a href="#/search" data-nav="search">Ricerca</a></li>
        <li><a href="#/about" data-nav="about">Info</a></li>
      </ul>
    </div>
  `;

  // Mobile toggle
  document.getElementById('nav-toggle').addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('open');
  });

  // Logo click → home
  document.getElementById('nav-home-logo').addEventListener('click', () => {
    window.location.hash = '#/';
  });

  // Close mobile menu on link click
  nav.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      document.getElementById('nav-links').classList.remove('open');
    });
  });
}

// --- Footer ---
function renderFooter() {
  const footer = document.getElementById('footer');
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-brand">⚡ GradassiTCG</div>
      <div class="footer-links">
        <a href="https://linktr.ee/gradassiTCG" target="_blank" rel="noopener">Linktree</a>
        <a href="#/about">Info</a>
      </div>
      <div class="footer-note">
        Dati forniti da TCGdex · Prezzi CardTrader · Non affiliato a The Pokémon Company
      </div>
    </div>
  `;
}

// --- Router ---
function getRoute() {
  const hash = window.location.hash || '#/';
  return hash.slice(1); // remove '#'
}

function updateActiveNav(route) {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.remove('active');
    const href = a.getAttribute('href').slice(1); // remove '#'
    if (route === href || (route === '/' && href === '/')) {
      a.classList.add('active');
    } else if (route.startsWith('/card-leaderboard') && href === '/card-leaderboard') {
      a.classList.add('active');
    } else if (route.startsWith('/sealed-leaderboard') && href === '/sealed-leaderboard') {
      a.classList.add('active');
    } else if (route.startsWith('/sets') && href === '/sets') {
      a.classList.add('active');
    } else if (route.startsWith('/search') && href === '/search') {
      a.classList.add('active');
    } else if (route.startsWith('/about') && href === '/about') {
      a.classList.add('active');
    }
  });
}

async function router() {
  const main = document.getElementById('main-content');
  const route = getRoute();

  // Show loading
  main.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <div class="loading-text">Caricamento...</div>
    </div>
  `;

  updateActiveNav(route);

  try {
    if (route === '/' || route === '') {
      await renderHome(main);
    } else if (route === '/card-leaderboard') {
      await renderCardLeaderboard(main);
    } else if (route === '/sealed-leaderboard') {
      await renderSealedLeaderboard(main);
    } else if (route === '/sets') {
      await renderSets(main);
    } else if (route.startsWith('/set/')) {
      const setId = route.split('/set/')[1];
      await renderSetDetail(main, setId);
    } else if (route.startsWith('/card/')) {
      const cardId = route.split('/card/')[1];
      await renderCardDetail(main, cardId);
    } else if (route === '/search') {
      await renderSearch(main);
    } else if (route === '/about') {
      await renderAbout(main);
    } else {
      main.innerHTML = `
        <div class="empty-state fade-in">
          <div class="empty-state-icon">🔍</div>
          <h2>Pagina non trovata</h2>
          <p>La pagina che cerchi non esiste.</p>
          <br>
          <a href="#/" class="btn btn-primary">Torna alla Home</a>
        </div>
      `;
    }
  } catch (err) {
    console.error('Router error:', err);
    main.innerHTML = `
      <div class="empty-state fade-in">
        <div class="empty-state-icon">⚠️</div>
        <h2>Errore di caricamento</h2>
        <p>Si è verificato un errore. Riprova tra poco.</p>
        <br>
        <a href="#/" class="btn btn-primary">Torna alla Home</a>
      </div>
    `;
  }
}

// --- Init ---
renderNavbar();
renderFooter();
window.addEventListener('hashchange', router);
router();
