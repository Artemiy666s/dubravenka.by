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
  { id: 'd3817acb-ad77-40e6-889e-c2f3e11af243', out: 'promo-beer.jpg' },
  { id: 'a49e5a69-aa9f-4a0b-94e4-0a795e1abd09', out: 'promo-cake.jpg' },
  { id: 'b1028859-9d01-4c69-b831-24f557bea134', out: 'promo-mugs.jpg' },
];

function findSource(id) {
  const file = fs.readdirSync(assetsDir).find((name) => name.includes(id));
  if (!file) throw new Error(`Source not found for ${id}`);
  return path.join(assetsDir, file);
}

const outDir = path.join(__dirname, '..', 'assets', 'images', 'promotions');

async function prepare() {
  fs.mkdirSync(outDir, { recursive: true });

  for (const { id, out } of sources) {
    const src = findSource(id);

    const output = path.join(outDir, out);

    await sharp(src)
      .trim({ threshold: 10 })
      .resize(720, null, { withoutEnlargement: false })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(output);

    const size = fs.statSync(output).size;
    console.log(`${out}: ${Math.round(size / 1024)}KB`);
  }
}

prepare().catch((err) => {
  console.error(err);
  process.exit(1);
});
