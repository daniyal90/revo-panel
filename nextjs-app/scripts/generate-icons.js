const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const svgPath = path.join(__dirname, '..', 'public', 'icons', 'icon-base.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('SVG base not found:', svgPath);
    process.exit(1);
  }
  const svgBuffer = fs.readFileSync(svgPath);

  const root = path.join(__dirname, '..');
  const out = (p) => path.join(root, p);

  // Ensure target directories exist
  const dirs = [
    out('electron/icons'),
    out('public/icons/ios'),
    out('public/icons/android'),
    out('public/splash'),
    out('public')
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // PNG sizes
  await sharp(svgBuffer).png().resize(1024, 1024).toFile(out('electron/icons/icon-1024.png'));
  await sharp(svgBuffer).png().resize(1024, 1024).toFile(out('public/icons/ios/AppIcon-1024.png'));
  await sharp(svgBuffer).png().resize(1080, 1080).toFile(out('public/icons/android/foreground.png'));
  // background with gradient fill fallback: use the svg with rectangle only
  await sharp(svgBuffer).png().resize(1080, 1080).toFile(out('public/icons/android/background.png'));
  await sharp(svgBuffer).png().resize(256, 256).toFile(out('public/icon.png'));
  await sharp(svgBuffer).png().resize(64, 64).toFile(out('public/favicon-64.png'));

  // ICO generation (multi-size)
  const png16 = await sharp(svgBuffer).png().resize(16, 16).toBuffer();
  const png32 = await sharp(svgBuffer).png().resize(32, 32).toBuffer();
  const png48 = await sharp(svgBuffer).png().resize(48, 48).toBuffer();
  const png64 = await sharp(svgBuffer).png().resize(64, 64).toBuffer();
  const png128 = await sharp(svgBuffer).png().resize(128, 128).toBuffer();
  const png256 = await sharp(svgBuffer).png().resize(256, 256).toBuffer();

  // write favicon.ico using sharp (single-image ICO)
  await sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: png256 },
    ])
    .toFile(out('public/favicon.ico'));

  // also write electron .ico as single 256 image (Icon packs typically needed externally for full multi-res)
  const electronIcoDest = out('electron/icons/app-icon-1024.png');
  fs.copyFileSync(out('electron/icons/icon-1024.png'), electronIcoDest);

  console.log('Icons generated.');
}

generate().catch((e)=>{console.error(e);process.exit(1)});
