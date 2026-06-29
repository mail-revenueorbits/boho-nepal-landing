import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = './public';

const imagesToOptimize = [
  'Lifestyle shot 1.png',
  'Lifestyle shot 2.png',
  'Lifestyle shot 3.png',
  'Product Shot.png',
  'White Background Product Shot.png'
];

async function optimize() {
  console.log('Starting image optimization process...');
  let totalSaved = 0;

  for (const filename of imagesToOptimize) {
    const inputPath = path.join(publicDir, filename);
    const outputFilename = filename.replace(/\.png$/, '.webp');
    const outputPath = path.join(publicDir, outputFilename);

    if (fs.existsSync(inputPath)) {
      const stats = fs.statSync(inputPath);
      const originalSize = stats.size;
      console.log(`Optimizing ${filename} (${(originalSize / 1024 / 1024).toFixed(2)} MB)...`);

      try {
        await sharp(inputPath)
          .webp({ quality: 82, effort: 6 }) // 82% quality with maximum compression effort
          .toFile(outputPath);

        const newStats = fs.statSync(outputPath);
        const compressedSize = newStats.size;
        const savedBytes = originalSize - compressedSize;
        totalSaved += savedBytes;

        console.log(`Success! Saved to ${outputFilename}`);
        console.log(`Size: ${(compressedSize / 1024).toFixed(1)} KB (Saved: ${((savedBytes / originalSize) * 100).toFixed(1)}%)`);

        // Delete the original massive PNG file to free up space
        fs.unlinkSync(inputPath);
        console.log(`Deleted original PNG: ${filename}\n`);
      } catch (err) {
        console.error(`Error optimizing ${filename}:`, err);
      }
    } else {
      console.log(`File not found, skipping: ${filename}`);
    }
  }

  console.log(`Image optimization complete!`);
  console.log(`Total storage space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
}

optimize();
