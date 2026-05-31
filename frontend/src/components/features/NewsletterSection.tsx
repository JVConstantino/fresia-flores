import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { newsletterService } from '@/services/newsletterService'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Digite um email')
      return
    }

    setIsLoading(true)
    try {
      await newsletterService.subscribe(email)
      toast.success('Inscrito com sucesso!')
      setEmail('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao inscrever')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="bg-lilac-100 py-16">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-ink-800 mb-2">
          Receba nossas novidades
        </h2>
        <p className="text-ink-600 mb-8">
          Inscreva-se para receber ofertas exclusivas e dicas de arranjos florais
        </p>

        <form
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={100}
            className="flex-1 max-w-sm"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-pill px-8"
          >
            {isLoading ? 'Inscrevendo...' : 'Inscrever'}
          </Button>
        </form>
      </div>
    </section>
  )
}
