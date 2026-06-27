import fetch from 'node-fetch';

async function run() {
  const data = {
    name: "Barang Test UI",
    kodeBarang: "KB-123TEST",
    category: "Elektronik",
    location: "Rak A",
    quantity: 1,
    price: 1000
  };
  const res = await fetch('http://localhost:3000/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  console.log(res.status, await res.text());
}
run();
