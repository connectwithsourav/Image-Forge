/**
 * Helper to process images, convert formats, handle EXIF, etc.
 */
import heic2any from 'heic2any';
import imageCompression from 'browser-image-compression';

export type ProcessOptions = {
  action: 'compress' | 'convert' | 'resize' | 'watermark';
  // shared
  format?: string;       // image/jpeg, image/png, image/webp
  quality?: number;      // 0.1 to 1.0 (for jpeg/webp)
  // compress
  maxSizeKB?: number;
  // resize
  width?: number;
  height?: number;
  aspectCrop?: boolean;  // useful for profile pics
  // watermark
  watermarkText?: string;
  watermarkColor?: string;
  watermarkOpacity?: number;
};

// Common conversion logic via Canvas
export const processImage = async (file: File, options: ProcessOptions): Promise<File> => {
  let blob = file;
  
  // HEIC support
  if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
    const converted = await heic2any({ blob: file, toType: 'image/jpeg' });
    blob = new File([Array.isArray(converted) ? converted[0] : converted], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
  }

  // Action: Compress
  if (options.action === 'compress') {
    if (options.format === 'image/png' && options.maxSizeKB) {
      const imageBitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get Canvas context');
      
      const targetBytes = options.maxSizeKB * 1024;

      // First, try with factor 1.0
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      ctx.drawImage(imageBitmap, 0, 0);
      const originalPngBlob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/png')
      );

      if (originalPngBlob && originalPngBlob.size <= targetBytes) {
        return new File([originalPngBlob], replaceExtension(blob.name, 'image/png'), { type: 'image/png' });
      }

      let bestFile: File | null = null;
      let low = 0.01;
      let high = 1.0;
      
      for (let i = 0; i < 10; i++) {
        const factor = (low + high) / 2;
        canvas.width = Math.max(1, Math.floor(imageBitmap.width * factor));
        canvas.height = Math.max(1, Math.floor(imageBitmap.height * factor));
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
        
        const generatedBlob = await new Promise<Blob | null>((resolve) => 
          canvas.toBlob(resolve, 'image/png')
        );
        
        if (!generatedBlob) break;
        
        const currentFile = new File([generatedBlob], replaceExtension(blob.name, 'image/png'), { type: 'image/png' });
        
        if (generatedBlob.size <= targetBytes) {
          bestFile = currentFile;
          low = factor; // Can try a bit larger (better resolution)
        } else {
          high = factor; // Too big, must go smaller
        }
      }
      
      return bestFile || (originalPngBlob ? new File([originalPngBlob], replaceExtension(blob.name, 'image/png'), { type: 'image/png' }) : file);
    } else {
      const compressedBlob = await imageCompression(blob, {
        maxSizeMB: options.maxSizeKB ? options.maxSizeKB / 1024 : 1, // Default, can be configurable
        maxWidthOrHeight: options.width || 1920,
        useWebWorker: true,
        initialQuality: options.quality || 0.8,
        fileType: options.format || blob.type
      });
      return new File([compressedBlob], replaceExtension(blob.name, options.format || blob.type), { type: compressedBlob.type });
    }
  }

  // Canvas based actions: Convert, Resize, Crop
  const imageBitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get Canvas context');

  let targetWidth = imageBitmap.width;
  let targetHeight = imageBitmap.height;

  // Resizing logic
  if (options.action === 'resize' || options.action === 'convert') {
    if (options.width && !options.height) {
      const ratio = options.width / imageBitmap.width;
      targetWidth = options.width;
      targetHeight = imageBitmap.height * ratio;
    } else if (options.height && !options.width) {
      const ratio = options.height / imageBitmap.height;
      targetHeight = options.height;
      targetWidth = imageBitmap.width * ratio;
    } else if (options.width && options.height) {
      targetWidth = options.width;
      targetHeight = options.height;
    }

    if (options.aspectCrop && options.width && options.height) {
      // Profile pic crop style: cover the bounding box, centered
      canvas.width = options.width;
      canvas.height = options.height;
      
      const aspectImg = imageBitmap.width / imageBitmap.height;
      const aspectBox = options.width / options.height;
      
      let drawWidth = options.width;
      let drawHeight = options.height;
      let offsetX = 0;
      let offsetY = 0;

      if (aspectImg > aspectBox) {
        // Image is wider
        drawWidth = options.height * aspectImg;
        offsetX = (options.width - drawWidth) / 2;
      } else {
        // Image is taller
        drawHeight = options.width / aspectImg;
        offsetY = (options.height - drawHeight) / 2;
      }
      
      // Draw standard and skip normal draw
      ctx.drawImage(imageBitmap, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    }
  } else {
    // Just watermark
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.drawImage(imageBitmap, 0, 0);
  }

  // Action: Watermark
  if (options.action === 'watermark' && options.watermarkText) {
    ctx.globalAlpha = options.watermarkOpacity ?? 0.5;
    ctx.fillStyle = options.watermarkColor ?? '#ffffff';
    ctx.font = `bold ${Math.max(16, targetHeight * 0.05)}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    
    // Draw in bottom right corner with padding
    const padding = targetHeight * 0.05;
    ctx.fillText(options.watermarkText, targetWidth - padding, targetHeight - padding);
    ctx.globalAlpha = 1.0;
  }

  // Export
  return new Promise((resolve, reject) => {
    const mimeType = options.format || blob.type;
    canvas.toBlob((outBlob) => {
      if (!outBlob) {
        reject(new Error('Canvas export failed'));
        return;
      }
      resolve(new File([outBlob], replaceExtension(blob.name, mimeType), { type: mimeType }));
    }, mimeType, options.quality ?? 0.9);
  });
};

export const replaceExtension = (filename: string, mimeType: string) => {
  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  const base = filename.replace(/\.[^/.]+$/, "");
  return `${base}${extMap[mimeType] || '.img'}`;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type: mime});
};
