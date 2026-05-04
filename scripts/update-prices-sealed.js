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

async function runUpdateSealed() {
  console.log('🚀 Inizio scansione sealed CardTrader...');

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
      console.log(`\n📦 [SET] Analizzo Sealed: ${set.name} (${set.id})`);

      const setEn = await fetchJson(`${TCGDEX_BASE_EN}/sets/${set.id}`);
      const setIt = await fetchJson(`${TCGDEX_BASE_IT}/sets/${set.id}`);
      
      const ctExpansion = ctPokemonExpansions.find(e => e.name.toLowerCase() === setEn.name.toLowerCase());
      
      if (!ctExpansion) {
        console.warn(`  ⚠️ Impossibile trovare corrispondenza in CardTrader per l'espansione "${setEn.name}". Salto...`);
        continue;
      }

      const blueprints = await fetchJson(`${CT_BASE}/blueprints/export?expansion_id=${ctExpansion.id}`, { headers: CT_HEADERS });
      const sealedBps = blueprints.filter(b => [67, 68, 60, 59].includes(b.category_id));
      
      let bbPrice = null;
      let bundlePrice = null;
      let etbPrice = null;
      let bbSlug = null;
      let bundleSlug = null;
      let etbSlug = null;
      let bbBlueprintId = null;
      let bundleBlueprintId = null;
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
               
               const itProducts = arr.filter(p => {
                 const props = p.properties_hash || {};
                 return props.pokemon_language === 'it';
               });
               
               const valid = itProducts.length > 0 ? itProducts : arr;
               if (valid.length > 0) {
                  const minP = Math.min(...valid.map(p => p.price.cents)) / 100;
                  if (isBB && (!bbPrice || minP < bbPrice)) {
                    bbPrice = minP; bbSlug = bp.slug; bbBlueprintId = bp.id;
                  }
                  if (isBundle && (!bundlePrice || minP < bundlePrice)) {
                    bundlePrice = minP; bundleSlug = bp.slug; bundleBlueprintId = bp.id;
                  }
                  if (isETB && (!etbPrice || minP < etbPrice)) {
                    etbPrice = minP; etbSlug = bp.slug; etbBlueprintId = bp.id;
                  }
               }
            } catch(e) {}
         }
      }
      
      finalData.sealed[set.id] = { 
        bbPrice, bundlePrice, etbPrice, 
        bbSlug, bundleSlug, etbSlug, 
        bbBlueprintId, bundleBlueprintId, etbBlueprintId, 
        name: setIt.name 
      };
      console.log(`  📦 Dati Sealed -> BB: ${bbPrice || 'N/D'}€, Bundle: ${bundlePrice || 'N/D'}€, ETB: ${etbPrice || 'N/D'}€`);
    }

    finalData.updatedAt = new Date().toISOString();
    fs.writeFileSync(DEST_FILE, JSON.stringify(finalData, null, 2));
    console.log(`\n🎉 Aggiornamento Sealed completato con successo.`);

  } catch (err) {
    console.error('\n❌ ERRORE CRITICO:', err);
    process.exit(1);
  }
}

runUpdateSealed();
