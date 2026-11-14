import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface WishImageCarouselProps {
  images: string[];
  title: string;
  category?: string;
  badge?: React.ReactNode;
  aspectRatioClass?: string;
  className?: string;
  onImageClick?: (index: number) => void;
}

export const WishImageCarousel: React.FC<WishImageCarouselProps> = ({
  images,
  title,
  category,
  badge,
  aspectRatioClass = 'aspect-16/10',
  className = '',
  onImageClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch tracking refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const isHorizontalGesture = useRef<boolean>(false);

  // Mouse drag tracking refs
  const mouseStartX = useRef<number | null>(null);
  const isMouseDown = useRef<boolean>(false);

  const totalImages = images.length;

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (totalImages <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  }, [totalImages]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (totalImages <= 1) return;
    setCurrentIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  }, [totalImages]);

  const handleSelect = (idx: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentIndex(idx);
  };

  // Touch handlers for iPad / iPhone / Android swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (totalImages <= 1) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    isHorizontalGesture.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Detect if this is primarily a horizontal gesture
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isHorizontalGesture.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const duration = Date.now() - touchStartTime.current;

    // Thresholds: at least 35px horizontal distance, and horizontal > vertical * 1.1
    // to preserve natural vertical page scrolling
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1 && duration < 750) {
      if (deltaX < 0) {
        // Swiped Left -> View Next
        handleNext();
      } else {
        // Swiped Right -> View Previous
        handlePrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalGesture.current = false;
  };

  // Mouse drag handlers for desktop trackpad/mouse swipe
  const handleMouseDown = (e: React.MouseEvent) => {
    if (totalImages <= 1) return;
    mouseStartX.current = e.clientX;
    isMouseDown.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown.current || mouseStartX.current === null) return;
    const deltaX = e.clientX - mouseStartX.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    isMouseDown.current = false;
    mouseStartX.current = null;
  };

  const handleMouseLeave = () => {
    isMouseDown.current = false;
    mouseStartX.current = null;
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (totalImages <= 1) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  if (totalImages === 0) {
    return (
      <div className={`relative ${aspectRatioClass} bg-[#F7F9FC] border-b border-[#E0E7F0] flex flex-col items-center justify-center text-[#667085] ${className}`}>
        <ImageIcon className="w-8 h-8 stroke-[1.5] opacity-40 mb-1" />
        <span className="text-xs font-medium">No photo provided</span>
      </div>
    );
  }

  const activePhoto = images[currentIndex] || images[0];

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label={`${title} image carousel. Use left and right arrow keys or swipe horizontally to change photo.`}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`relative ${aspectRatioClass} bg-[#F7F9FC] border-b border-[#E0E7F0] overflow-hidden select-none focus:outline-none focus:ring-2 focus:ring-[#4F86D9] ${className}`}
      style={{ touchAction: 'pan-y' }} // Allows native vertical page scrolling while enabling horizontal swipe detection
    >
      {/* Current Active Image with smooth fade */}
      <img
        src={activePhoto}
        alt={`${title} - Photo ${currentIndex + 1} of ${totalImages}`}
        onClick={() => onImageClick && onImageClick(currentIndex)}
        className="w-full h-full object-cover transition-opacity duration-200"
        loading="lazy"
        draggable={false}
      />

      {/* Top Floating Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        {category ? (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 text-[#263244] shadow-soft backdrop-blur-xs border border-white/40">
            {category}
          </span>
        ) : <div />}

        <div className="flex items-center gap-1.5">
          {badge}
        </div>
      </div>

      {/* Multiple Photos Controls (When more than 1 image) */}
      {totalImages > 1 && (
        <>
          {/* Previous Arrow Button (>= 44x44px touch target) */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#243B64]/65 hover:bg-[#243B64]/90 active:bg-[#1A2B49] text-white flex items-center justify-center transition-all duration-150 backdrop-blur-xs shadow-md z-20 cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Next Arrow Button (>= 44x44px touch target) */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#243B64]/65 hover:bg-[#243B64]/90 active:bg-[#1A2B49] text-white flex items-center justify-center transition-all duration-150 backdrop-blur-xs shadow-md z-20 cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Bottom Indicators Bar: "1 of 3" count + comfortable tap dots */}
          <div className="absolute bottom-2 inset-x-2 flex items-center justify-between bg-[#243B64]/75 backdrop-blur-sm px-3 py-1.5 rounded-xl z-20">
            {/* Clear Image Count Indicator */}
            <span className="text-xs font-bold text-white tracking-wide">
              {currentIndex + 1} of {totalImages}
            </span>

            {/* Pagination Dots with generous touch targets (>= 44x32px touch target) */}
            <div className="flex items-center gap-1" role="tablist" aria-label="Choose image">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={currentIndex === idx}
                  aria-label={`Show image ${idx + 1}`}
                  onClick={(e) => handleSelect(idx, e)}
                  className="h-8 px-1.5 flex items-center justify-center cursor-pointer transition-all"
                >
                  <span
                    className={`block rounded-full transition-all duration-200 ${
                      currentIndex === idx
                        ? 'w-6 h-2.5 bg-[#4F86D9] shadow-sm'
                        : 'w-2.5 h-2.5 bg-white/70 hover:bg-white'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
