import 'dotenv/config';
async function test() {
  const res = await fetch('https://api.cardtrader.com/api/v2/blueprints/export?expansion_id=4363', { headers: { 'Authorization': `Bearer ${process.env.CARDTRADER_API_TOKEN}` } });
  const bps = await res.json();
  const sealed = bps.filter(b => b.category_id !== 73); // Not a single card
  console.log(sealed.map(b => ({ id: b.id, name: b.name, category: b.category_id })));
}
test();
