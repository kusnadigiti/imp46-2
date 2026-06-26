const http = require('http');

const data = JSON.stringify({
  name: "Mouse",
  kodeBarang: "KB-TEST01",
  quantity: 10,
  price: 100,
  location: "Rack 1",
  category: "Electronics"
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/inventory',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', JSON.stringify(res.headers));
    console.log('BODY:', body);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
