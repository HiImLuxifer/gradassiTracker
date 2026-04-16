import 'dotenv/config';
async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${process.env.CARDTRADER_API_TOKEN}` } });
  return res.json();
}
async function test() {
  const blueprintsBB = await fetchJson('https://api.cardtrader.com/api/v2/blueprints/export?category_id=67');
  const surgingBB = blueprintsBB.find(b => b.name.toLowerCase().includes('surging sparks'));
  console.log('Booster Box:', surgingBB);

  // ETBs? try 60 (Box Set)
  const blueprintsBox = await fetchJson('https://api.cardtrader.com/api/v2/blueprints/export?category_id=60');
  const surgingETB = blueprintsBox.find(b => b.name.toLowerCase().includes('surging sparks elite trainer box') || b.name.toLowerCase().includes('surging sparks'));
  console.log('Box Set:', surgingETB);
}
test();
