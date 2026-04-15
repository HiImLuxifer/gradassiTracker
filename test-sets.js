async function test() {
  const allSetsIt = await (await fetch('https://api.tcgdex.net/v2/it/sets')).json();
  const recent = allSetsIt.filter(s => s.id.startsWith('sv') || s.id.startsWith('me')).reverse().slice(0, 10);
  console.log(recent.map(s => s.id + ' : ' + s.name));
}
test();
