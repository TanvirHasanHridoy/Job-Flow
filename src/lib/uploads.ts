/**
 * Size and type checks for user uploads.
 */

export const MAX_PDF_BYTES = 5 * 1024 * 1024;   // 5 MB
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB (decoded)

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

/**
 * Validates an uploaded PDF file. Returns the file bytes, or an error message.
 */
export async function readPdfUpload(file: File | null): Promise<{ buffer: Buffer } | { error: string; status: number }> {
  if (!file || typeof file === 'string') {
    return { error: 'No PDF file was uploaded.', status: 400 };
  }
  if (file.size > MAX_PDF_BYTES) {
    return { error: 'The PDF is too large. Please upload a file under 5 MB.', status: 413 };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  // Check the file signature rather than trusting the browser-reported MIME type.
  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return { error: 'This file is not a valid PDF document.', status: 415 };
  }
  return { buffer };
}

/**
 * Validates a photo/signature value: empty, or a base64 data URI of an allowed
 * image type within MAX_IMAGE_BYTES. Returns an error message or null.
 */
export function validateImageDataUri(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return `${label} has an invalid format.`;

  const match = value.match(/^data:([a-z0-9.+/-]+);base64,/i);
  if (!match) return `${label} must be an uploaded image (PNG, JPG, WebP or GIF).`;
  if (!ALLOWED_IMAGE_TYPES.includes(match[1].toLowerCase())) {
    return `${label} must be a PNG, JPG, WebP or GIF image.`;
  }
  const base64Length = value.length - match[0].length;
  const decodedBytes = Math.floor((base64Length * 3) / 4);
  if (decodedBytes > MAX_IMAGE_BYTES) {
    return `${label} is too large. Please use an image under 2 MB.`;
  }
  return null;
}
