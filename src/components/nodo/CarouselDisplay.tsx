import React, { useEffect, useState, useRef } from 'react';
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
  
  // Calculate animation duration for single pass scrolling
  // Speed 1 = 15s (very slow), Speed 10 = 3s (fast)
  const animationDuration = Math.max(3, 18 - (scrollingSpeed * 1.5));
  
  // State to control animation restart
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<HTMLDivElement>(null);
  
  // Effect to handle animation lifecycle
  useEffect(() => {
    if (!enableScrollingText) return;
    
    // Start animation
    setIsAnimating(true);
    
    // Set timeout to restart animation after it completes
    const timeout = setTimeout(() => {
      setAnimationKey(prev => prev + 1);
      setIsAnimating(false);
      
      // Small delay before restarting
      setTimeout(() => {
        setIsAnimating(true);
      }, 100);
    }, animationDuration * 1000);
    
    return () => clearTimeout(timeout);
  }, [enableScrollingText, animationDuration, animationKey, carouselTitle]);
  
  // Single pass scrolling text component (right to left, no loop)
  const ScrollingTitle = ({ text }: { text: string }) => {
    if (!enableScrollingText) {
      return <span>{text}</span>;
    }

    return (
      <div className="overflow-hidden whitespace-nowrap relative w-full">
        <div 
          ref={animationRef}
          key={animationKey} // Force re-render when animation restarts
          className="inline-block"
          style={{
            animation: isAnimating ? `scrollRightToLeft ${animationDuration}s linear forwards` : 'none',
            transform: isAnimating ? 'translateX(100%)' : 'translateX(100%)',
          }}
        >
          {text}
        </div>
      </div>
    );
  };
  
  if (images.length === 0) {
    return (
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-full flex flex-col">
        {/* Global CSS for scrolling animation - defined once */}
        <style>{`
          @keyframes scrollRightToLeft {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}</style>
        
        {/* Title with single pass scrolling */}
        <div className="w-full mb-3">
          <h2 className="text-xl font-bold text-center w-full" style={{ color: textColor }}>
            <ScrollingTitle text={carouselTitle} />
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

  const currentImage = images[currentImageIndex];

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-full flex flex-col">
      {/* Global CSS for scrolling animation - defined once */}
      <style>{`
        @keyframes scrollRightToLeft {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
      
      {/* Title container with single pass scrolling */}
      <div className="w-full mb-2">
        <h2 className="text-lg font-bold text-center w-full" style={{ color: textColor }}>
          <ScrollingTitle text={carouselTitle} />
        </h2>
      </div>
      
      {/* Image container uses maximum available space with better proportions */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="relative w-[95%] h-[98%] rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={currentImage?.url}
            alt={currentImage?.name}
            className={`w-full h-full ${
              enableAnimations ? 'transition-all duration-1000 transform hover:scale-105' : ''
            }`}
            style={{
              objectFit: 'cover', // Ensures aspect ratio is preserved while filling container
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
            }}
          />
          
          {/* Overlay with gradient for better image visibility */}
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