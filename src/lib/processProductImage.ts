const MIN_SQUARE_SIZE = 1000;
const JPEG_QUALITY = 0.96;

interface ProcessProductImageOptions {
  minSquareSize?: number;
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
}

export function processProductImage(
  file: File,
  options: ProcessProductImageOptions = {},
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const squareSize = Math.max(
        options.minSquareSize ?? MIN_SQUARE_SIZE,
        img.width,
        img.height,
      );
      const outputType = options.outputType ?? 'image/jpeg';
      const outputExtension = outputType === 'image/png'
        ? 'png'
        : outputType === 'image/webp'
          ? 'webp'
          : 'jpg';

      const canvas = document.createElement('canvas');
      canvas.width = squareSize;
      canvas.height = squareSize;
      const ctx = canvas.getContext('2d')!;

      // white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, squareSize, squareSize);

      // Keep original resolution and only pad to a square canvas when needed.
      const x = (squareSize - img.width) / 2;
      const y = (squareSize - img.height) / 2;
      ctx.drawImage(img, x, y, img.width, img.height);

      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          const name = file.name.replace(/\.[^.]+$/, '') + `.${outputExtension}`;
          resolve(new File([blob], name, { type: outputType }));
        },
        outputType,
        options.quality ?? JPEG_QUALITY,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}
