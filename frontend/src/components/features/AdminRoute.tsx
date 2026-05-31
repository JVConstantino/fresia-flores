import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-lilac-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return <Navigate to="/login?redirect=%2Fadmin" replace />
  }

  return <>{children}</>
}
