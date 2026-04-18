import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CT_TOKEN = process.env.CARDTRADER_API_TOKEN;
const DEST_FILE = path.join(__dirname, '..', 'public', 'data', 'it-prices.json');

// Configurazione
const TCGDEX_BASE_IT = 'https://api.tcgdex.net/v2/it';
const TCGDEX_BASE_EN = 'https://api.tcgdex.net/v2/en';
const CT_BASE = 'https://api.cardtrader.com/api/v2';

const CT_HEADERS = {
  'Authorization': `Bearer ${CT_TOKEN}`,
  'Accept': 'application/json'
};

const SETS_TO_SCAN = 15; 

// Helper per i rate limit e le fetch
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    if (res.status === 429) {
      console.warn('⚠️ Rate limit superato, attendo 5s...');
      await sleep(5000);
      return fetchJson(url, options);
    }
    throw new Error(`API GET Error: ${res.status} on ${url}`);
  }
  return res.json();
}

/**
 * Funzione principale
 */
async function runUpdate() {
  console.log('🚀 Inizio scansione ufficiale CardTrader...');

  if (!CT_TOKEN || CT_TOKEN === 'inserisci_qui_il_tuo_token') {
    console.error('❌ ERRORE: Token CardTrader mancante.');
    process.exit(1);
  }

  // Prepara directory output
  const dataDir = path.dirname(DEST_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const finalData = {
    updatedAt: new Date().toISOString(),
    cards: {},
    sealed: {}
  };

  try {
    // 1. Inizializza mapping Expansions da CardTrader (Pokémon è game_id 5)
    console.log('🗂 Caricamento catalogo espansioni da CardTrader...');
    const ctExpansionsAll = await fetchJson(`${CT_BASE}/expansions`, { headers: CT_HEADERS });
    // Pokemon
    const ctPokemonExpansions = ctExpansionsAll.filter(e => e.game_id === 5);

    // 2. Prendi gli ultimi set base da TCGdex
    console.log('📥 Scaricamento ultimi set da TCGdex...');
    const allSetsIt = await fetchJson(`${TCGDEX_BASE_IT}/sets`);
    const recentSets = allSetsIt
      .filter(s => s.id.startsWith('sv') || s.id.startsWith('me') || s.id.startsWith('swsh')) // Rimosso A1/Pocket
      .reverse()
      .slice(0, SETS_TO_SCAN);

    for (const set of recentSets) {
      console.log(`\\n📦 [SET] Analizzo: ${set.name} (${set.id})`);

      // TCGdex: prendi il nome del set in INGLESE per trovare la corrispondenza con CardTrader
      const setEn = await fetchJson(`${TCGDEX_BASE_EN}/sets/${set.id}`);
      const setIt = await fetchJson(`${TCGDEX_BASE_IT}/sets/${set.id}`);
      
      const ctExpansion = ctPokemonExpansions.find(e => e.name.toLowerCase() === setEn.name.toLowerCase());
      
      if (!ctExpansion) {
        console.warn(`  ⚠️ Impossibile trovare corrispondenza in CardTrader per l'espansione "${setEn.name}". Salto...`);
        continue;
      }
      console.log(`  🔗 Trovato set su CardTrader! ID: ${ctExpansion.id}`);

      // Scarichiamo TUTTE le blueprints (le carte fisiche nel database di CT) per questa espansione
      const blueprints = await fetchJson(`${CT_BASE}/blueprints/export?expansion_id=${ctExpansion.id}`, { headers: CT_HEADERS });
      console.log(`  📜 Trovate ${blueprints.length} blueprints per il set.`);

      // ---- ESTRAZIONE SEALED ----
      const sealedBps = blueprints.filter(b => [67, 68, 60, 59].includes(b.category_id));
      let bbPrice = null;
      let etbPrice = null;
      let bbSlug = null;
      let etbSlug = null;
      let bbBlueprintId = null;
      let etbBlueprintId = null;
      for (const bp of sealedBps) {
         const nameLower = bp.name.toLowerCase();
         const isBB = nameLower.includes('booster box') && !nameLower.includes('case');
         const isBundle = nameLower.includes('booster bundle');
         const isETB = nameLower.includes('elite trainer box') && !nameLower.includes('case');
         
         if (isBB || isBundle || isETB) {
            await sleep(60);
            try {
               const pRes = await fetchJson(`${CT_BASE}/marketplace/products?blueprint_id=${bp.id}`, { headers: CT_HEADERS });
               let arr = [];
               if (Array.isArray(pRes)) arr = pRes;
               else if (typeof pRes === 'object' && pRes !== null) {
                 for(const k of Object.keys(pRes)) arr = arr.concat(pRes[k]);
               }
               // valid IT sealed
               const valid = arr.filter(p => p.pokemon_language === 'it' || p.properties_hash?.pokemon_language === 'it' || p.language === 'it' || !p.properties_hash?.pokemon_language);
               if (valid.length > 0) {
                  const minP = Math.min(...valid.map(p => p.price.cents)) / 100;
                  // If we find a bundle but already found a real box, do not overwrite. If box not found, use bundle.
                  if (isBB && !bbPrice) {
                    bbPrice = minP;
                    bbSlug = bp.slug;
                    bbBlueprintId = bp.id;
                  }
                  if (isBundle && !bbPrice) {
                    bbPrice = minP;
                    bbSlug = bp.slug;
                    bbBlueprintId = bp.id;
                  }
                  if (isETB && !etbPrice) {
                    etbPrice = minP;
                    etbSlug = bp.slug;
                    etbBlueprintId = bp.id;
                  }
               }
            } catch(e) {}
         }
      }
      finalData.sealed[set.id] = { 
        bbPrice, 
        etbPrice, 
        bbSlug, 
        etbSlug, 
        bbBlueprintId, 
        etbBlueprintId, 
        name: setIt.name 
      };
      console.log(`  📦 Dati Sealed -> BB/Bundle: ${bbPrice || 'N/D'}€, ETB: ${etbPrice || 'N/D'}€`);
      // ---- FINE ESTRAZIONE SEALED ----

      // Scansioniamo TUTTE le carte del set per avere copertura totale (comuni incluse)
      const cardsToScan = setEn.cards;

      for (const cardEn of cardsToScan) {
        process.stdout.write(`  ⏳ Analizzo [${cardEn.id}] ${cardEn.name}... `);

        // Map Blueprint con precisione usando collector_number
        const cleanName = cardEn.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cardNum = cardEn.localId; // Es: 095, 231
        
        // PRIORITÀ 1: Match esatto per collector_number (più affidabile)
        const matchingBp = blueprints.find(bp => {
            const bpCollectorNum = bp.fixed_properties?.collector_number;
            if (bpCollectorNum && cardNum && bpCollectorNum === cardNum) {
              // Numero esatto trovato — verifica anche nome per evitare falsi positivi
              const bpClean = bp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              const nameMatch = bpClean.includes(cleanName) || cleanName.includes(bpClean);
              return nameMatch;
            }
            return false;
        })
        // PRIORITÀ 2: Match per solo collector_number (se nome non coincide, es. nomi tradotti diversamente)
        || blueprints.find(bp => {
            const bpCollectorNum = bp.fixed_properties?.collector_number;
            return bpCollectorNum && cardNum && bpCollectorNum === cardNum;
        })
        // PRIORITÀ 3: Fallback per nome + numero nel version field
        || blueprints.find(bp => {
            const bpClean = bp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const nameMatch = bpClean.includes(cleanName) || cleanName.includes(bpClean);
            const versionMatch = cardNum && bp.version && bp.version.includes(cardNum);
            return nameMatch && versionMatch;
        })
        // PRIORITÀ 4: Fallback disperato solo nome (ultima risorsa)
        || blueprints.find(bp => bp.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanName));

        if (!matchingBp) {
           console.log(`Nessun Mismatch.`);
           continue;
        }

        // Trovato il BP di CardTrader! Andiamo ai prodotti per vedere i prezzi ITA NM.
        // Pausa anti-rate-limit (200 ogni 10s -> max 20 al sec, pausa 50ms)
        await sleep(60);
        
        try {
          const productsResponse = await fetchJson(`${CT_BASE}/marketplace/products?blueprint_id=${matchingBp.id}`, { headers: CT_HEADERS });
          let products = [];
          
          if (Array.isArray(productsResponse)) {
             products = productsResponse;
          } else if (typeof productsResponse === 'object' && productsResponse !== null) {
             const keys = Object.keys(productsResponse);
             for(const key of keys) {
                products = products.concat(productsResponse[key]);
             }
          }

          // Filtriamo per Italiano (it) e Condizione >= Near Mint
          const validProducts = products.filter(p => {
             const props = p.properties_hash || {};
             const isIt = props.pokemon_language === 'it';
             const isNm = props.condition === 'Near Mint' || props.condition === 'Mint';
             return isIt && isNm;
          });

          // Recupero info italiane per salvare nel db UI
          const fullCardIt = await fetchJson(`${TCGDEX_BASE_IT}/cards/${cardEn.id}`);

          if (validProducts.length > 0) {
            // Trova il prezzo minimo (cents -> diviso 100)
            const minPriceCents = Math.min(...validProducts.map(p => p.price.cents));
            const minPrice = minPriceCents / 100;

            finalData.cards[cardEn.id] = {
              name: fullCardIt.name,
              setName: setIt.name,
              image: fullCardIt.image,
              rarity: fullCardIt.rarity || '—',
              priceITNM: minPrice,
              blueprintId: matchingBp.id,
              slug: matchingBp.slug
            };
            console.log(`✅ Minimo ITA/NM: €${minPrice}`);
          } else {
            console.log(`💨 Nessuna ITA/NM (Fallback a mercato medio)`);
            // Fallback a global low se non c'è offerta ITA
            const fbPrice = fullCardIt.pricing?.cardmarket?.low || fullCardIt.pricing?.cardmarket?.trend || 0;
            if(fbPrice > 0){
               finalData.cards[cardEn.id] = {
                  name: fullCardIt.name,
                  setName: setIt.name,
                  image: fullCardIt.image,
                  rarity: fullCardIt.rarity || '—',
                  priceITNM: parseFloat((fbPrice * 1.05).toFixed(2)), // Applicato un mini premium su ITA
                  blueprintId: matchingBp.id,
                  slug: matchingBp.slug
                };
            }
          }
        } catch(e) {
          console.log(`Errore API per questa carta.`);
        }
      }
    }

    // Salva su file
    fs.writeFileSync(DEST_FILE, JSON.stringify(finalData, null, 2));
    console.log(`\n🎉 Aggiornamento completato con successo. Dati CardTrader salvati.`);

  } catch (err) {
    console.error('\n❌ ERRORE CRITICO:', err);
    process.exit(1);
  }
}

runUpdate();
