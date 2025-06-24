import React, { useMemo, useCallback } from 'react';
import type { CarouselImage } from '../../types';

interface CarouselDisplayProps {
  images: CarouselImage[];
  currentImageIndex: number;
  showImageDescriptions: boolean;
  showImageIndicators: boolean;
  enableAnimations: boolean;
  textColor: string;
  carouselTitle: string;
  enableScrollingText: boolean;
  scrollingSpeed: number;
}

export default function CarouselDisplay({
  images,
  currentImageIndex,
  showImageDescriptions,
  showImageIndicators,
  enableAnimations,
  textColor,
  carouselTitle,
  enableScrollingText,
  scrollingSpeed
}: CarouselDisplayProps) {
  
  // CRITICAL: Memoize the scrolling title component to prevent re-renders
  const ScrollingTitle = useMemo(() => {
    if (!enableScrollingText) {
      return <span>{carouselTitle}</span>;
    }

    // Calculate animation duration based on text length and speed
    const baseSpeed = 20;
    const speedMultiplier = (11 - scrollingSpeed) / 10;
    const textLength = carouselTitle.length;
    const lengthFactor = Math.max(1, textLength / 20);
    const animationDuration = baseSpeed * speedMultiplier * lengthFactor;
    
    // Generate unique animation name to avoid conflicts
    const animationName = `scroll-text-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="overflow-hidden whitespace-nowrap relative w-full">
        <div 
          className="inline-block"
          style={{
            animation: `${animationName} ${animationDuration}s linear infinite`,
          }}
        >
          {carouselTitle}
        </div>
        <style jsx>{`
          @keyframes ${animationName} {
            0% {
              transform: translateX(100%);
            }
            50% {
              transform: translateX(-50%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}</style>
      </div>
    );
  }, [carouselTitle, enableScrollingText, scrollingSpeed]); // Only re-create when these specific props change

  // Memoize the current image to prevent unnecessary re-renders
  const currentImage = useMemo(() => {
    return images[currentImageIndex];
  }, [images, currentImageIndex]);

  // Memoize the error handler to prevent re-creation on every render
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
  }, []);

  if (images.length === 0) {
    return (
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-full flex flex-col">
        <div className="w-full mb-3">
          <h2 className="text-xl font-bold text-center w-full" style={{ color: textColor }}>
            {ScrollingTitle}
          </h2>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 py-12">
            <div className="text-6xl mb-4 opacity-30">📷</div>
            <p className="text-2xl font-semibold mb-3">No hay imágenes configuradas</p>
            <p className="text-lg opacity-75">Contacta al administrador para agregar contenido publicitario</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-full flex flex-col">
      {/* STABLE: Title container with memoized scrolling component */}
      <div className="w-full mb-2">
        <h2 className="text-lg font-bold text-center w-full" style={{ color: textColor }}>
          {ScrollingTitle}
        </h2>
      </div>
      
      {/* Image container */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="relative w-[95%] h-[98%] rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={currentImage?.url}
            alt={currentImage?.name}
            className={`w-full h-full ${
              enableAnimations ? 'transition-all duration-1000 transform hover:scale-105' : ''
            }`}
            style={{
              objectFit: 'cover',
            }}
            onError={handleImageError}
          />
          
          {/* Overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50"></div>
          
          {/* Image name overlay */}
          {showImageDescriptions && (
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-bold text-white drop-shadow-2xl">
                {currentImage?.name}
              </h3>
              {currentImage?.description && (
                <p className="text-sm text-white opacity-90 mt-1 drop-shadow-lg">
                  {currentImage?.description}
                </p>
              )}
            </div>
          )}
          
          {/* Image indicators */}
          {showImageIndicators && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full ${
                    enableAnimations ? 'transition-all duration-300' : ''
                  } ${
                    index === currentImageIndex 
                      ? 'bg-white shadow-lg scale-125' 
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Auto-rotation indicator */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      </div>
    </div>
  );
}