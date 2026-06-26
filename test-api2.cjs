const http = require('http');

const data = JSON.stringify({
  name: "Mouse",
  kodeBarang: "KB-TEST02",
  quantity: 45,
  price: NaN,
  location: "er",
  category: "erf"
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/inventory',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
  });
});
req.write(data);
req.end();
