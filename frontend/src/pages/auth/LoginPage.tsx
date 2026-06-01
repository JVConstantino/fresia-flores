import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { useLoaderStore } from '@/store/loaderStore'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    useLoaderStore.getState().show('Entrando…')
    try {
      const user = await authService.login(data.email, data.password)
      setUser(user)
      const redirect = searchParams.get('redirect')
      const destination = redirect
        ? decodeURIComponent(redirect)
        : user.isAdmin ? '/admin' : '/conta'
      navigate(destination, { replace: true })
    } catch {
      setError('Email ou senha incorretos.')
    } finally {
      useLoaderStore.getState().hide()
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Esquerda — gradiente */}
      <div className="hidden lg:flex bg-gradient-to-br from-lilac-100 via-petal-100 to-lilac-50 flex-col items-center justify-center p-12">
        <div className="relative font-display italic text-5xl text-lilac-500 mb-4">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-petal-400" />
          Fresia
        </div>
        <p className="text-ink-500 text-sm text-center leading-relaxed max-w-[200px]">
          Flores com alma,<br />entregues com carinho.
        </p>
        <div className="text-6xl mt-8">🌸</div>
      </div>

      {/* Direita — formulário */}
      <div className="flex items-center justify-center p-12 bg-white">
        <div className="w-full max-w-sm">
          <h1 className="font-display italic text-3xl text-ink-800 mb-1">
            Bem-vinda de volta
          </h1>
          <p className="text-sm text-ink-500 mb-8">Entre na sua conta para continuar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Email
              </label>
              <Input type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Senha
              </label>
              <Input type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-ink-800 hover:bg-lilac-500 text-white rounded-pill transition-colors"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <Link
            to="/recuperar-senha"
            className="block w-full text-xs text-ink-500 hover:text-ink-800 transition-colors mt-3 text-center"
          >
            Esqueci minha senha
          </Link>

          <p className="text-center text-xs text-ink-500 mt-6">
            Não tem conta?{' '}
            <Link to="/registro" className="text-lilac-500 hover:text-lilac-600 font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
