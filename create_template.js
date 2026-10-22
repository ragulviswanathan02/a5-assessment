const sharp = require('sharp');
const path = require('path');

const width = 1024;
const height = 679;

// Measure exact background color at (512, 330)
sharp('C:/Users/RAGUL/.gemini/antigravity-ide/brain/333c634b-e419-46de-aebe-772f573508c9/.user_uploaded/media_1792658252802.png')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    // Sample pixel at x: 220, y: 340
    const idx = (340 * info.width + 220) * info.channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const hexColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    console.log('Sampled background color:', hexColor, `rgb(${r},${g},${b})`);

    const maskSvg = Buffer.from(`
      <svg width="${width}" height="${height}">
        <!-- Student Name -->
        <rect x="220" y="315" width="584" height="52" fill="${hexColor}" />
        <!-- College & Assessment Statement -->
        <rect x="220" y="372" width="584" height="84" fill="${hexColor}" />
        <!-- Score & Cutoff -->
        <rect x="250" y="460" width="524" height="34" fill="${hexColor}" />
        <!-- Date -->
        <rect x="635" y="578" width="200" height="26" fill="${hexColor}" />
      </svg>
    `);

    return sharp('C:/Users/RAGUL/.gemini/antigravity-ide/brain/333c634b-e419-46de-aebe-772f573508c9/.user_uploaded/media_1792658252802.png')
      .composite([{ input: maskSvg, top: 0, left: 0 }])
      .toFile('public/a5a-certificate-template.png');
  })
  .then(() => {
    console.log('Saved public/a5a-certificate-template.png successfully!');
  })
  .catch(err => console.error(err));
