import 'dotenv/config';

const CT_TOKEN = process.env.CARDTRADER_API_TOKEN;
const CT_BASE = 'https://api.cardtrader.com/api/v2';
const CT_HEADERS = {
  'Authorization': `Bearer ${CT_TOKEN}`,
  'Accept': 'application/json'
};

// Use a known blueprint ID from the cache (Spinarak me03-001, blueprintId 378846)
const BLUEPRINT_ID = 378846;

async function debug() {
  console.log('Fetching products for blueprint', BLUEPRINT_ID, '...');
  const res = await fetch(`${CT_BASE}/marketplace/products?blueprint_id=${BLUEPRINT_ID}`, { headers: CT_HEADERS });
  const data = await res.json();
  
  // Show structure
  if (Array.isArray(data)) {
    console.log(`Got ${data.length} products (array)`);
    // Show first 3 products with full structure
    data.slice(0, 3).forEach((p, i) => {
      console.log(`\n--- Product ${i} ---`);
      console.log(JSON.stringify(p, null, 2));
    });
  } else {
    console.log('Response is object with keys:', Object.keys(data));
    // Show first few from each key
    for (const key of Object.keys(data)) {
      const arr = data[key];
      console.log(`\nKey "${key}": ${Array.isArray(arr) ? arr.length : typeof arr} items`);
      if (Array.isArray(arr) && arr.length > 0) {
        console.log('First product:');
        console.log(JSON.stringify(arr[0], null, 2));
      }
    }
  }
}

debug().catch(console.error);
