import React, { useEffect, useRef } from 'react';
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
  
  const marqueeContentRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number>();
  const isAnimatingRef = useRef<boolean>(false);
  
  // JavaScript-based marquee implementation
  useEffect(() => {
    const marqueeContent = marqueeContentRef.current;
    if (!marqueeContent) return;

    const startMarquee = () => {
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
        animationFrameIdRef.current = requestAnimationFrame(updateMarquee);
      }
    };

    const stopMarquee = () => {
      isAnimatingRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };

    const updateMarquee = () => {
      if (!isAnimatingRef.current || !marqueeContent) return;

      const containerWidth = (marqueeContent.parentElement as HTMLElement).offsetWidth;
      const contentWidth = marqueeContent.offsetWidth;
      
      // Get current transform value
      const transform = getComputedStyle(marqueeContent).transform;
      let currentTranslateX = 0;
      
      if (transform !== 'none') {
        const matrix = transform.split(',');
        if (matrix.length >= 5) {
          currentTranslateX = parseFloat(matrix[4]) || 0;
        }
      }

      // Calculate scroll speed based on scrollingSpeed (1-10 scale)
      // Speed 1 = 0.5px per frame (slow), Speed 10 = 5px per frame (fast)
      const scrollSpeedPixels = 0.5 + (scrollingSpeed - 1) * 0.5;
      let newTranslateX = currentTranslateX - scrollSpeedPixels;

      // Reset position when text completely exits on the left
      if (newTranslateX <= -contentWidth) {
        newTranslateX = containerWidth; // Start from right edge of container
      }

      marqueeContent.style.transform = `translateX(${newTranslateX}px)`;
      animationFrameIdRef.current = requestAnimationFrame(updateMarquee);
    };

    // Start or stop marquee based on enableScrollingText
    if (enableScrollingText) {
      // Initialize position to start from right edge
      marqueeContent.style.transform = `translateX(${marqueeContent.parentElement?.offsetWidth || 0}px)`;
      startMarquee();
    } else {
      stopMarquee();
      // Reset to center position when scrolling is disabled
      marqueeContent.style.transform = 'translateX(0)';
    }

    // Cleanup function
    return () => {
      stopMarquee();
    };
  }, [enableScrollingText, scrollingSpeed, carouselTitle]);

  // Scrolling text component using JavaScript animation
  const ScrollingTitle = ({ text }: { text: string }) => {
    if (!enableScrollingText) {
      return <span>{text}</span>;
    }

    return (
      <div className="overflow-hidden whitespace-nowrap relative w-full">
        <div 
          ref={marqueeContentRef}
          className="inline-block"
          style={{
            willChange: 'transform', // Optimize for animations
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
        {/* Title with JavaScript-based scrolling */}
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
      {/* Title container with JavaScript-based scrolling */}
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