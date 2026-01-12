/**
 * Script to generate YearLine PNG icons from SVG
 * Run with: node scripts/generate-icons.js
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [192, 256, 384, 512, 1024];
const publicDir = join(__dirname, '../public');

async function generateIcons() {
  const svgPath = join(publicDir, 'year-line-icon.svg');
  const svgBuffer = readFileSync(svgPath);
  
  console.log('Generating YearLine icons...\n');
  
  for (const size of sizes) {
    const outputPath = join(publicDir, `year-line-icon-${size}x${size}.png`);
    
    await sharp(svgBuffer, {
      density: 300 // High DPI for better quality
    })
      .resize(size, size, {
        kernel: 'lanczos3', // Best quality scaling
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        quality: 100
      })
      .toFile(outputPath);
    
    console.log(`✓ Generated: year-line-icon-${size}x${size}.png`);
  }
  
  // Also generate logo192 and logo512 for manifest
  await sharp(svgBuffer, {
    density: 300
  })
    .resize(192, 192, {
      kernel: 'lanczos3',
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      quality: 100
    })
    .toFile(join(publicDir, 'logo192-yearline.png'));
  console.log('✓ Generated: logo192-yearline.png');
  
  await sharp(svgBuffer, {
    density: 300
  })
    .resize(512, 512, {
      kernel: 'lanczos3',
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      quality: 100
    })
    .toFile(join(publicDir, 'logo512-yearline.png'));
  console.log('✓ Generated: logo512-yearline.png');
  
  // Generate favicon (48x48 for better quality)
  await sharp(svgBuffer, {
    density: 300
  })
    .resize(48, 48, {
      kernel: 'lanczos3',
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      quality: 100
    })
    .toFile(join(publicDir, 'favicon-yearline.png'));
  console.log('✓ Generated: favicon-yearline.png');
  
  console.log('\n✅ All icons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Review the generated icons in /public');
  console.log('2. Update manifest.json to use new icons');
  console.log('3. Convert favicon-yearline.png to .ico if needed');
}

generateIcons().catch(console.error);
