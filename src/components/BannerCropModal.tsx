import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, RotateCcw, Check, Plus, Minus, Upload, Move, Smartphone, Settings, Monitor } from 'lucide-react';

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

// Nueva función para crear imagen optimizada para vista móvil
const getMobileCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> => {
  const image = await createImage(imageSrc);

  // Dimensiones que simulan exactamente cómo se ve en flexbill móvil
  // Usa las medidas reales de dispositivos móviles
  const mobileWidth = 375; // Ancho estándar de móvil
  const mobileHeight = 200; // Altura real del banner en móvil (375:200 ratio)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = mobileWidth;
  canvas.height = mobileHeight;

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

  // Draw the cropped image optimized for mobile viewing
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
    }, 'image/jpeg', 0.9);
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
  // Modo actual (desktop o mobile)
  const [editMode, setEditMode] = useState<'desktop' | 'mobile'>('desktop');

  // Estados para Desktop
  const [desktopCrop, setDesktopCrop] = useState<Point>({ x: 0, y: 0 });
  const [desktopZoom, setDesktopZoom] = useState(1);
  const [desktopRotation, setDesktopRotation] = useState(0);
  const [desktopCroppedAreaPixels, setDesktopCroppedAreaPixels] = useState<Area | null>(null);

  // Estados para Mobile
  const [mobileCrop, setMobileCrop] = useState<Point>({ x: 0, y: 0 });
  const [mobileZoom, setMobileZoom] = useState(1);
  const [mobileRotation, setMobileRotation] = useState(0);
  const [mobileCroppedAreaPixels, setMobileCroppedAreaPixels] = useState<Area | null>(null);

  // Estados generales
  const [isCropping, setIsCropping] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState<string>('');
  const [mobilePreviewSrc, setMobilePreviewSrc] = useState<string>(''); // Vista previa específica para móvil

  // Estados dinámicos basados en el modo actual
  const currentCrop = editMode === 'desktop' ? desktopCrop : mobileCrop;
  const currentZoom = editMode === 'desktop' ? desktopZoom : mobileZoom;
  const currentRotation = editMode === 'desktop' ? desktopRotation : mobileRotation;
  const currentCroppedAreaPixels = editMode === 'desktop' ? desktopCroppedAreaPixels : mobileCroppedAreaPixels;

  // Reset values when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset desktop mode
      setDesktopCrop({ x: 0, y: 0 });
      setDesktopZoom(1);
      setDesktopRotation(0);
      setDesktopCroppedAreaPixels(null);

      // Reset mobile mode
      setMobileCrop({ x: 0, y: 0 });
      setMobileZoom(1.0); // Zoom inicial estándar para ver mejor el encuadre
      setMobileRotation(0);
      setMobileCroppedAreaPixels(null);

      // Reset general
      setEditMode('desktop');
      setPreviewImageSrc('');
      setMobilePreviewSrc('');
    }
  }, [isOpen]);

  // ✅ UX IMPROVEMENT: Auto-gestionar preview según modo
  useEffect(() => {
    if (editMode === 'mobile') {
      setShowMobilePreview(true); // Activar automáticamente el preview móvil
    } else if (editMode === 'desktop') {
      setShowMobilePreview(false); // Ocultar preview móvil en modo desktop
    }
  }, [editMode]);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      // Actualizar el estado correcto según el modo actual
      if (editMode === 'desktop') {
        setDesktopCroppedAreaPixels(croppedAreaPixels);
      } else {
        setMobileCroppedAreaPixels(croppedAreaPixels);
      }
    },
    [editMode]
  );

  // Función simplificada para generar preview manual (si se necesita)
  const generatePreview = useCallback(async (pixels: Area, mode: 'desktop' | 'mobile' = editMode) => {
    if (!imageSrc || !pixels) return;

    try {
      if (mode === 'desktop') {
        const croppedImage = await getCroppedImg(imageSrc, pixels, desktopRotation);
        setPreviewImageSrc(croppedImage);
      } else {
        const mobileCroppedImage = await getMobileCroppedImg(imageSrc, pixels, mobileRotation);
        setMobilePreviewSrc(mobileCroppedImage);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  }, [imageSrc, editMode, desktopRotation, mobileRotation]);

  // Effect para generar previews cuando cambien los crop areas
  useEffect(() => {
    if (!imageSrc) return;

    // Solo generar preview desktop si hay datos
    if (desktopCroppedAreaPixels) {
      getCroppedImg(imageSrc, desktopCroppedAreaPixels, desktopRotation)
        .then(setPreviewImageSrc)
        .catch(console.error);
    }
  }, [imageSrc, desktopCroppedAreaPixels, desktopRotation]);

  // Effect separado para mobile preview
  useEffect(() => {
    if (!imageSrc) return;

    // Solo generar preview mobile si hay datos
    if (mobileCroppedAreaPixels) {
      getMobileCroppedImg(imageSrc, mobileCroppedAreaPixels, mobileRotation)
        .then(setMobilePreviewSrc)
        .catch(console.error);
    }
  }, [imageSrc, mobileCroppedAreaPixels, mobileRotation]);

  const handleSave = useCallback(async () => {
    // Por defecto guardar el crop desktop, pero si no hay, usar el mobile
    const savePixels = desktopCroppedAreaPixels || mobileCroppedAreaPixels;
    const saveRotation = desktopCroppedAreaPixels ? desktopRotation : mobileRotation;

    if (!savePixels) return;

    try {
      setIsCropping(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        savePixels,
        saveRotation
      );
      onSave(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error al procesar la imagen');
    } finally {
      setIsCropping(false);
    }
  }, [imageSrc, desktopCroppedAreaPixels, mobileCroppedAreaPixels, desktopRotation, mobileRotation, onSave, onClose]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  const resetCrop = () => {
    if (editMode === 'desktop') {
      setDesktopCrop({ x: 0, y: 0 });
      setDesktopZoom(1);
      setDesktopRotation(0);
    } else {
      setMobileCrop({ x: 0, y: 0 });
      setMobileZoom(1.0);
      setMobileRotation(0);
    }
  };

  // Función para cambiar modo y mantener states separados
  const handleModeChange = (newMode: 'desktop' | 'mobile') => {
    setEditMode(newMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>

            {/* Mode Toggle */}
            {imageSrc && (
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 sm:p-1">
                <button
                  onClick={() => handleModeChange('desktop')}
                  className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    editMode === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Desktop</span>
                  <span className="sm:hidden">PC</span>
                </button>
                <button
                  onClick={() => handleModeChange('mobile')}
                  className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    editMode === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  Móvil
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1">
          {!imageSrc ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8">
              <div className="text-center">
                <Upload className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
                <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  Sube tu imagen para el banner
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">
                  Usa toda tu imagen - sin límites de grid.<br className="hidden sm:block"/>
                  <span className="hidden sm:inline">Formatos: JPG, PNG | </span>Recomendado: 2100x900px+ (21:9)
                </p>
                <label className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-custom-green-600 hover:bg-custom-green-700 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4 mr-1.5 sm:mr-2" />
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
            <div className={`${showMobilePreview ? 'flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6' : 'block'}`}>
              {/* Crop Section */}
              <div>
                {/* Info Banner */}
                <div className={`mb-3 sm:mb-4 border rounded-lg p-2 sm:p-3 ${
                  editMode === 'desktop'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-start sm:items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                        editMode === 'desktop'
                          ? 'bg-blue-100'
                          : 'bg-green-100'
                      }`}>
                        {editMode === 'desktop' ? (
                          <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                        ) : (
                          <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    <div className="ml-2 sm:ml-3">
                      <p className={`text-xs sm:text-sm font-medium ${
                        editMode === 'desktop' ? 'text-blue-900' : 'text-green-900'
                      }`}>
                        {editMode === 'desktop'
                          ? 'Modo Desktop - Vista amplia'
                          : 'Modo Móvil - Vista en dispositivos'
                        }
                      </p>
                      <p className={`text-[10px] sm:text-sm hidden sm:block ${
                        editMode === 'desktop' ? 'text-blue-700' : 'text-green-700'
                      }`}>
                        {editMode === 'desktop'
                          ? 'Ajusta tu banner para pantallas grandes (21:9).'
                          : 'La vista previa simula el resultado final en móvil.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Crop Area */}
                <div className="relative mb-3 sm:mb-4">
                  <div className="w-full h-52 sm:h-80 relative bg-gray-100 rounded-lg overflow-hidden">
                    <Cropper
                      image={imageSrc}
                      crop={currentCrop}
                      zoom={currentZoom}
                      rotation={currentRotation}
                      aspect={editMode === 'desktop' ? 21/9 : 375/200} // Desktop: 21:9, Mobile: 375:200 (simula móvil real)
                      onCropChange={editMode === 'desktop' ? setDesktopCrop : setMobileCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={editMode === 'desktop' ? setDesktopZoom : setMobileZoom}
                      onRotationChange={editMode === 'desktop' ? setDesktopRotation : setMobileRotation}
                      cropShape="rect"
                      showGrid={false}
                      zoomWithScroll={true}
                      restrictPosition={false}
                      style={{
                        containerStyle: {
                          backgroundColor: '#f9fafb',
                        },
                        cropAreaStyle: {
                          borderRadius: 8,
                          border: `3px solid ${editMode === 'desktop' ? '#1E40AF' : '#059669'}`,
                          boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.6)'
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Zoom Control */}
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 w-14 sm:w-20">
                      Zoom:
                    </label>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 flex-1">
                      <button
                        onClick={() => {
                          const newZoom = Math.max(1, currentZoom - 0.1);
                          if (editMode === 'desktop') setDesktopZoom(newZoom);
                          else setMobileZoom(newZoom);
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <input
                        type="range"
                        value={currentZoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => {
                          const newZoom = Number(e.target.value);
                          if (editMode === 'desktop') setDesktopZoom(newZoom);
                          else setMobileZoom(newZoom);
                        }}
                        className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => {
                          const newZoom = Math.min(3, currentZoom + 0.1);
                          if (editMode === 'desktop') setDesktopZoom(newZoom);
                          else setMobileZoom(newZoom);
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <span className="text-xs sm:text-sm text-gray-600 w-10 sm:w-12">
                        {currentZoom.toFixed(1)}x
                      </span>
                    </div>
                  </div>

                  {/* Rotation Control */}
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 w-14 sm:w-20">
                      Rotación:
                    </label>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 flex-1">
                      <input
                        type="range"
                        value={currentRotation}
                        min={-180}
                        max={180}
                        step={1}
                        onChange={(e) => {
                          const newRotation = Number(e.target.value);
                          if (editMode === 'desktop') setDesktopRotation(newRotation);
                          else setMobileRotation(newRotation);
                        }}
                        className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm text-gray-600 w-10 sm:w-12">
                        {currentRotation}°
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row flex-wrap items-center justify-between gap-3 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={resetCrop}
                        className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Resetear
                      </button>

                      <label className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                        <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Cambiar imagen</span>
                        <span className="sm:hidden">Cambiar</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={onClose}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isCropping || (!desktopCroppedAreaPixels && !mobileCroppedAreaPixels)}
                        className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-custom-green-600 hover:bg-custom-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isCropping ? (
                          <>
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2"></div>
                            <span className="hidden sm:inline">Procesando...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Guardar banner</span>
                            <span className="sm:hidden">Guardar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Preview Section */}
              {showMobilePreview && (
                <div className="hidden lg:block">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Vista previa móvil</h4>
                  <div className="relative w-full max-w-[240px] lg:max-w-[300px] mx-auto">
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
                        <div className="bg-white rounded-[40px] lg:rounded-[50px] overflow-hidden h-full">
                          <div className="relative bg-white rounded-[24px] lg:rounded-[30px] overflow-y-auto h-full scrollbar-hide">
                            {/* Preview banner image - Simula exactamente flexbill móvil */}
                            <div className="relative w-full h-36 lg:h-48 overflow-hidden banner-preview-mobile">
                              <div
                                className="absolute top-0 left-0 w-full h-full z-0"
                                style={{
                                  backgroundImage: `url(${mobilePreviewSrc || previewImageSrc || imageSrc})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center center',
                                  backgroundRepeat: 'no-repeat',
                                  imageRendering: 'high-quality'
                                }}
                              />
                              {/* Gradient overlay for better text readability */}
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 z-5"></div>

                              {/* Loading indicator while generating mobile preview */}
                              {!mobilePreviewSrc && mobileCroppedAreaPixels && (
                                <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center z-10">
                                  <div className="bg-white rounded-lg p-1.5 lg:p-2 shadow-sm">
                                    <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <main className="relative z-10 -mt-6 lg:-mt-8">
                              <div className="bg-white rounded-t-2xl lg:rounded-t-3xl flex flex-col items-center px-3 lg:px-4 min-h-full pb-6 lg:pb-8">
                                <div className="mt-4 lg:mt-6 flex items-start justify-between w-full">
                                  {/* Settings Icon */}
                                  <div className="bg-white rounded-full p-1 lg:p-1.5 border border-gray-300 shadow-md">
                                    <Settings className="w-3 h-3 lg:size-4 text-stone-800" strokeWidth={1.5} />
                                  </div>
                                  {/* Assistant Icon placeholder */}
                                  <div className="bg-white rounded-full text-black border border-gray-300 w-7 h-7 lg:size-9 shadow-md flex items-center justify-center overflow-hidden">
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
                                <div className="mb-3 lg:mb-4 flex flex-col items-center -mt-1 lg:-mt-2">
                                  <div className="w-14 h-14 lg:size-20 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-lg">
                                    <img
                                      src={logoImage || "https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg"}
                                      alt="Restaurant Logo"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <h1 className="text-black text-sm lg:text-lg font-semibold mt-2 lg:mt-3 mb-0.5 lg:mb-1 text-center truncate max-w-full">
                                    {restaurantName}
                                  </h1>
                                  <p className="text-gray-600 text-[10px] lg:text-xs">Vista en móvil</p>
                                </div>

                                {/* Preview content */}
                                <div className="text-center text-gray-400 text-[10px] lg:text-xs px-2 lg:px-4">
                                  <div className="bg-gray-50 rounded-lg p-2 lg:p-3 mb-2 lg:mb-3">
                                    <p className="font-medium text-gray-700 text-[10px] lg:text-xs">
                                      Simulación Móvil
                                    </p>
                                    <p className="mt-0.5 lg:mt-1 text-[9px] lg:text-xs">
                                      {mobilePreviewSrc
                                        ? "Vista actualizada"
                                        : "Generando..."
                                      }
                                    </p>
                                  </div>
                                  {mobilePreviewSrc ? (
                                    <div className="space-y-1">
                                      <div className="h-1 lg:h-1.5 bg-green-200 rounded w-full"></div>
                                      <div className="h-1 lg:h-1.5 bg-green-200 rounded w-4/5 mx-auto"></div>
                                      <p className="text-green-600 text-[9px] lg:text-xs mt-1 lg:mt-2">
                                        ✓ Listo
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-1 lg:space-y-2">
                                      <div className="h-1.5 lg:h-2 bg-gray-200 rounded w-full animate-pulse"></div>
                                      <div className="h-1.5 lg:h-2 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
                                    </div>
                                  )}
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