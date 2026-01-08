import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, RotateCcw, Check, Plus, Minus, Upload } from 'lucide-react';

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
  onImageUpload?: (imageFile: File) => void;
  title?: string;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> => {
  const image = await createImage(imageSrc);

  // Create final canvas with better size for higher quality
  const finalSize = 300; // Increased from 120 to 300 for better quality
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = finalSize;
  canvas.height = finalSize;

  // Fill with white background to avoid transparency issues
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, finalSize, finalSize);

  // Save the current transformation state
  ctx.save();

  // Move to center for rotation
  ctx.translate(finalSize / 2, finalSize / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  // Calculate the scale factor to fit the crop area into the final size
  const scale = finalSize / Math.max(pixelCrop.width, pixelCrop.height);

  // Calculate source coordinates for the crop
  const sx = pixelCrop.x;
  const sy = pixelCrop.y;
  const sw = pixelCrop.width;
  const sh = pixelCrop.height;

  // Calculate destination coordinates (centered)
  const dx = -finalSize / 2;
  const dy = -finalSize / 2;
  const dw = finalSize;
  const dh = finalSize;

  // Draw the cropped and scaled image directly
  ctx.drawImage(
    image,
    sx, sy, sw, sh,  // Source rectangle (crop area)
    dx, dy, dw, dh   // Destination rectangle (final size, centered)
  );

  // Restore the transformation state
  ctx.restore();

  // Use JPEG with high quality for better compression and quality
  return canvas.toDataURL('image/jpeg', 0.95);
};

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  onImageUpload,
  title = "Ajustar Logo"
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dynamic zoom ranges based on image - Much wider range for noticeable effect
  const [minZoom, setMinZoom] = useState(0.1);
  const [maxZoom] = useState(5);
  const [initialZoom, setInitialZoom] = useState(1);
  const [zoomPercent, setZoomPercent] = useState(0);

  // Calculate dynamic zoom values based on image dimensions
  const calculateZoomValues = useCallback(async (imgSrc: string) => {
    try {
      const img = await createImage(imgSrc);
      const circleDiameter = 400; // Circle diameter for crop area

      // Calculate minimum zoom - allow zoom out but not too extreme
      const minZoomToFill = Math.max(
        circleDiameter / img.naturalWidth,
        circleDiameter / img.naturalHeight
      ) * 0.5; // Reasonable minimum for zoom out

      // Calculate optimal initial zoom to fit image nicely in circle
      // This should show the full image at a good size for editing
      const fitZoom = Math.max(
        circleDiameter / img.naturalWidth,
        circleDiameter / img.naturalHeight
      ) * 1.1; // Slightly larger than fit for better viewing

      const clampedInitialZoom = Math.max(minZoomToFill, Math.min(maxZoom, fitZoom));

      return {
        minZoom: minZoomToFill,
        initialZoom: clampedInitialZoom
      };
    } catch (error) {
      console.error('Error calculating zoom values:', error);
      return { minZoom: 0.5, initialZoom: 1.2 };
    }
  }, [maxZoom]);

  // Convert zoom to percentage (-300% to 300%) for display
  const zoomToPercent = useCallback((zoomValue: number) => {
    if (minZoom === maxZoom) return 0;
    // Map zoom range to -300% to 300% scale
    const midZoom = (minZoom + maxZoom) / 2;
    if (zoomValue <= midZoom) {
      // Map minZoom to midZoom as -300% to 0%
      return ((zoomValue - minZoom) / (midZoom - minZoom)) * 300 - 300;
    } else {
      // Map midZoom to maxZoom as 0% to 300%
      return ((zoomValue - midZoom) / (maxZoom - midZoom)) * 300;
    }
  }, [minZoom, maxZoom]);

  // Convert percentage to actual zoom value
  const percentToZoom = useCallback((percent: number) => {
    const midZoom = (minZoom + maxZoom) / 2;
    if (percent <= 0) {
      // Map -300% to 0% as minZoom to midZoom
      return minZoom + ((percent + 300) / 300) * (midZoom - minZoom);
    } else {
      // Map 0% to 300% as midZoom to maxZoom
      return midZoom + (percent / 300) * (maxZoom - midZoom);
    }
  }, [minZoom, maxZoom]);

  // Reset state when modal opens with new image
  useEffect(() => {
    if (isOpen && imageSrc) {
      setCrop({ x: 0, y: 0 });
      setRotation(0);
      setCroppedAreaPixels(null);

      // Calculate and set dynamic zoom values
      calculateZoomValues(imageSrc).then(({ minZoom: newMinZoom, initialZoom: newInitialZoom }) => {
        setMinZoom(newMinZoom);
        setInitialZoom(newInitialZoom);

        // Use the calculated initial zoom for optimal viewing
        setZoom(newInitialZoom);

        // Calculate percentage based on actual initial zoom
        const midZoom = (newMinZoom + maxZoom) / 2;
        let initialPercent;
        if (newInitialZoom <= midZoom) {
          initialPercent = ((newInitialZoom - newMinZoom) / (midZoom - newMinZoom)) * 300 - 300;
        } else {
          initialPercent = ((newInitialZoom - midZoom) / (maxZoom - midZoom)) * 300;
        }
        setZoomPercent(Math.round(initialPercent));
      });
    }
  }, [isOpen, imageSrc, calculateZoomValues, maxZoom]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onSave(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, rotation, onSave, onClose]);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(initialZoom);
    setZoomPercent(zoomToPercent(initialZoom));
    setRotation(0);
  };

  const handleZoomIn = () => {
    const currentPercent = zoomPercent;
    const newPercent = Math.min(currentPercent + 50, 300); // 50% steps for more dramatic effect
    const newZoom = percentToZoom(newPercent);
    setZoom(newZoom);
    setZoomPercent(newPercent);
  };

  const handleZoomOut = () => {
    const currentPercent = zoomPercent;
    const newPercent = Math.max(currentPercent - 50, -300); // 50% steps for more dramatic effect
    const newZoom = percentToZoom(newPercent);
    setZoom(newZoom);
    setZoomPercent(newPercent);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setZoomPercent(zoomToPercent(newZoom));
  };

  const handlePercentChange = (percent: number) => {
    const newZoom = percentToZoom(percent);
    setZoom(newZoom);
    setZoomPercent(percent);
  };

  const handleUploadImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImageUpload) {
        onImageUpload(file);
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Cropper Container - Larger for bigger circle */}
            <div className="relative bg-gray-50 rounded-lg overflow-hidden" style={{ height: '400px' }}>
              {imageSrc ? (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  restrictPosition={false}
                  minZoom={minZoom}
                  maxZoom={maxZoom}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={handleZoomChange}
                  onRotationChange={setRotation}
                  style={{
                    containerStyle: {
                      backgroundColor: '#f9fafb',
                    },
                    cropAreaStyle: {
                      border: '2px solid #173E44',
                      boxShadow: '0 0 0 9999em rgba(0,0,0,0.5)'
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No hay imagen seleccionada</p>
                    <p className="text-sm mt-2">Usa el botón "Subir imagen" para comenzar</p>
                  </div>
                </div>
              )}

              {/* Zoom Control Buttons - Discrete and minimal */}
              {imageSrc && (
                <div className="absolute bottom-6 right-6 flex flex-col space-y-2">
                  <button
                    onClick={handleZoomIn}
                    disabled={zoomPercent >= 300}
                    className="w-6 h-6 bg-white bg-opacity-95 backdrop-blur-sm hover:bg-opacity-100 text-gray-600 hover:text-gray-800 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Acercar"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomPercent <= -300}
                    className="w-6 h-6 bg-white bg-opacity-95 backdrop-blur-sm hover:bg-opacity-100 text-gray-600 hover:text-gray-800 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Alejar"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Controls */}
            {imageSrc && (
              <div className="mt-4 space-y-4">
                {/* Zoom Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoom: {Math.round(zoomPercent)}%
                  </label>
                  <input
                    type="range"
                    value={zoomPercent}
                    min={-300}
                    max={300}
                    step={20}
                    onChange={(e) => handlePercentChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #173E44 0%, #173E44 ${((zoomPercent + 300) / 600) * 100}%, #d1d5db ${((zoomPercent + 300) / 600) * 100}%, #d1d5db 100%)`
                    }}
                  />
                </div>

                {/* Rotation Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rotación: {rotation}°
                  </label>
                  <input
                    type="range"
                    value={rotation}
                    min={-180}
                    max={180}
                    step={1}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #173E44 0%, #173E44 ${((rotation + 180) / 360) * 100}%, #d1d5db ${((rotation + 180) / 360) * 100}%, #d1d5db 100%)`
                    }}
                  />
                </div>

                {/* Reset Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#173E44]"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restablecer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing || !imageSrc}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#173E44] text-base font-medium text-white hover:bg-[#0f2c31] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#173E44] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </button>
            {onImageUpload && (
              <button
                type="button"
                onClick={handleUploadImage}
                disabled={isProcessing}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#173E44] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir imagen
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#173E44] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;