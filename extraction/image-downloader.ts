import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DownloadResult {
  number: string;
  originalUrl: string;
  savedPath: string;
  resolution: 'original' | 'high' | 'fallback';
  width?: number;
  height?: number;
  fileSize: number;
  hasExif: boolean;
  error?: string;
}

interface DownloadReport {
  startedAt: string;
  completedAt: string;
  totalImages: number;
  successful: number;
  failed: number;
  originalResolution: number;
  fallbackResolution: number;
  results: DownloadResult[];
}

/**
 * Convert Google image URL to try original resolution
 */
function getOriginalUrl(url: string): string {
  // Try =d parameter for original file with EXIF
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=[wsh]\d*$/, '=d').replace(/=s0$/, '=d');
  }
  return url;
}

/**
 * Convert Google image URL to high-res fallback (1280px)
 */
function getFallbackUrl(url: string): string {
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=[wshd]\d*$/, '=w1280').replace(/=d$/, '=w1280').replace(/=s0$/, '=w1280');
  }
  return url;
}

/**
 * Check if response is an image (not HTML error page)
 */
function isImageResponse(buffer: Buffer): boolean {
  // Check for JPEG magic bytes
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return true;
  // Check for PNG magic bytes
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // Check for WebP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return true;
  return false;
}

/**
 * Check if buffer contains EXIF data
 */
function hasExifData(buffer: Buffer): boolean {
  // EXIF marker is 0xFF 0xE1 followed by "Exif"
  const exifMarker = buffer.indexOf(Buffer.from([0xFF, 0xE1]));
  if (exifMarker === -1) return false;
  const exifString = buffer.slice(exifMarker + 4, exifMarker + 8).toString();
  return exifString === 'Exif';
}

/**
 * Get basic image dimensions from JPEG header
 */
function getJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  // Look for SOF0 marker (0xFF 0xC0) which contains dimensions
  for (let i = 0; i < buffer.length - 10; i++) {
    if (buffer[i] === 0xFF && (buffer[i + 1] === 0xC0 || buffer[i + 1] === 0xC2)) {
      const height = (buffer[i + 5] << 8) | buffer[i + 6];
      const width = (buffer[i + 7] << 8) | buffer[i + 8];
      return { width, height };
    }
  }
  return null;
}

/**
 * Download a single image with fallback logic
 */
async function downloadImage(
  imageUrl: string,
  photoNumber: string,
  outputDir: string
): Promise<DownloadResult> {
  const result: DownloadResult = {
    number: photoNumber,
    originalUrl: imageUrl,
    savedPath: '',
    resolution: 'fallback',
    fileSize: 0,
    hasExif: false,
  };

  // Try original resolution first
  const originalUrl = getOriginalUrl(imageUrl);

  try {
    console.log(`  Trying original resolution for ${photoNumber}...`);
    const originalResponse = await fetch(originalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (originalResponse.ok) {
      const buffer = Buffer.from(await originalResponse.arrayBuffer());

      if (isImageResponse(buffer)) {
        result.resolution = 'original';
        result.hasExif = hasExifData(buffer);
        result.fileSize = buffer.length;

        const dimensions = getJpegDimensions(buffer);
        if (dimensions) {
          result.width = dimensions.width;
          result.height = dimensions.height;
        }

        const filename = `${photoNumber}-original.jpg`;
        result.savedPath = path.join(outputDir, filename);
        fs.writeFileSync(result.savedPath, buffer);

        console.log(`  ✅ Original: ${result.width}x${result.height}, ${(result.fileSize / 1024).toFixed(0)}KB, EXIF: ${result.hasExif}`);
        return result;
      }
    }
  } catch (error) {
    // Original failed, will try fallback
  }

  // Try fallback resolution
  const fallbackUrl = getFallbackUrl(imageUrl);

  try {
    console.log(`  Trying fallback resolution for ${photoNumber}...`);
    const fallbackResponse = await fetch(fallbackUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (fallbackResponse.ok) {
      const buffer = Buffer.from(await fallbackResponse.arrayBuffer());

      if (isImageResponse(buffer)) {
        result.resolution = 'fallback';
        result.hasExif = hasExifData(buffer);
        result.fileSize = buffer.length;

        const dimensions = getJpegDimensions(buffer);
        if (dimensions) {
          result.width = dimensions.width;
          result.height = dimensions.height;
        }

        const filename = `${photoNumber}.jpg`;
        result.savedPath = path.join(outputDir, filename);
        fs.writeFileSync(result.savedPath, buffer);

        console.log(`  ✅ Fallback: ${result.width}x${result.height}, ${(result.fileSize / 1024).toFixed(0)}KB`);
        return result;
      }
    }

    result.error = 'Both original and fallback failed';
    console.log(`  ❌ Failed: ${result.error}`);
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ❌ Error: ${result.error}`);
  }

  return result;
}

/**
 * Download all images from parsed photo data
 */
async function downloadAllImages(parsedDir: string, outputDir: string): Promise<DownloadReport> {
  const report: DownloadReport = {
    startedAt: new Date().toISOString(),
    completedAt: '',
    totalImages: 0,
    successful: 0,
    failed: 0,
    originalResolution: 0,
    fallbackResolution: 0,
    results: [],
  };

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find all parsed photo JSON files
  const files = fs.readdirSync(parsedDir).filter(f => f.startsWith('photos-') && f.endsWith('.json'));

  console.log(`Found ${files.length} photo batch files to process`);

  for (const file of files) {
    const filePath = path.join(parsedDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!data.photos || !Array.isArray(data.photos)) continue;

    console.log(`\nProcessing ${file} (${data.photos.length} photos)`);

    for (const photo of data.photos) {
      if (!photo.imageUrl) continue;

      report.totalImages++;
      console.log(`\n[${report.totalImages}] Photo ${photo.number}`);

      const result = await downloadImage(photo.imageUrl, photo.number, outputDir);
      report.results.push(result);

      if (result.error) {
        report.failed++;
      } else {
        report.successful++;
        if (result.resolution === 'original') {
          report.originalResolution++;
        } else {
          report.fallbackResolution++;
        }
      }

      // Small delay to be polite to Google's servers
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  report.completedAt = new Date().toISOString();
  return report;
}

// Main execution
async function main(): Promise<void> {
  const parsedDir = path.join(__dirname, 'data', 'parsed');
  const outputDir = path.join(__dirname, 'data', 'images');
  const reportsDir = path.join(__dirname, 'reports');

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  console.log('Starting image download...');
  console.log(`Source: ${parsedDir}`);
  console.log(`Output: ${outputDir}`);

  const report = await downloadAllImages(parsedDir, outputDir);

  // Save report
  const reportPath = path.join(reportsDir, `download-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n========================================');
  console.log('Download Complete!');
  console.log('========================================');
  console.log(`Total images: ${report.totalImages}`);
  console.log(`Successful: ${report.successful}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Original resolution: ${report.originalResolution}`);
  console.log(`Fallback (1280px): ${report.fallbackResolution}`);
  console.log(`Report saved: ${reportPath}`);
}

main().catch(console.error);
