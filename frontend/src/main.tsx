import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useLoaderStore } from '@/store/loaderStore'

declare global {
  interface Window {
    MercadoPago: any
    mp: any
  }
}

const initMercadoPago = () => {
  const mpKey = import.meta.env.VITE_MP_PUBLIC_KEY
  if (!mpKey) return // MP desativado — chave não configurada
  if (typeof window !== 'undefined' && window.MercadoPago) {
    try {
      window.mp = new window.MercadoPago(mpKey, { locale: 'pt-BR' })
      console.log('Mercado Pago SDK configurado')
    } catch (e) {
      console.warn('MP SDK não configurado ainda', e)
    }
  }
}

async function initAuth() {
  useLoaderStore.getState().show('Carregando…')
  try {
    const user = await authService.me()
    if (user) {
      useAuthStore.getState().setUser(user)
      console.log('Usuário autenticado:', user.name)

      const localFavorites = useWishlistStore.getState().favoriteIds
      if (localFavorites.length > 0) {
        const merged = await authService.syncWishlist(localFavorites)
        useWishlistStore.getState().syncWithServer(merged)
        console.log('Wishlist sincronizada:', merged)
      }
    } else {
      console.log('Usuário não autenticado')
      useAuthStore.getState().setUser(null)
    }
  } catch (err) {
    console.log('Usuário não autenticado')
    useAuthStore.getState().setUser(null)
  } finally {
    useAuthStore.getState().setLoading(false)
    useLoaderStore.getState().hide()
  }
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
}

initMercadoPago()
// Pre-acionar o loader antes do React montar para evitar flash branco
useLoaderStore.getState().show('Carregando…')
renderApp()
initAuth().catch(err => {
  console.error('Erro ao inicializar app:', err)
  useAuthStore.getState().setLoading(false)
  useLoaderStore.getState().hide()
})
