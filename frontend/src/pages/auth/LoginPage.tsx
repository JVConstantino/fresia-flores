import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'motion/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BlurFade } from '@/components/ui/blur-fade'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { useLoaderStore } from '@/store/loaderStore'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

const floats = [
  { size: 'w-3 h-3', color: 'bg-petal-300/40', top: '28%', left: '18%', dur: 4, delay: 0 },
  { size: 'w-2 h-2', color: 'bg-lilac-300/50', top: '55%', left: '72%', dur: 5, delay: 1.2 },
  { size: 'w-4 h-4', color: 'bg-petal-200/30', top: '70%', left: '30%', dur: 6, delay: 0.6 },
  { size: 'w-2 h-2', color: 'bg-lilac-400/40', top: '20%', left: '65%', dur: 3.5, delay: 2 },
]

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
      {/* Esquerda — gradiente animado */}
      <div className="relative hidden lg:flex bg-gradient-to-br from-lilac-100 via-petal-100 to-lilac-50 flex-col items-center justify-center p-12 overflow-hidden">
        <AnimatedGridPattern
          numSquares={28}
          maxOpacity={0.07}
          duration={4}
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white_40%,transparent_80%)] text-lilac-400"
        />

        {floats.map((f, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${f.size} ${f.color}`}
            style={{ top: f.top, left: f.left }}
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: f.dur, repeat: Infinity, ease: 'easeInOut', delay: f.delay }}
          />
        ))}

        <div className="relative z-10 flex flex-col items-center">
          <BlurFade delay={0.1} inView>
            <img src="/logo-fresia.png" alt="Frésia" className="h-24 w-auto" />
          </BlurFade>

          <BlurFade delay={0.25} inView>
            <AnimatedShinyText className="text-ink-500 text-sm text-center leading-relaxed max-w-[200px] mt-4">
              Flores com alma,{'\n'}entregues com carinho.
            </AnimatedShinyText>
          </BlurFade>
        </div>
      </div>

      {/* Direita — formulário */}
      <div className="flex items-center justify-center p-12 bg-white">
        <BlurFade delay={0.05} className="w-full max-w-sm">
          <BlurFade delay={0.1}>
            <h1 className="font-display italic text-3xl text-ink-800 mb-1">
              Bem-vinda de volta
            </h1>
          </BlurFade>
          <BlurFade delay={0.15}>
            <p className="text-sm text-ink-500 mb-8">Entre na sua conta para continuar</p>
          </BlurFade>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <BlurFade delay={0.2}>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                  Email
                </label>
                <Input type="email" placeholder="seu@email.com" {...register('email')} />
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
                )}
              </div>
            </BlurFade>

            <BlurFade delay={0.26}>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                  Senha
                </label>
                <Input type="password" placeholder="••••••••" {...register('password')} />
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
                )}
              </div>
            </BlurFade>

            {error && (
              <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <BlurFade delay={0.34}>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-ink-800 hover:bg-lilac-500 text-white rounded-pill transition-colors"
                >
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </Button>
              </motion.div>
            </BlurFade>
          </form>

          <BlurFade delay={0.4}>
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
          </BlurFade>
        </BlurFade>
      </div>
    </div>
  )
}
