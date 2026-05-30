'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

const schema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
    terms: z.boolean().refine(v => v === true, 'Aceite os termos para continuar'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { setUser } = useAuthStore()
  const router = useRouter()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { terms: false },
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const user = await authService.register({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
      })
      setUser(user)
      router.push('/conta')
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Erro ao criar conta.')
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Esquerda — gradiente */}
      <div className="bg-gradient-to-br from-lilac-100 via-petal-100 to-lilac-50 flex flex-col items-center justify-center p-12">
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
      <div className="flex items-center justify-center p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm py-4">
          <h1 className="font-display italic text-3xl text-ink-800 mb-1">Criar sua conta</h1>
          <p className="text-sm text-ink-500 mb-6">Junte-se à comunidade Frésia</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Nome
              </label>
              <Input placeholder="Seu nome completo" {...register('name')} />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Email
              </label>
              <Input type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Telefone <span className="normal-case font-normal">(opcional)</span>
              </label>
              <Input placeholder="(11) 99999-9999" {...register('phone')} />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Senha
              </label>
              <Input type="password" placeholder="Mínimo 8 caracteres" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Confirmar senha
              </label>
              <Input type="password" placeholder="Repita a senha" {...register('confirmPassword')} />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <Controller
                name="terms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="terms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                )}
              />
              <label htmlFor="terms" className="text-xs text-ink-500 cursor-pointer leading-relaxed">
                Li e aceito os{' '}
                <span className="text-lilac-500">termos de uso</span> e a{' '}
                <span className="text-lilac-500">política de privacidade</span>
              </label>
            </div>
            {errors.terms && (
              <p className="text-xs text-red-400 -mt-2">{errors.terms.message}</p>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-ink-800 hover:bg-lilac-500 text-white rounded-full transition-colors"
            >
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>

          <p className="text-center text-xs text-ink-500 mt-6">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-lilac-500 hover:text-lilac-600 font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
