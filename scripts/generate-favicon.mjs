import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';

const publicDir = './public';

async function generateFavicon() {
  const sizes = [16, 32, 48, 64, 128, 256, 512];
  const pngBuffers = [];
  
  for (const size of sizes) {
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0ea5e9"/><stop offset="100%" style="stop-color:#0284c7"/></linearGradient>
      </defs>
      <rect x="${size*0.05}" y="${size*0.05}" width="${size*0.9}" height="${size*0.9}" rx="${size*0.12}" fill="url(#grad)"/>
      <rect x="${size*0.15}" y="${size*0.15}" width="${size*0.7}" height="${size*0.5}" rx="${size*0.04}" fill="white" fill-opacity="0.3"/>
      <polygon points="${size*0.35},${size*0.3} ${size*0.35},${size*0.7} ${size*0.65},${size*0.5}" fill="white"/>
    </svg>`;
    
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    pngBuffers.push(buffer);
  }
  
  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  
  const pngSvg = `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9"/><stop offset="100%" style="stop-color:#0284c7"/></linearGradient>
    </defs>
    <rect x="12.8" y="12.8" width="230.4" height="230.4" rx="30.72" fill="url(#grad)"/>
    <rect x="38.4" y="38.4" width="179.2" height="128" rx="10.24" fill="white" fill-opacity="0.3"/>
    <polygon points="89.6,76.8 89.6,128 166.4,102.4" fill="white"/>
  </svg>`;
  
  await sharp(Buffer.from(pngSvg)).resize(256, 256).png().toFile(path.join(publicDir, 'lade-logo.png'));
  
  console.log('Favicon redesigned successfully!');
}

generateFavicon();