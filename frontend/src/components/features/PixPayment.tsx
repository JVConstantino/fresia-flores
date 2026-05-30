import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { Button } from '@/components/ui/button'

interface PixPaymentProps {
  orderId: number
  customerEmail: string
  cpf: string
  onSuccess: () => void
}

export function PixPayment({ orderId, customerEmail, cpf, onSuccess }: PixPaymentProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pixData, setPixData] = useState<{ qrCodeBase64: string; qrCode: string; paymentId: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const createPix = async () => {
      try {
        const res = await api.post('/payment/pix', { orderId, customerEmail, cpf })
        setPixData(res.data)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao gerar PIX')
      } finally {
        setLoading(false)
      }
    }
    createPix()
  }, [orderId, customerEmail, cpf])

  useEffect(() => {
    if (!pixData?.paymentId) return

    // Polling simple every 5 seconds to check status
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/payment/status/${orderId}`)
        if (res.data.paymentStatus === 'approved') {
          clearInterval(interval)
          onSuccess()
        }
      } catch (err) {
        // ignore polling errors
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [pixData, orderId, onSuccess])

  const copyToClipboard = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return <div className="text-center p-8 text-ink-500">Gerando PIX... aguarde.</div>
  }

  if (error) {
    return <div className="text-center p-8 text-red-500 bg-red-50 rounded-lg">{error}</div>
  }

  if (!pixData) return null

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-ink-200 rounded-xl space-y-6">
      <div className="text-center">
        <h3 className="font-semibold text-ink-800">Escaneie o QR Code</h3>
        <p className="text-sm text-ink-500">Abra o app do seu banco e escolha pagar via PIX QR Code.</p>
      </div>

      {pixData.qrCodeBase64 && (
        <div className="w-48 h-48 border border-ink-200 rounded-xl overflow-hidden p-2 bg-white">
          <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-full h-full object-contain" />
        </div>
      )}

      <div className="w-full space-y-2">
        <p className="text-sm font-semibold text-ink-800 text-center">Ou copie o código (PIX Copia e Cola)</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={pixData.qrCode}
            className="flex-1 border border-ink-200 rounded-md px-3 py-2 text-xs text-ink-500 bg-ink-50"
          />
          <Button onClick={copyToClipboard} variant="outline" className="shrink-0">
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-ink-400 text-center flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Aguardando pagamento...
      </p>
    </div>
  )
}
