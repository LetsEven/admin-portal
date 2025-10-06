import React, { useState } from 'react';
import { Camera, Edit3, Trash2, Upload, PlusIcon } from 'lucide-react';
import ImageCropModal from './ImageCropModal';

interface RestaurantHeaderProps {
  restaurantName?: string;
  restaurantDescription?: string;
  bannerImage?: string;
  logoImage?: string;
  onUpdateName?: (name: string) => void;
  onUpdateDescription?: (description: string) => void;
  onUpdateBanner?: (image: string) => void;
  onUpdateLogo?: (image: string) => void;
  onAddSectionClick?: () => void;
  onViewMenuClick?: () => void;
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  restaurantName = "Mi Restaurante",
  restaurantDescription = "Descripción del restaurante",
  bannerImage,
  logoImage,
  onUpdateName,
  onUpdateDescription,
  onUpdateBanner,
  onUpdateLogo,
  onAddSectionClick,
  onViewMenuClick
}) => {
  const isNewRestaurant = restaurantName === "Mi Restaurante" && !bannerImage && !logoImage;
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempName, setTempName] = useState(restaurantName);
  const [tempDescription, setTempDescription] = useState(restaurantDescription);

  // Image crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');

  const handleImageUpload = (type: 'banner' | 'logo') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          if (type === 'banner' && onUpdateBanner) {
            // For banner, upload directly without cropping
            onUpdateBanner(imageUrl);
          } else if (type === 'logo') {
            // For logo, open crop modal
            setTempImageSrc(imageUrl);
            setShowCropModal(true);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleImageUploadFromModal = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setTempImageSrc(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = (croppedImage: string) => {
    if (onUpdateLogo) {
      onUpdateLogo(croppedImage);
    }
    setShowCropModal(false);
    setTempImageSrc('');
  };

  const handleCropClose = () => {
    setShowCropModal(false);
    setTempImageSrc('');
  };

  const handleNameSave = () => {
    if (onUpdateName) {
      onUpdateName(tempName);
    }
    setIsEditingName(false);
  };

  const handleDescriptionSave = () => {
    if (onUpdateDescription) {
      onUpdateDescription(tempDescription);
    }
    setIsEditingDescription(false);
  };

  const handleNameCancel = () => {
    setTempName(restaurantName);
    setIsEditingName(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(restaurantDescription);
    setIsEditingDescription(false);
  };

  return (
    <div>
      {/* New Restaurant Setup Banner */}
      {isNewRestaurant && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                ¡Configura tu restaurante!
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                Personaliza la información de tu restaurante para crear una experiencia única.
                Comienza editando el nombre haciendo clic en "Mi Restaurante" más abajo.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center text-blue-600">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                  Edita el nombre del restaurante
                </div>
                <div className="flex items-center text-blue-600">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                  Agrega tu logo
                </div>
                <div className="flex items-center text-blue-600">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                  Sube una imagen de portada
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8 relative">
      {/* Banner Section */}
      <div className="relative h-48 group">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt="Banner del restaurante"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Agregar imagen de portada</p>
            </div>
          </div>
        )}

        {/* Banner Edit Controls */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex space-x-2">
            <button
              onClick={() => handleImageUpload('banner')}
              className="bg-white bg-opacity-90 backdrop-blur-sm hover:bg-opacity-100 text-gray-700 p-2 rounded-lg shadow-md transition-all duration-200"
              title={bannerImage ? "Cambiar imagen" : "Subir imagen"}
            >
              {bannerImage ? <Edit3 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            </button>
            {bannerImage && (
              <button
                onClick={() => onUpdateBanner && onUpdateBanner('')}
                className="bg-white bg-opacity-90 backdrop-blur-sm hover:bg-opacity-100 text-red-600 p-2 rounded-lg shadow-md transition-all duration-200"
                title="Eliminar imagen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Profile Section */}
      <div className="relative px-6 pb-6">
        {/* Logo/Profile Image */}
        <div className="relative -mt-16 mb-4">
          <div className="relative inline-block group">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
              {logoImage ? (
                <img
                  src={logoImage}
                  alt="Logo del restaurante"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Logo Edit Controls */}
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    if (logoImage) {
                      // Si ya hay logo, abrir modal de recorte con imagen actual
                      setTempImageSrc(logoImage);
                      setShowCropModal(true);
                    } else {
                      // Si no hay logo, abrir modal sin imagen (se podrá subir desde ahí)
                      setTempImageSrc('');
                      setShowCropModal(true);
                    }
                  }}
                  className="bg-white text-gray-700 p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
                  title={logoImage ? "Editar logo" : "Subir logo"}
                >
                  {logoImage ? <Edit3 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                </button>
                {logoImage && (
                  <button
                    onClick={() => onUpdateLogo && onUpdateLogo('')}
                    className="bg-white text-red-600 p-2 rounded-full shadow-md hover:bg-red-50 transition-colors duration-200"
                    title="Eliminar logo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="space-y-2">
          {/* Restaurant Name */}
          <div className="group">
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none flex-1"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSave()}
                />
                <button
                  onClick={handleNameSave}
                  className="text-blue-600 hover:text-blue-800 px-2 py-1 text-sm font-medium"
                >
                  Guardar
                </button>
                <button
                  onClick={handleNameCancel}
                  className="text-gray-600 hover:text-gray-800 px-2 py-1 text-sm font-medium"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-gray-900">{restaurantName}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 p-1 rounded transition-all duration-200"
                  title="Editar nombre"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Action Buttons - Positioned freely relative to entire header */}
      <div className="absolute top-52 right-6">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <button
            type="button"
            onClick={onAddSectionClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#173E44] hover:bg-[#0f2c31] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#173E44] transition-all duration-200"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Administrar sección
          </button>
          <button
            type="button"
            onClick={onViewMenuClick}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
          >
            Ver menú
          </button>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        imageSrc={tempImageSrc}
        onClose={handleCropClose}
        onSave={handleCropSave}
        onImageUpload={handleImageUploadFromModal}
        title="Ajustar Logo del Restaurante"
      />
      </div>
    </div>
  );
};

export default RestaurantHeader;