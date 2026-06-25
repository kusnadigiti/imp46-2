import https from 'https';

const urls = [
  'https://upload.wikimedia.org/wikipedia/commons/e/ea/Smkn_46_Jakarta.png',
  'https://upload.wikimedia.org/wikipedia/id/5/52/Logo_SMKN_46_Jakarta.jpg',
  'https://upload.wikimedia.org/wikipedia/id/b/b3/Logo_SMKN_46_Jakarta.png',
  'https://upload.wikimedia.org/wikipedia/commons/4/4b/Logo_SMKN_46_Jakarta.png',
  'https://smkn46jaktim.sch.id/wp-content/uploads/2021/11/logo-smk-46.png',
  'https://smkn46jaktim.sch.id/storage/logo.png',
  'https://smkn46jaktim.sch.id/images/logo.png',
  'https://sekolah.data.kemdikbud.go.id/master/logo/20103295',
  'https://pbs.twimg.com/profile_images/2635955314/e7b9b7d8d21b06604618e47f5cf4a026_400x400.png'
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(res.statusCode, url);
  }).on('error', () => {
    console.log('Error', url);
  });
});
