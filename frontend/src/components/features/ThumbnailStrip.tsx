import { useRef, useEffect } from 'react'

interface ImageMeta {
  src: string
  variantId: number | null
}

interface ThumbnailStripProps {
  images: ImageMeta[]
  activeIndex: number
  onSelectIndex: (index: number) => void
}

export function ThumbnailStrip({ images, activeIndex, onSelectIndex }: ThumbnailStripProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeThumbRef = useRef<HTMLButtonElement>(null)

  // Auto-scroll thumbnails to keep active one centered
  useEffect(() => {
    if (activeThumbRef.current && scrollContainerRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  }, [activeIndex])

  // Find first image index for each variant to show variant boundaries
  const variantBoundaries = new Map<number | null, number>()
  images.forEach((img, idx) => {
    if (!variantBoundaries.has(img.variantId)) {
      variantBoundaries.set(img.variantId, idx)
    }
  })

  const isVariantStart = (index: number) => {
    const variantId = images[index].variantId
    return variantBoundaries.get(variantId) === index
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex gap-2 overflow-x-auto pb-2 scroll-smooth"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#ddd transparent' }}
    >
      {images.map((img, idx) => (
        <button
          key={idx}
          ref={idx === activeIndex ? activeThumbRef : null}
          onClick={() => onSelectIndex(idx)}
          className={`flex-shrink-0 relative aspect-[3/4] w-20 rounded-md overflow-hidden transition-all ${
            idx === activeIndex
              ? 'ring-2 ring-lilac-500 scale-105'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <img
            src={img.src}
            alt={`Thumbnail ${idx + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Variant boundary indicator */}
          {isVariantStart(idx) && idx > 0 && (
            <div className="absolute top-1 left-1 bg-lilac-500 text-white text-[10px] px-1.5 py-0.5 rounded opacity-80">
              Var
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
