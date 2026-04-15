import 'dotenv/config';
import fs from 'fs';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${process.env.CARDTRADER_API_TOKEN}` } });
  return res.json();
}

async function test() {
  console.log('Fetching expansions...');
  const expansions = await fetchJson('https://api.cardtrader.com/api/v2/expansions');
  // Find pokemon (game_id: 1) expansion named "Surging Sparks" or similar
  const pokemonExp = expansions.filter(e => e.game_id === 1);
  const surgingSparks = pokemonExp.find(e => e.name.toLowerCase().includes('surging sparks'));
  console.log('Expansion:', surgingSparks);
  
  if (surgingSparks) {
    console.log('Fetching blueprints for expansion...');
    const blueprints = await fetchJson(`https://api.cardtrader.com/api/v2/blueprints/export?expansion_id=${surgingSparks.id}`);
    console.log(`Found ${blueprints.length} blueprints.`);
    // Pick the first one
    const bp = blueprints[0];
    console.log('First Blueprint:', bp.name, bp.id);
    
    console.log('Fetching products...');
    const products = await fetchJson(`https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id=${bp.id}`);
    const itNMs = Object.values(products).flat().filter(p => p.language === 'it' && p.condition.name === 'Near Mint');
    console.log(`Italian NMs: ${itNMs.length}`);
    if (itNMs.length > 0) {
        console.log('Best Italian NM Price:', Math.min(...itNMs.map(p => p.price.cents)) / 100);
    }
  }
}
test();
