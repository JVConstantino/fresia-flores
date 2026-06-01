import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/authService'
import { useLoaderStore } from '@/store/loaderStore'
import { toast } from 'sonner'

// Zod schemas
const requestSchema = z.object({
  email: z.string().email('Email inválido'),
})
type RequestFormData = z.infer<typeof requestSchema>

const resetSchema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
type ResetFormData = z.infer<typeof resetSchema>

export function RecoverPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [requestSuccess, setRequestSuccess] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [error, setError] = useState('')
  const [devLink, setDevLink] = useState('')

  // Forms
  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: requestErrors, isSubmitting: requestSubmitting },
  } = useForm<RequestFormData>({ resolver: zodResolver(requestSchema) })

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors, isSubmitting: resetSubmitting },
  } = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) })

  const onRequestSubmit = async (data: RequestFormData) => {
    setError('')
    useLoaderStore.getState().show('Processando…')
    try {
      const res = await authService.forgotPassword(data.email)
      setRequestSuccess(true)
      toast.success('Link de recuperação enviado!')
      if (res.devLink) {
        setDevLink(res.devLink)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Ocorreu um erro. Tente novamente.')
    } finally {
      useLoaderStore.getState().hide()
    }
  }

  const onResetSubmit = async (data: ResetFormData) => {
    if (!token) return
    setError('')
    useLoaderStore.getState().show('Redefinindo senha…')
    try {
      await authService.resetPassword(token, data.password)
      setResetSuccess(true)
      toast.success('Senha redefinida com sucesso!')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Token inválido ou expirado.')
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
          {!token ? (
            /* PASSO 1: Solicitar link de redefinição */
            requestSuccess ? (
              <div className="space-y-4 text-center">
                <div className="text-5xl">✉️</div>
                <h1 className="font-display italic text-3xl text-ink-800">Verifique seu email</h1>
                <p className="text-sm text-ink-600 leading-relaxed">
                  Se o endereço fornecido estiver cadastrado, enviamos as instruções para redefinir sua senha.
                </p>
                {devLink && (
                  <div className="p-4 bg-ink-50 rounded-lg border border-ink-200 text-left mt-6">
                    <p className="text-[10px] font-bold text-ink-500 uppercase tracking-wider mb-2">Modo Desenvolvedor (Link Simulado):</p>
                    <a href={devLink} className="text-xs text-lilac-600 underline break-all hover:text-lilac-700">
                      {devLink}
                    </a>
                  </div>
                )}
                <div className="pt-4">
                  <Link to="/login" className="text-sm text-lilac-500 hover:text-lilac-600 underline">
                    Voltar ao Login
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="font-display italic text-3xl text-ink-800 mb-1">Recuperar senha</h1>
                <p className="text-sm text-ink-500 mb-8">Digite seu email para receber um link de redefinição</p>

                <form onSubmit={handleSubmitRequest(onRequestSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                      Email
                    </label>
                    <Input type="email" placeholder="seu@email.com" {...registerRequest('email')} />
                    {requestErrors.email && (
                      <p className="text-xs text-red-400 mt-1">{requestErrors.email.message}</p>
                    )}
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={requestSubmitting}
                    className="w-full bg-ink-800 hover:bg-lilac-500 text-white rounded-pill transition-colors"
                  >
                    {requestSubmitting ? 'Enviando...' : 'Enviar Link'}
                  </Button>
                </form>

                <p className="text-center text-xs text-ink-500 mt-6">
                  Lembrou a senha?{' '}
                  <Link to="/login" className="text-lilac-500 hover:text-lilac-600 font-medium">
                    Entrar
                  </Link>
                </p>
              </div>
            )
          ) : (
            /* PASSO 2: Definir nova senha (se token estiver presente) */
            resetSuccess ? (
              <div className="space-y-4 text-center">
                <div className="text-5xl">🎉</div>
                <h1 className="font-display italic text-3xl text-ink-800">Senha Alterada!</h1>
                <p className="text-sm text-ink-600 leading-relaxed">
                  Sua senha foi redefinida com sucesso. Redirecionando para a tela de login...
                </p>
                <div className="pt-4">
                  <Link to="/login" className="text-sm text-lilac-500 hover:text-lilac-600 underline">
                    Ir para Login agora
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="font-display italic text-3xl text-ink-800 mb-1">Nova senha</h1>
                <p className="text-sm text-ink-500 mb-8">Digite sua nova senha de acesso</p>

                <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                      Nova senha
                    </label>
                    <Input type="password" placeholder="Mínimo 8 caracteres" {...registerReset('password')} />
                    {resetErrors.password && (
                      <p className="text-xs text-red-400 mt-1">{resetErrors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                      Confirmar nova senha
                    </label>
                    <Input type="password" placeholder="Repita a nova senha" {...registerReset('confirmPassword')} />
                    {resetErrors.confirmPassword && (
                      <p className="text-xs text-red-400 mt-1">{resetErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={resetSubmitting}
                    className="w-full bg-ink-800 hover:bg-lilac-500 text-white rounded-pill transition-colors"
                  >
                    {resetSubmitting ? 'Redefinindo...' : 'Alterar Senha'}
                  </Button>
                </form>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
