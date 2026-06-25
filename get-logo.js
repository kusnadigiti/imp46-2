import https from 'https';

https.get('https://smkn46jaktim.sch.id', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const regex = /<img[^>]+src=["']([^"']+)["']/ig;
    let match;
    while ((match = regex.exec(data)) !== null) {
      if (match[1].toLowerCase().includes('logo') || match[1].toLowerCase().includes('46')) {
        console.log(match[1]);
      }
    }
  });
}).on('error', (err) => {
  console.error(err);
});
