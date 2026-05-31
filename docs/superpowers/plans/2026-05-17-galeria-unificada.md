# Galeria Unificada com Variantes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all product images (main product + all variants) into a single carousel. Clicking a variant jumps to its first image without changing the visual variant selector. Scrolling the carousel is passive (doesn't change selected variant).

**Architecture:** ProductPage builds a flat `allImages` array combining main product images and all variant images with metadata (`variantId`). Two independent states: `activeIndex` (carousel position) and `selectedVariantId` (which variant details to show). New component `GalleryUnified` handles carousel with thumbnails. Clicking variant updates both `selectedVariantId` and `activeIndex`; scrolling updates only `activeIndex`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React icons.

---

## File Structure

### Frontend
- Modify: `frontend/src/pages/store/ProductPage.tsx` — build unified image array, integrate GalleryUnified
- Create: `frontend/src/components/features/GalleryUnified.tsx` — carousel component with navigation
- Create: `frontend/src/components/features/ThumbnailStrip.tsx` — thumbnail strip with variant indicators
- No changes to: variant selector buttons (existing VariantSelectorButtons.tsx)

---

## Task 1: Create GalleryUnified Component

**Files:**
- Create: `frontend/src/components/features/GalleryUnified.tsx`

- [ ] **Step 1: Create the component**

**Create** `frontend/src/components/features/GalleryUnified.tsx`:

```typescript
import { useState, useRef, useEffect } from 'react'
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
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/components/features/GalleryUnified.tsx
git commit -m "feat(component): create GalleryUnified carousel component"
```

---

## Task 2: Create ThumbnailStrip Component

**Files:**
- Create: `frontend/src/components/features/ThumbnailStrip.tsx`

- [ ] **Step 1: Create the component**

**Create** `frontend/src/components/features/ThumbnailStrip.tsx`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/components/features/ThumbnailStrip.tsx
git commit -m "feat(component): create ThumbnailStrip with variant indicators"
```

---

## Task 3: Modify ProductPage to Use GalleryUnified

**Files:**
- Modify: `frontend/src/pages/store/ProductPage.tsx`

- [ ] **Step 1: Add imports**

At the top of ProductPage.tsx, add:

```typescript
import { GalleryUnified } from '@/components/features/GalleryUnified'
```

- [ ] **Step 2: Build unified image array**

Find the ProductPage component function and add state for gallery:

```typescript
const [galleryActiveIndex, setGalleryActiveIndex] = useState(0)

// Build unified image array: main product images + all variant images
const buildUnifiedImages = (): { src: string; variantId: number | null }[] => {
  const images: { src: string; variantId: number | null }[] = []

  // Add main product images
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach(src => {
      images.push({ src, variantId: null })
    })
  }

  // Add variant images
  if (product.variants && Array.isArray(product.variants)) {
    product.variants.forEach(variant => {
      if (variant.images) {
        try {
          const variantImages = typeof variant.images === 'string' 
            ? JSON.parse(variant.images) 
            : Array.isArray(variant.images) 
            ? variant.images 
            : []
          variantImages.forEach((src: string) => {
            images.push({ src, variantId: variant.id })
          })
        } catch {
          // Skip if images parsing fails
        }
      }
    })
  }

  return images
}

const unifiedImages = buildUnifiedImages()
```

- [ ] **Step 3: Handle variant selection**

Find the code where variant is selected (likely in a `handleSelectVariant` or similar function). Modify it to also jump carousel to first image of variant:

```typescript
const handleSelectVariant = (variant: ProductVariant) => {
  setSelectedVariant(variant)

  // Find first image index of this variant in unified array
  const firstImageIndex = unifiedImages.findIndex(
    img => img.variantId === variant.id
  )
  if (firstImageIndex >= 0) {
    setGalleryActiveIndex(firstImageIndex)
  }
}
```

If there's no explicit variant selection function, wrap the variant selector buttons with this logic.

- [ ] **Step 4: Replace gallery with GalleryUnified**

Find the existing gallery/image rendering code and replace it with:

```typescript
<GalleryUnified
  images={unifiedImages}
  activeIndex={galleryActiveIndex}
  onIndexChange={setGalleryActiveIndex}
/>
```

- [ ] **Step 5: Verify price updates correctly**

Ensure that the price displayed is from `selectedVariant`, not based on `galleryActiveIndex`. The price should ONLY update when variant is clicked, not when carousel scrolls.

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/pages/store/ProductPage.tsx
git commit -m "feat(ProductPage): integrate unified gallery with variant auto-scroll"
```

---

## Task 4: Build & Verify

**Files:**
- None (verification only)

- [ ] **Step 1: Build frontend**

```bash
cd frontend
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 2: Check for TypeScript errors**

```bash
cd frontend
npm run build 2>&1 | grep -i "error" || echo "No errors found"
```

- [ ] **Step 3: Visual verification checklist**

Test in browser (dev server running):
1. ✅ All images (main + variants) appear in carousel in correct order
2. ✅ Clicking a variant jumps carousel to first image of that variant
3. ✅ Scrolling carousel left/right doesn't change selected variant (price stays same)
4. ✅ Thumbnails show variant boundaries with "Var" indicator
5. ✅ Arrow buttons and swipe navigation work
6. ✅ Counter shows current position (e.g., "3 / 6")

- [ ] **Step 4: Commit summary**

```bash
cd frontend
git log --oneline -5
```

Expected: 3 commits for this subsystem (GalleryUnified, ThumbnailStrip, ProductPage integration).

---

## Summary

**Subsistema 4 (Galeria Unificada) — Estrutura Completa**

### O que foi implementado:

✅ **GalleryUnified Component:**
- Carrossel com navegação por setas (hover reveal)
- Suporte a swipe touch para mobile
- Contador de posição ("3 / 6")
- Integração com ThumbnailStrip

✅ **ThumbnailStrip Component:**
- Strip horizontal de thumbnails com scroll automático
- Indicador de variante ("Var") nas primeiras fotos de cada variante
- Ring highlight para imagem ativa

✅ **ProductPage Integration:**
- Array unificado de imagens (main + todas as variantes)
- Estado `galleryActiveIndex` independente de `selectedVariant`
- Ao clicar variante: atualiza preço E rola carousel para primeira foto
- Ao rolar carousel: NÃO muda variante selecionada

### Features:

- **Passive scrolling:** Rolar carrossel não muda variant display
- **Smart variant jump:** Clicar variante rola automaticamente
- **Variant boundaries:** Thumbnails mostram visualmente onde cada variante começa
- **Responsive:** Imagens em `aspect-[3/4]`, thumbnails em `80px`
- **Touch support:** Swipe navigation funciona em mobile

---

**Pronto para a próxima etapa! (Subsistema 5: MegaMenu Expansivo)**
