import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Redirecionado para a página de Usuários (implementação completa com API real)
export function CustomersPage() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/admin/usuarios', { replace: true }) }, [])
  return null
}
