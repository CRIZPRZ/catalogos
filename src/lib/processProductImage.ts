const TARGET_SIZE = 1000;
const JPEG_QUALITY = 0.92;

export function processProductImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      const ctx = canvas.getContext('2d')!;

      // white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

      // object-contain: scale to fit inside square, centered
      const scale = Math.min(TARGET_SIZE / img.width, TARGET_SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (TARGET_SIZE - w) / 2;
      const y = (TARGET_SIZE - h) / 2;
      ctx.drawImage(img, x, y, w, h);

      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}
