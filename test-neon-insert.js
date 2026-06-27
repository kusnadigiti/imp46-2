import fetch from 'node-fetch';
async function test() {
  const res = await fetch('http://localhost:3000/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Barang Neon",
      kodeBarang: "KB-NEON" + Date.now(),
      quantity: 5,
      price: 25000,
      location: "Gudang B",
      category: "Perlengkapan"
    })
  });
  console.log(res.status, await res.text());
}
test();
