import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CT_TOKEN = process.env.CARDTRADER_API_TOKEN;
const DEST_FILE = path.join(__dirname, '..', 'public', 'data', 'it-prices.json');

const TCGDEX_BASE_IT = 'https://api.tcgdex.net/v2/it';
const TCGDEX_BASE_EN = 'https://api.tcgdex.net/v2/en';
const CT_BASE = 'https://api.cardtrader.com/api/v2';

const CT_HEADERS = {
  'Authorization': `Bearer ${CT_TOKEN}`,
  'Accept': 'application/json'
};

const SETS_TO_SCAN = 20; 

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

async function runUpdateCards() {
  console.log('🚀 Inizio scansione carte CardTrader...');

  if (!CT_TOKEN || CT_TOKEN === 'inserisci_qui_il_tuo_token') {
    console.error('❌ ERRORE: Token CardTrader mancante.');
    process.exit(1);
  }

  const dataDir = path.dirname(DEST_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let finalData = { updatedAt: new Date().toISOString(), cards: {}, sealed: {} };
  if (fs.existsSync(DEST_FILE)) {
    try {
      finalData = JSON.parse(fs.readFileSync(DEST_FILE, 'utf-8'));
      finalData.sealed = finalData.sealed || {};
      finalData.cards = finalData.cards || {};
    } catch (e) {
      console.warn('⚠️ File esistente corrotto, ricreo...');
    }
  }

  try {
    console.log('🗂 Caricamento catalogo espansioni da CardTrader...');
    const ctExpansionsAll = await fetchJson(`${CT_BASE}/expansions`, { headers: CT_HEADERS });
    const ctPokemonExpansions = ctExpansionsAll.filter(e => e.game_id === 5);

    console.log('📥 Scaricamento ultimi set da TCGdex...');
    const allSetsIt = await fetchJson(`${TCGDEX_BASE_IT}/sets`);
    const recentSets = allSetsIt
      .filter(s => s.id.startsWith('sv') || s.id.startsWith('me') || s.id.startsWith('swsh'))
      .reverse()
      .slice(0, SETS_TO_SCAN);

    for (const set of recentSets) {
      console.log(`\n📦 [SET] Analizzo Carte: ${set.name} (${set.id})`);

      const setEn = await fetchJson(`${TCGDEX_BASE_EN}/sets/${set.id}`);
      const setIt = await fetchJson(`${TCGDEX_BASE_IT}/sets/${set.id}`);
      
      const ctExpansion = ctPokemonExpansions.find(e => e.name.toLowerCase() === setEn.name.toLowerCase());
      
      if (!ctExpansion) {
        console.warn(`  ⚠️ Impossibile trovare corrispondenza in CardTrader per l'espansione "${setEn.name}". Salto...`);
        continue;
      }

      const blueprints = await fetchJson(`${CT_BASE}/blueprints/export?expansion_id=${ctExpansion.id}`, { headers: CT_HEADERS });
      
      const cardsToScan = setEn.cards;

      for (const cardEn of cardsToScan) {
        process.stdout.write(`  ⏳ Analizzo [${cardEn.id}] ${cardEn.name}... `);

        const cleanName = cardEn.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cardNum = cardEn.localId; 
        
        const matchingBp = blueprints.find(bp => {
            const bpCollectorNum = bp.fixed_properties?.collector_number;
            if (bpCollectorNum && cardNum && bpCollectorNum === cardNum) {
              const bpClean = bp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              const nameMatch = bpClean.includes(cleanName) || cleanName.includes(bpClean);
              return nameMatch;
            }
            return false;
        })
        || blueprints.find(bp => {
            const bpCollectorNum = bp.fixed_properties?.collector_number;
            return bpCollectorNum && cardNum && bpCollectorNum === cardNum;
        })
        || blueprints.find(bp => {
            const bpClean = bp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const nameMatch = bpClean.includes(cleanName) || cleanName.includes(bpClean);
            const versionMatch = cardNum && bp.version && bp.version.includes(cardNum);
            return nameMatch && versionMatch;
        })
        || blueprints.find(bp => bp.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanName));

        if (!matchingBp) {
           console.log(`Nessun Mismatch.`);
           continue;
        }

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

          const validProducts = products.filter(p => {
             const props = p.properties_hash || {};
             const isIt = props.pokemon_language === 'it';
             const isNm = props.condition === 'Near Mint' || props.condition === 'Mint';
             return isIt && isNm;
          });

          const fullCardIt = await fetchJson(`${TCGDEX_BASE_IT}/cards/${cardEn.id}`);

          if (validProducts.length > 0) {
            const priceCentsArr = validProducts.map(p => p.price.cents);
            const minPriceCents = Math.min(...priceCentsArr);
            
            // Filtro outlier: rimuovo offerte che sono > 10x il minimo (troll listings)
            const filteredProducts = validProducts.filter(p => p.price.cents <= minPriceCents * 10);
            
            const filteredPriceCents = filteredProducts.map(p => p.price.cents);
            const maxPriceCents = Math.max(...filteredPriceCents);
            
            const minPrice = minPriceCents / 100;
            const maxPrice = maxPriceCents / 100;

            // Disponibilità: somma quantità di tutte le offerte (incluse outlier per volume totale, o solo filtrate?)
            // Uso solo filtrate per coerenza con il range
            const availableQty = filteredProducts.reduce((sum, p) => sum + (p.quantity || 1), 0);
            const offerCount = filteredProducts.length;

            // Fasce di prezzo dinamiche (3 bande basate sul range filtrato)
            const range = maxPrice - minPrice;
            let priceBands;
            if (range <= 0 || offerCount <= 1) {
              priceBands = null;
            } else {
              const third = range / 3;
              const lowBound = minPrice + third;
              const midBound = minPrice + third * 2;
              priceBands = {
                low: { max: parseFloat(lowBound.toFixed(2)), count: 0 },
                mid: { max: parseFloat(midBound.toFixed(2)), count: 0 },
                high: { max: parseFloat(maxPrice.toFixed(2)), count: 0 }
              };
              for (const p of validProducts) {
                const price = p.price.cents / 100;
                if (price <= lowBound) priceBands.low.count++;
                else if (price <= midBound) priceBands.mid.count++;
                else priceBands.high.count++;
              }
            }

            const oldData = finalData.cards[cardEn.id] || {};
            const history = Array.isArray(oldData.history) ? oldData.history : [];
            const today = new Date().toISOString().split('T')[0];

            const lastEntry = history.length > 0 ? history[history.length - 1] : null;
            if (!lastEntry || lastEntry.date !== today) {
               history.push({ date: today, price: minPrice });
            } else {
               history[history.length - 1].price = minPrice;
            }
            if (history.length > 90) history.shift();

            finalData.cards[cardEn.id] = {
              name: fullCardIt.name,
              setName: setIt.name,
              image: fullCardIt.image,
              rarity: fullCardIt.rarity || '—',
              priceITNM: minPrice,
              priceMax: maxPrice,
              availableQty: availableQty,
              offerCount: offerCount,
              priceBands: priceBands,
              blueprintId: matchingBp.id,
              slug: matchingBp.slug,
              history: history
            };
            console.log(`✅ Min: €${minPrice} | Max: €${maxPrice} | ${availableQty} copie (${offerCount} offerte)`);
          } else {
            console.log(`💨 Nessuna ITA/NM (Fallback a mercato medio)`);
            const fbPrice = fullCardIt.pricing?.cardmarket?.low || fullCardIt.pricing?.cardmarket?.trend || 0;
            if (fbPrice > 0) {
               const minPrice = parseFloat((fbPrice * 1.05).toFixed(2));

               const oldData = finalData.cards[cardEn.id] || {};
               const history = Array.isArray(oldData.history) ? oldData.history : [];
               const today = new Date().toISOString().split('T')[0];

               const lastEntry = history.length > 0 ? history[history.length - 1] : null;
               if (!lastEntry || lastEntry.date !== today) {
                  history.push({ date: today, price: minPrice });
               } else {
                  history[history.length - 1].price = minPrice;
               }
               if (history.length > 90) history.shift();

               finalData.cards[cardEn.id] = {
                  name: fullCardIt.name,
                  setName: setIt.name,
                  image: fullCardIt.image,
                  rarity: fullCardIt.rarity || '—',
                  priceITNM: minPrice,
                  priceMax: null,
                  availableQty: 0,
                  offerCount: 0,
                  priceBands: null,
                  blueprintId: matchingBp.id,
                  slug: matchingBp.slug,
                  history: history
                };
            }
          }
        } catch(e) {
          console.log(`Errore API per questa carta.`);
        }
      }
    }

    finalData.updatedAt = new Date().toISOString();
    fs.writeFileSync(DEST_FILE, JSON.stringify(finalData, null, 2));
    console.log(`\n🎉 Aggiornamento Carte completato con successo.`);

  } catch (err) {
    console.error('\n❌ ERRORE CRITICO:', err);
    process.exit(1);
  }
}

runUpdateCards();
