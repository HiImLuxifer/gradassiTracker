import 'dotenv/config';
async function test() {
  const res = await fetch('https://api.cardtrader.com/api/v2/expansions', { headers: { 'Authorization': `Bearer ${process.env.CARDTRADER_API_TOKEN}` } });
  const exps = await res.json();
  const pokemonExp = exps.filter(e => e.game_id === 1);
  console.log(pokemonExp.slice(0, 10).map(e => ({ name: e.name, id: e.id })));
}
test();
