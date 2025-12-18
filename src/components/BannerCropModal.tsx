import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, RotateCcw, Check, Plus, Minus, Upload, Move, Smartphone, Settings } from 'lucide-react';

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

interface BannerCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
  onImageUpload?: (imageFile: File) => void;
  title?: string;
  restaurantName?: string;
  logoImage?: string;
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

  // Create canvas with banner dimensions (21:9 aspect ratio - ultra-wide)
  // Optimized for modern banner displays
  const bannerWidth = 2100;
  const bannerHeight = 900;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = bannerWidth;
  canvas.height = bannerHeight;

  // Set canvas context properties for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Apply rotation if needed
  if (rotation !== 0) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  // Draw the cropped image with high quality
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  if (rotation !== 0) {
    ctx.restore();
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Canvas toBlob failed');
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.95);
  });
};

const BannerCropModal: React.FC<BannerCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  onImageUpload,
  title = "Ajustar Banner",
  restaurantName = "Mi Restaurante",
  logoImage
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState<string>('');

  // Reset values when modal opens
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen]);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
      // Generate preview automatically on crop change
      generatePreview(croppedAreaPixels);
    },
    [imageSrc, rotation]
  );

  const generatePreview = useCallback(async (pixels?: Area) => {
    if (!imageSrc || !croppedAreaPixels && !pixels) return;

    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        pixels || croppedAreaPixels!,
        rotation
      );
      setPreviewImageSrc(croppedImage);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  }, [imageSrc, croppedAreaPixels, rotation]);

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) return;

    try {
      setIsCropping(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onSave(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error al procesar la imagen');
    } finally {
      setIsCropping(false);
    }
  }, [imageSrc, croppedAreaPixels, rotation, onSave, onClose]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-3">
            {imageSrc && (
              <button
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  showMobilePreview
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Preview móvil
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {!imageSrc ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona una imagen para el banner
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Formatos soportados: JPG, PNG. Tamaño recomendado: 2100x900px o superior (21:9)
                </p>
                <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-custom-green-600 hover:bg-custom-green-700 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar imagen
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className={`${showMobilePreview ? 'grid grid-cols-2 gap-6' : 'block'}`}>
              {/* Crop Section */}
              <div>
                {/* Crop Area */}
                <div className="relative mb-4">
                  <div className="w-full h-80 relative bg-gray-100 rounded-lg overflow-hidden">
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      rotation={rotation}
                      aspect={21/9} // 21:9 aspect ratio for ultra-wide banner
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      onRotationChange={setRotation}
                      cropShape="rect"
                      showGrid={true}
                      zoomWithScroll={true}
                      restrictPosition={false}
                      style={{
                        cropAreaStyle: {
                          borderRadius: 0,
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.5)'
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  {/* Zoom Control */}
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700 w-20">
                      Zoom:
                    </label>
                    <div className="flex items-center space-x-2 flex-1">
                      <button
                        onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-gray-600 w-12">
                        {zoom.toFixed(1)}x
                      </span>
                    </div>
                  </div>

                  {/* Rotation Control */}
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700 w-20">
                      Rotación:
                    </label>
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="range"
                        value={rotation}
                        min={-180}
                        max={180}
                        step={1}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 w-12">
                        {rotation}°
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={resetCrop}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Resetear
                      </button>

                      <label className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Cambiar imagen
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isCropping || !croppedAreaPixels}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-custom-green-600 hover:bg-custom-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isCropping ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Guardar banner
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Preview Section */}
              {showMobilePreview && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Vista previa móvil</h4>
                  <div className="relative w-full max-w-[300px] mx-auto">
                    {/* Mobile frame with preview */}
                    <div className="relative">
                      {/* Phone frame image */}
                      <img
                        src="/frame.webp"
                        alt="Mobile Frame"
                        className="w-full h-auto relative z-10"
                      />

                      {/* Preview content overlay */}
                      <div className="absolute inset-0 z-20" style={{
                        top: '4.2%',
                        left: '6%',
                        right: '4.5%',
                        bottom: '2.4%'
                      }}>
                        <div className="bg-white rounded-[50px] overflow-hidden h-full">
                          <div className="relative bg-white rounded-[30px] overflow-y-auto h-full scrollbar-hide">
                            {/* Preview banner image */}
                            <img
                              src={previewImageSrc || imageSrc}
                              alt="Banner Preview"
                              className="absolute top-0 left-0 w-full h-72 object-cover z-0"
                            />

                            <main className="mt-56 relative z-10">
                              <div className="bg-white rounded-t-3xl flex flex-col items-center px-4 min-h-full pb-8">
                                <div className="mt-4 flex items-start justify-between w-full">
                                  {/* Settings Icon */}
                                  <div className="bg-white rounded-full p-1 border border-gray-400 shadow-sm">
                                    <Settings className="size-4 text-stone-800" strokeWidth={1.5} />
                                  </div>
                                  {/* Assistant Icon placeholder */}
                                  <div className="bg-white rounded-full text-black border border-gray-400 size-8 shadow-sm flex items-center justify-center overflow-hidden">
                                    <video
                                      src="/video-icon-pepper.webm"
                                      autoPlay
                                      loop
                                      muted
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  </div>
                                </div>

                                {/* Restaurant info */}
                                <div className="mb-3 flex flex-col items-center">
                                  <div className="size-20 rounded-full bg-gray-200 overflow-hidden border border-gray-400 shadow-sm">
                                    <img
                                      src={logoImage || "https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg"}
                                      alt="Restaurant Logo"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <h1 className="text-black text-xl font-medium mt-2 mb-4">
                                    {restaurantName}
                                  </h1>
                                </div>

                                {/* Preview content */}
                                <div className="text-center text-gray-500 text-sm">
                                  <p>Vista previa del banner</p>
                                  <p className="mt-2">Ajusta la imagen arriba para ver los cambios</p>
                                </div>
                              </div>
                            </main>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerCropModal;