import { useState, useCallback, useRef } from 'react';
import ReactCrop, { type PixelCrop } from 'react-image-crop';
import { processProductImage } from '@/lib/processProductImage';
import { X } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageUrl: string;
  fileName: string;
  onCropComplete: (file: File) => void;
  onCancel: () => void;
}

export function ImageCropper({ imageUrl, fileName, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<PixelCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleApplyCrop = useCallback(async () => {
    if (!imgRef.current) return;

    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelCrop = completedCrop
      ? {
          x: Math.round(completedCrop.x * scaleX),
          y: Math.round(completedCrop.y * scaleY),
          width: Math.round(completedCrop.width * scaleX),
          height: Math.round(completedCrop.height * scaleY),
        }
      : {
          x: 0,
          y: 0,
          width: image.naturalWidth,
          height: image.naturalHeight,
        };

    const safeCrop = {
      x: Math.max(0, Math.min(pixelCrop.x, image.naturalWidth - 1)),
      y: Math.max(0, Math.min(pixelCrop.y, image.naturalHeight - 1)),
      width: Math.max(1, Math.min(pixelCrop.width, image.naturalWidth - pixelCrop.x)),
      height: Math.max(1, Math.min(pixelCrop.height, image.naturalHeight - pixelCrop.y)),
    };

    const canvas = document.createElement('canvas');
    canvas.width = safeCrop.width;
    canvas.height = safeCrop.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
      image,
      safeCrop.x, safeCrop.y,
      safeCrop.width, safeCrop.height,
      0, 0,
      safeCrop.width, safeCrop.height,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/png');
    });
    const croppedFile = new File([blob], fileName.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' });
    const finalFile = await processProductImage(croppedFile);
    onCropComplete(finalFile);
  }, [completedCrop, fileName, onCropComplete]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">Recortar imagen</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="relative w-full bg-gray-900 flex items-center justify-center overflow-auto max-h-[450px]">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            ruleOfThirds
          >
            <img ref={imgRef} src={imageUrl} alt="Vista previa para recortar" className="max-w-full" />
          </ReactCrop>
        </div>

        <div className="flex gap-3 px-4 py-3 bg-gray-50 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleApplyCrop} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Aplicar recorte
          </button>
        </div>
      </div>
    </div>
  );
}
