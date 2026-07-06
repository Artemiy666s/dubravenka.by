const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, '..', 'assets', 'images', 'food');

async function optimize() {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
  for (const file of files) {
    const input = path.join(dir, file);
    const stat = fs.statSync(input);
    const base = file.replace(/\.png$/, '');
    const output = path.join(dir, `${base}.jpg`);

    await sharp(input)
      .resize(480, 360, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(output);

    if (stat.size > 300000) {
      fs.unlinkSync(input);
      console.log(`optimized ${base}: ${Math.round(stat.size / 1024)}KB -> jpg`);
    } else {
      console.log(`kept ${base}.png (${Math.round(stat.size / 1024)}KB), also wrote jpg`);
    }
  }

  // Remove stray jpgs where png still exists and is small
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.jpg'))) {
    const base = file.replace(/\.jpg$/, '');
    const png = path.join(dir, `${base}.png`);
    if (fs.existsSync(png) && fs.statSync(png).size <= 300000) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
}

optimize().catch((err) => {
  console.error(err);
  process.exit(1);
});
