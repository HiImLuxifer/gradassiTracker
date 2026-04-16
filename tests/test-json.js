import fs from 'fs';
const data = JSON.parse(fs.readFileSync('public/data/it-prices.json', 'utf8'));
console.log('Sealed Data:', Object.keys(data.sealed));
