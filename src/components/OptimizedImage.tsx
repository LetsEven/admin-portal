import React, { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  quality?: 'high' | 'medium' | 'low';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder-food.jpg',
  loading = 'lazy',
  quality = 'high'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  // Optimizaciones CSS según la calidad solicitada
  const getImageStyles = () => {
    const baseStyles = 'transition-all duration-300 ease-in-out';

    switch (quality) {
      case 'high':
        return `${baseStyles} image-rendering-high-quality image-rendering-crisp-edges`;
      case 'medium':
        return `${baseStyles} image-rendering-auto`;
      case 'low':
        return `${baseStyles} image-rendering-pixelated`;
      default:
        return `${baseStyles} image-rendering-high-quality`;
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        className={`
          w-full h-full object-cover
          ${getImageStyles()}
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${hasError ? 'opacity-75' : ''}
        `}
        style={{
          imageRendering: quality === 'high' ? 'high-quality' : 'auto',
        }}
        onLoad={handleLoad}
        onError={handleError}
        // Atributos adicionales para mejor calidad
        decoding="async"
      />

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <div>Imagen no disponible</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;