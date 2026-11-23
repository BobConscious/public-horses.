import sharp from 'sharp';
import { listingImageAltLimit, listingImageLimit } from '../shared/listing-image.js';
import { HttpError, requireThat, text } from './validation.js';

const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const jpegHeader = Buffer.from([255, 216, 255]);
const fileFormatError = 'Choose a static JPEG, PNG, or WebP image.';

function imageFormat(bytes) {
  if (bytes.subarray(0, 3).equals(jpegHeader)) return 'jpeg';
  if (bytes.subarray(0, 8).equals(pngHeader)) return 'png';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

function isAnimated(bytes, format) {
  if (format === 'png') {
    // APNG uses an animation-control chunk. The decoder can otherwise treat it as a still.
    for (let offset = 8; offset + 12 <= bytes.length; offset += 12 + bytes.readUInt32BE(offset)) {
      const type = bytes.toString('ascii', offset + 4, offset + 8);
      if (type === 'acTL') return true;
      if (type === 'IEND') break;
    }
  }
  return format === 'webp' && bytes.toString('ascii', 12, 16) === 'VP8X' && (bytes[20] & 0x02) !== 0;
}

export async function listingImageInput(value) {
  if (value == null) return value;
  requireThat(typeof value === 'object' && !Array.isArray(value), 400, 'Choose an image file.');
  const alt = text(value.alt, 'Image description', listingImageAltLimit);
  const { data } = value;
  if (data === undefined) return { alt };
  requireThat(typeof data === 'string' && data.length > 0, 400, 'Choose an image file.');
  const sizeError = 'Choose an image no larger than 2 MB.';
  requireThat(data.length <= 4 * Math.ceil(listingImageLimit / 3), 413, sizeError);
  const original = Buffer.from(data, 'base64');
  requireThat(original.length <= listingImageLimit, 413, sizeError);
  requireThat(original.toString('base64') === data, 400, 'Choose a valid image file.');
  const format = imageFormat(original);
  requireThat(format && !isAnimated(original, format), 400, fileFormatError);

  try {
    const image = sharp(original, { limitInputPixels: 24_000_000 });
    const metadata = await image.metadata();
    requireThat(metadata.format === format && (metadata.pages ?? 1) === 1, 400, fileFormatError);
    const bytes = await image.autoOrient()
      .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer();
    return { alt, bytes };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Choose a valid image no larger than 24 megapixels.');
  }
}
