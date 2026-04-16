import 'dotenv/config';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${process.env.CARDTRADER_API_TOKEN}` } });
  return res.json();
}

async function test() {
  console.log('Fetching categories...');
  const categories = await fetchJson('https://api.cardtrader.com/api/v2/categories');
  console.log(categories);
}
test();
