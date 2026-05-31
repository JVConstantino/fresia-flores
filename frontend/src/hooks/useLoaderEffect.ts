import { useEffect } from 'react'
import { useLoaderStore } from '@/store/loaderStore'

/**
 * Sincroniza um isLoading local com o GlobalLoader.
 */
export function useLoaderEffect(isLoading: boolean, label?: string) {
  const { show, hide } = useLoaderStore()

  useEffect(() => {
    if (isLoading) show(label)
    else hide()
    return () => hide()
  }, [isLoading, label])
}
