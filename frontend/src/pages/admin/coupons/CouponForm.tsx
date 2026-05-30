import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { adminCouponService } from '@/services/adminCouponService'
import { toast } from 'sonner'

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

export function CouponForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CouponFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(couponSchema) as any,
    defaultValues: { isActive: true, discountType: 'percentage' }
  })

  const discountType = watch('discountType')

  useEffect(() => {
    if (isEditing) {
      loadCoupon()
    }
  }, [id])

  const loadCoupon = async () => {
    try {
      const coupon = await adminCouponService.getById(parseInt(id!))
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
    } catch (err: any) {
      toast.error('Erro ao carregar cupom')
      navigate('/admin/cupons')
    }
  }

  const onSubmit = async (data: CouponFormData) => {
    try {
      setLoading(true)
      if (isEditing) {
        await adminCouponService.update(parseInt(id!), data)
        toast.success('Cupom atualizado com sucesso')
      } else {
        await adminCouponService.create(data)
        toast.success('Cupom criado com sucesso')
      }
      navigate('/admin/cupons')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar cupom')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout
      title={isEditing ? 'Editar Cupom' : 'Novo Cupom'}
      description={isEditing ? `Editando cupom #${id}` : 'Criar novo cupom de desconto'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
        <div className="bg-white border border-ink-200 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-ink-800 uppercase tracking-wider">Informações do Cupom</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Código *</label>
              <Input
                {...register('code')}
                placeholder="FRETE10"
                className="uppercase font-mono"
              />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Tipo de Desconto *</label>
              <Select value={discountType} onValueChange={(v: any) => setValue('discountType', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Desconto {discountType === 'percentage' ? '(%)' : '(R$)'} *
              </label>
              <Input {...register('discountValue')} type="number" step="0.01" placeholder="10" />
              {errors.discountValue && <p className="text-xs text-red-500 mt-1">{errors.discountValue.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Pedido Mínimo (R$)</label>
              <Input {...register('minOrderValue')} type="number" step="0.01" placeholder="50.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Limite de Usos</label>
              <Input {...register('maxUses')} type="number" placeholder="Ilimitado" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-ink-200 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-ink-800 uppercase tracking-wider">Validade</h3>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="flex items-center gap-2">
            <Checkbox {...register('isActive')} id="isActive" />
            <label htmlFor="isActive" className="text-sm font-medium">Ativo</label>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={loading} className="bg-lilac-500 hover:bg-lilac-600">
            {loading ? 'Salvando...' : isEditing ? 'Atualizar Cupom' : 'Criar Cupom'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/cupons')}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminLayout>
  )
}
