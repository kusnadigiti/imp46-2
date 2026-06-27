import fetch from 'node-fetch';
async function test() {
  const data = {
    name: "Barang Test",
    kodeBarang: "KB-12345",
    category: "Elektronik",
    location: "A1",
    quantity: 1,
    price: 100
  };
  const r1 = await fetch('http://localhost:3000/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  console.log("r1:", await r1.text());
  
  data.kodeBarang = "KB-12346"; // valid
  data.price = ""; // What if it's empty string
  const r2 = await fetch('http://localhost:3000/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  console.log("r2:", await r2.text());
  
  data.kodeBarang = "KB-12347";
  data.price = null; // What if it's null
  const r3 = await fetch('http://localhost:3000/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  console.log("r3:", await r3.text());
}
test();
