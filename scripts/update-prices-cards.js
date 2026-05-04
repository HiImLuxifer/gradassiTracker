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

const SETS_TO_SCAN = 35; 

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
            const fbPrice = fullCardIt.pricing?.cardmarket?.low || fullCardIt.pricing?.cardmarket?.trend || 0;
            if(fbPrice > 0){
               finalData.cards[cardEn.id] = {
                  name: fullCardIt.name,
                  setName: setIt.name,
                  image: fullCardIt.image,
                  rarity: fullCardIt.rarity || '—',
                  priceITNM: parseFloat((fbPrice * 1.05).toFixed(2)),
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

    finalData.updatedAt = new Date().toISOString();
    fs.writeFileSync(DEST_FILE, JSON.stringify(finalData, null, 2));
    console.log(`\n🎉 Aggiornamento Carte completato con successo.`);

  } catch (err) {
    console.error('\n❌ ERRORE CRITICO:', err);
    process.exit(1);
  }
}

runUpdateCards();
