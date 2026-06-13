import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SectionCard } from '@/components/admin/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { adminCouponService } from '@/services/adminCouponService'
import { toast } from 'sonner'
import { Tag, Calendar } from 'lucide-react'

const couponSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório').max(20),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(0.01, 'Desconto deve ser maior que 0'),
  minOrderValue: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().min(0).optional(),
  validFrom: z.string().min(1, 'Data início obrigatória'),
  validTo: z.string().min(1, 'Data fim obrigatória'),
  isActive: z.boolean().optional().default(true)
})

type CouponFormData = z.infer<typeof couponSchema>

interface CouponModalProps {
  couponId: number | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function CouponModal({ couponId, open, onClose, onSaved }: CouponModalProps) {
  const isEditing = couponId !== null
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema) as any,
    defaultValues: { isActive: true, discountType: 'percentage' }
  })

  const discountType = watch('discountType')

  useEffect(() => {
    if (!open) return
    if (couponId !== null) {
      loadCoupon(couponId)
    } else {
      reset({ isActive: true, discountType: 'percentage', code: '', description: '' })
    }
  }, [open, couponId])

  const loadCoupon = async (id: number) => {
    try {
      const coupon = await adminCouponService.getById(id)
      reset({
        code: coupon.code,
        description: coupon.description || '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue || undefined,
        maxUses: coupon.maxUses || undefined,
        validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
        validTo: new Date(coupon.validTo).toISOString().split('T')[0],
        isActive: coupon.isActive
      })
    } catch {
      toast.error('Erro ao carregar cupom')
      onClose()
    }
  }

  const onSubmit = async (data: CouponFormData) => {
    try {
      setLoading(true)
      if (isEditing) {
        await adminCouponService.update(couponId!, data)
        toast.success('Cupom atualizado')
      } else {
        await adminCouponService.create(data)
        toast.success('Cupom criado')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar cupom')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{isEditing ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SectionCard title="Informações do Cupom" icon={<Tag size={15} />} className="border border-ink-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Código *</label>
                <Input {...register('code')} placeholder="FRETE10" className="uppercase font-mono" />
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Tipo de Desconto *</label>
                <Select value={discountType} onValueChange={(v: any) => setValue('discountType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Descrição</label>
              <Input {...register('description')} placeholder="Frete grátis para novos clientes" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  Desconto {discountType === 'percentage' ? '(%)' : '(R$)'} *
                </label>
                <Input {...register('discountValue')} type="number" step="0.01" placeholder="10" />
                {errors.discountValue && <p className="text-xs text-red-500 mt-1">{errors.discountValue.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Pedido Mínimo (R$)</label>
                <Input {...register('minOrderValue')} type="number" step="0.01" placeholder="Sem mínimo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Limite de Usos</label>
                <Input {...register('maxUses')} type="number" placeholder="Ilimitado" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Validade & Ativação" icon={<Calendar size={15} />} className="border border-ink-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Data Início *</label>
                <Input {...register('validFrom')} type="date" />
                {errors.validFrom && <p className="text-xs text-red-500 mt-1">{errors.validFrom.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Data Fim *</label>
                <Input {...register('validTo')} type="date" />
                {errors.validTo && <p className="text-xs text-red-500 mt-1">{errors.validTo.message}</p>}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox {...register('isActive')} id="isActive" />
              <span className="text-sm font-medium">Cupom ativo</span>
            </label>
          </SectionCard>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1 bg-lilac-500 hover:bg-lilac-600 text-white">
              {loading ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar Cupom'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
