import { useEffect } from 'react'

interface SeoOptions {
  title?: string
  description?: string
}

/**
 * Hook leve de SEO para SPA: ajusta document.title e a meta description
 * por página, restaurando os valores anteriores ao desmontar.
 */
export function useSeo({ title, description }: SeoOptions) {
  useEffect(() => {
    const prevTitle = document.title

    let metaEl = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    const createdMeta = !metaEl
    if (!metaEl) {
      metaEl = document.createElement('meta')
      metaEl.setAttribute('name', 'description')
      document.head.appendChild(metaEl)
    }
    const prevDescription = metaEl.getAttribute('content')

    if (title) document.title = title
    if (description) metaEl.setAttribute('content', description)

    return () => {
      document.title = prevTitle
      if (createdMeta) {
        metaEl?.remove()
      } else if (prevDescription !== null) {
        metaEl?.setAttribute('content', prevDescription)
      }
    }
  }, [title, description])
}
