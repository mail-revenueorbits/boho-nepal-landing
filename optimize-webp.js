import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = './public';

const imagesToOptimize = [
  'Lifestyle shot 1.webp',
  'Lifestyle shot 2.webp',
  'Lifestyle shot 3.webp',
  'Product Shot.webp',
  'White Background Product Shot.webp'
];

async function optimize() {
  console.log('Starting WebP image compression and resizing...');
  let totalSaved = 0;

  for (const filename of imagesToOptimize) {
    const inputPath = path.join(publicDir, filename);
    const tempPath = path.join(publicDir, 'temp-' + filename);

    if (fs.existsSync(inputPath)) {
      const stats = fs.statSync(inputPath);
      const originalSize = stats.size;
      console.log(`Processing ${filename} (${(originalSize / 1024).toFixed(1)} KB)...`);

      try {
        // Read file into memory as a buffer to prevent Windows EBUSY file locks
        const buffer = fs.readFileSync(inputPath);

        // Resize to maximum 800px width (retina mobile screen resolution) and compress with WebP high efficiency
        await sharp(buffer)
          .resize({ width: 800, withoutEnlargement: true }) 
          .webp({ quality: 75, effort: 6 }) 
          .toFile(tempPath);

        const newStats = fs.statSync(tempPath);
        const compressedSize = newStats.size;

        if (compressedSize < originalSize) {
          const savedBytes = originalSize - compressedSize;
          totalSaved += savedBytes;

          // Replace original with compressed temp file
          fs.unlinkSync(inputPath);
          fs.renameSync(tempPath, inputPath);

          console.log(`Success! Saved ${(savedBytes / 1024).toFixed(1)} KB (${((savedBytes / originalSize) * 100).toFixed(1)}% smaller)`);
          console.log(`New size: ${(compressedSize / 1024).toFixed(1)} KB\n`);
        } else {
          console.log(`Compressed file was larger, keeping original.\n`);
          fs.unlinkSync(tempPath);
        }
      } catch (err) {
        console.error(`Error optimizing ${filename}:`, err);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    } else {
      console.log(`File not found: ${filename}`);
    }
  }

  console.log(`WebP compression complete!`);
  console.log(`Total storage space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
}

optimize();
