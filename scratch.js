import 'dotenv/config';
const CT_TOKEN = process.env.CARDTRADER_API_TOKEN;
const CT_HEADERS = { 'Authorization': `Bearer ${CT_TOKEN}`, 'Accept': 'application/json' };

async function test() {

  const sv8etbId = 299925; // Surging Sparks ETB
  const pRes = await fetch(`https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id=${sv8etbId}`, { headers: CT_HEADERS }).then(r => r.json());
  const arr = Array.isArray(pRes) ? pRes : Object.values(pRes).flat();
  const noLang = arr.filter(p => !p.properties_hash.pokemon_language);
  console.log('ETB No-lang products:', noLang.slice(0, 5).map(p => ({price: p.price.cents, seller_country: p.seller?.country_code})));
}
test();
