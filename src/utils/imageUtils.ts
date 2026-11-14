/**
 * Utility functions for user avatar photo validation, cropping, and resizing.
 */

export interface ProcessAvatarResult {
  dataUrl: string;
  width: number;
  height: number;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateAvatarFile(file: File): string | null {
  const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const isTypeValid = ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(fileExt);

  if (!isTypeValid) {
    return 'Invalid file type. Please upload a JPG, PNG, or WebP image.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File size exceeds 5MB limit. Please choose a smaller image.';
  }

  return null;
}

/**
 * Auto-crops the image to a centered square and resizes to max 512x512.
 * Returns a base64 Data URL.
 */
export async function processAvatarFile(file: File): Promise<string> {
  const validationError = validateAvatarFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file. Please try again.'));
    };

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Invalid image file data.'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        reject(new Error('Failed to parse image. Please select another file.'));
      };

      img.onload = () => {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        if (!naturalWidth || !naturalHeight) {
          reject(new Error('Could not determine image dimensions.'));
          return;
        }

        // 1. Calculate centered square crop coordinates
        const squareSize = Math.min(naturalWidth, naturalHeight);
        const sourceX = (naturalWidth - squareSize) / 2;
        const sourceY = (naturalHeight - squareSize) / 2;

        // 2. Target dimensions: max 512x512
        const targetDimension = Math.min(squareSize, 512);

        // 3. Render into canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetDimension;
        canvas.height = targetDimension;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context is not available for image processing.'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          squareSize,
          squareSize,
          0,
          0,
          targetDimension,
          targetDimension
        );

        // 4. Encode to high-quality format (preserve PNG if transparent, otherwise JPEG/WebP)
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.92);
        resolve(dataUrl);
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}
