import 'dotenv/config';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${process.env.CARDTRADER_API_TOKEN}` } });
  return res.json();
}

async function test() {
  const expansions = await fetchJson('https://api.cardtrader.com/api/v2/expansions');
  const surgingSparks = expansions.find(e => e.game_id === 5 && e.name.toLowerCase() === 'surging sparks');
  
  if (surgingSparks) {
     console.log('Surging Sparks ID:', surgingSparks.id);
     const bps = await fetchJson(`https://api.cardtrader.com/api/v2/blueprints/export?expansion_id=${surgingSparks.id}`);
     const sealed = bps.filter(b => [67, 68, 60, 59].includes(b.category_id)); // categories 67=Booster Box, etc.
     console.log('Sealed Products in Surging Sparks:');
     console.log(sealed.map(b => ({ name: b.name, cat: b.category_id, id: b.id })));
  }
}
test();
