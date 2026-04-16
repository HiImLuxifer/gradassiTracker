import 'dotenv/config';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${process.env.CARDTRADER_API_TOKEN}` } });
  return res.json();
}

async function test() {
  const products = await fetchJson('https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id=299916');
  const arr = Object.values(products).flat();
  if (arr.length > 0) {
      console.log('Sample product:', JSON.stringify(arr[0], null, 2));
      const itNMs = arr.filter(p => p.language === 'it' || p.properties_hash?.language === 'it');
      console.log('IT items:', itNMs.length);
  }
}
test();
