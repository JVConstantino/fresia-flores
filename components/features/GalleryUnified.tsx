'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ThumbnailStrip } from './ThumbnailStrip'

interface ImageMeta {
  src: string
  variantId: number | null
}

interface GalleryUnifiedProps {
  images: ImageMeta[]
  activeIndex: number
  onIndexChange: (index: number) => void
}

export function GalleryUnified({ images, activeIndex, onIndexChange }: GalleryUnifiedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[3/4] bg-ink-100 rounded-lg flex items-center justify-center">
        <p className="text-ink-400">Nenhuma imagem disponível</p>
      </div>
    )
  }

  const handlePrev = () => {
    onIndexChange(activeIndex === 0 ? images.length - 1 : activeIndex - 1)
  }

  const handleNext = () => {
    onIndexChange(activeIndex === images.length - 1 ? 0 : activeIndex + 1)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Gallery */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[3/4] bg-ink-50 rounded-lg overflow-hidden group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image */}
        <img
          src={images[activeIndex].src}
          alt={`Product image ${activeIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} className="text-ink-800" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight size={24} className="text-ink-800" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <ThumbnailStrip
          images={images}
          activeIndex={activeIndex}
          onSelectIndex={onIndexChange}
        />
      )}
    </div>
  )
}
