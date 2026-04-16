import 'dotenv/config';
async function test() {
  const res = await fetch('https://api.cardtrader.com/api/v2/info', {
    headers: { 'Authorization': `Bearer ${process.env.CARDTRADER_API_TOKEN}` }
  });
  console.log(await res.json());
}
test();
