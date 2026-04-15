import 'dotenv/config';
async function test() {
  const res = await fetch('https://api.cardtrader.com/api/v2/games', { headers: { 'Authorization': `Bearer ${process.env.CARDTRADER_API_TOKEN}` } });
  const games = await res.json();
  console.log(games);
}
test();
