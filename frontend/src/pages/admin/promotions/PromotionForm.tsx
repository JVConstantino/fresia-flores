import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SectionCard } from '@/components/admin/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { adminPromotionService } from '@/services/adminPromotionService'
import { adminProductService } from '@/services/adminProductService'
import { toast } from 'sonner'
import { Percent, Package } from 'lucide-react'

const promotionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(0.01, 'Valor deve ser maior que 0'),
  validFrom: z.string().min(1, 'Data inicial é obrigatória'),
  validTo: z.string().min(1, 'Data final é obrigatória'),
  isActive: z.boolean().optional().default(true),
  productIds: z.array(z.number()).min(1, 'Selecione ao menos um produto')
})

type PromotionFormData = z.infer<typeof promotionSchema>

interface PromotionModalProps {
  promotionId: number | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function PromotionModal({ promotionId, open, onClose, onSaved }: PromotionModalProps) {
  const isEditing = promotionId !== null
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [search, setSearch] = useState('')

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema) as any,
    defaultValues: { discountType: 'percentage', isActive: true, productIds: [] }
  })

  const discountType = watch('discountType')

  useEffect(() => {
    if (!open) return
    loadProducts()
    if (promotionId !== null) {
      loadPromotion(promotionId)
    } else {
      reset({ discountType: 'percentage', isActive: true, productIds: [], name: '', description: '' })
      setSelectedProducts([])
      setSearch('')
    }
  }, [open, promotionId])

  const loadProducts = async () => {
    try {
      const result = await adminProductService.getAll(1, 100)
      setProducts(result.data || [])
    } catch { toast.error('Erro ao carregar produtos') }
  }

  const loadPromotion = async (id: number) => {
    try {
      const promotion = await adminPromotionService.getById(id)
      reset({
        name: promotion.name,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        validFrom: promotion.validFrom.split('T')[0],
        validTo: promotion.validTo.split('T')[0],
        isActive: promotion.isActive,
        productIds: promotion.productIds
      })
      setSelectedProducts(promotion.productIds)
    } catch {
      toast.error('Erro ao carregar promoção')
      onClose()
    }
  }

  const onSubmit = async (data: PromotionFormData) => {
    try {
      setLoading(true)
      const payload = { ...data, productIds: selectedProducts, validFrom: new Date(data.validFrom), validTo: new Date(data.validTo) }
      if (isEditing) {
        await adminPromotionService.update(promotionId!, payload)
        toast.success('Promoção atualizada')
      } else {
        await adminPromotionService.create(payload)
        toast.success('Promoção criada')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar promoção')
    } finally { setLoading(false) }
  }

  const toggleProduct = (productId: number) => {
    const next = selectedProducts.includes(productId)
      ? selectedProducts.filter(i => i !== productId)
      : [...selectedProducts, productId]
    setSelectedProducts(next)
    setValue('productIds', next)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{isEditing ? 'Editar Promoção' : 'Nova Promoção'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SectionCard title="Configurações da Promoção" icon={<Percent size={15} />} className="border border-ink-100">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <Input {...register('name')} placeholder="Ex: Liquidação de Verão" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <Textarea {...register('description')} placeholder="Descrição da promoção" rows={2} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Desconto</label>
                <Select value={discountType} onValueChange={v => setValue('discountType', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor do Desconto *</label>
                <Input {...register('discountValue', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" />
                {errors.discountValue && <p className="text-xs text-red-500 mt-1">{errors.discountValue.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Válida de *</label>
                <Input {...register('validFrom')} type="date" />
                {errors.validFrom && <p className="text-xs text-red-500 mt-1">{errors.validFrom.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Válida até *</label>
                <Input {...register('validTo')} type="date" />
                {errors.validTo && <p className="text-xs text-red-500 mt-1">{errors.validTo.message}</p>}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox {...register('isActive')} id="isActive" />
              <span className="text-sm font-medium">Promoção ativa</span>
            </label>
          </SectionCard>

          <SectionCard
            title={`Produtos Incluídos ${selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''}`}
            icon={<Package size={15} />}
            description="Selecione os produtos que terão desconto"
            className="border border-ink-100"
          >
            <Input
              placeholder="Buscar produto…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-1"
            />
            <div className="border border-ink-200 rounded-md max-h-52 overflow-y-auto divide-y divide-ink-100">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-6">Nenhum produto encontrado</p>
              ) : filteredProducts.map(product => (
                <label key={product.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-ink-50 transition-colors">
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                  />
                  <span className="text-sm text-ink-700">{product.name}</span>
                </label>
              ))}
            </div>
            {errors.productIds && <p className="text-xs text-red-500 mt-1">{errors.productIds.message}</p>}
          </SectionCard>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1 bg-lilac-500 hover:bg-lilac-600 text-white">
              {loading ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar Promoção'}
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
