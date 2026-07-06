const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(
  'C:',
  'Users',
  'Artem',
  '.cursor',
  'projects',
  'd-WORK-dubravenka-by',
  'assets'
);

const sources = [
  {
    id: '1-1e1ef6f1-4afd-46f3-8aea-7d49e51ce1ef',
    out: 'gallery-01.jpg',
    alt: 'DUBRAVENKA — grill и пицца',
  },
  {
    id: '2-3dc7845d-ba9b-4301-85cf-874832a9097e',
    out: 'gallery-02.jpg',
    alt: 'Летняя терраса DUBRAVENKA',
  },
];

const outDir = path.join(__dirname, '..', 'assets', 'images', 'gallery');

function findSource(id) {
  const file = fs.readdirSync(assetsDir).find((name) => name.includes(id));
  if (!file) throw new Error(`Source not found for ${id}`);
  return path.join(assetsDir, file);
}

async function prepare() {
  fs.mkdirSync(outDir, { recursive: true });

  const gallery = [];
  for (const { id, out, alt } of sources) {
    const src = findSource(id);
    const output = path.join(outDir, out);

    await sharp(src)
      .resize(1040, 1386, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(output);

    const size = fs.statSync(output).size;
    console.log(`${out}: ${Math.round(size / 1024)}KB`);
    gallery.push({ src: `assets/images/gallery/${out}`, alt });
  }

  return gallery;
}

prepare()
  .then((gallery) => {
    console.log(JSON.stringify(gallery, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
