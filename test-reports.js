import fetch from 'node-fetch';
async function test() {
  const r = await fetch('http://localhost:3000/api/reports/summary');
  console.log(await r.text());
}
test();
