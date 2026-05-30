import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useLoaderStore } from '@/store/loaderStore'

/**
 * Mostra o GlobalLoader durante mudança de rota.
 * Delay mínimo de 400ms para evitar flash em rotas instantâneas.
 */
export function useRouteLoader() {
  const pathname = usePathname()
  const { show, hide } = useLoaderStore()
  const firstRender = useRef(true)

  useEffect(() => {
    // Não exibir no primeiro render (boot já cobre isso)
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    show()
    const timer = setTimeout(() => hide(), 400)
    return () => {
      clearTimeout(timer)
      hide()
    }
  }, [pathname])
}
