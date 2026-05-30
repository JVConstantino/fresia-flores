import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { adminPromotionService } from '@/services/adminPromotionService'
import { adminProductService } from '@/services/adminProductService'
import { toast } from 'sonner'

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

export function PromotionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(!!id)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<PromotionFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(promotionSchema) as any,
    defaultValues: { discountType: 'percentage', isActive: true, productIds: [] }
  })

  useEffect(() => {
    loadProducts()
    if (id) loadPromotion()
  }, [id])

  const loadProducts = async () => {
    try {
      const result = await adminProductService.getAll(1, 100)
      setProducts(result.data || [])
    } catch (err: any) {
      toast.error('Erro ao carregar produtos')
    }
  }

  const loadPromotion = async () => {
    try {
      const promotion = await adminPromotionService.getById(Number(id))
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
    } catch (err: any) {
      toast.error('Erro ao carregar promoção')
      navigate('/admin/promocoes')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: PromotionFormData) => {
    try {
      setLoading(true)
      const payload = {
        ...data,
        productIds: selectedProducts,
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo)
      }
      if (id) {
        await adminPromotionService.update(Number(id), payload)
        toast.success('Promoção atualizada com sucesso')
      } else {
        await adminPromotionService.create(payload)
        toast.success('Promoção criada com sucesso')
      }
      navigate('/admin/promocoes')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar promoção')
    } finally {
      setLoading(false)
    }
  }

  const toggleProduct = (productId: number) => {
    const newSelected = selectedProducts.includes(productId)
      ? selectedProducts.filter(id => id !== productId)
      : [...selectedProducts, productId]
    setSelectedProducts(newSelected)
    setValue('productIds', newSelected)
  }

  return (
    <AdminLayout
      title={id ? 'Editar Promoção' : 'Nova Promoção'}
      description={id ? 'Atualize os dados da promoção' : 'Crie uma nova promoção'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <Input {...register('name')} placeholder="Nome da promoção" />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <Textarea {...register('description')} placeholder="Descrição da promoção" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Desconto</label>
            <Select defaultValue="percentage" onValueChange={v => setValue('discountType', v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentual (%)</SelectItem>
                <SelectItem value="fixed">Fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valor do Desconto</label>
            <Input
              {...register('discountValue', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="0.00"
            />
            {errors.discountValue && <p className="text-red-500 text-sm">{errors.discountValue.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Válida de</label>
            <Input {...register('validFrom')} type="date" />
            {errors.validFrom && <p className="text-red-500 text-sm">{errors.validFrom.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Válida até</label>
            <Input {...register('validTo')} type="date" />
            {errors.validTo && <p className="text-red-500 text-sm">{errors.validTo.message}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox {...register('isActive')} id="isActive" />
          <label htmlFor="isActive" className="text-sm font-medium">Ativa</label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Produtos</label>
          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
            {products.map(product => (
              <label key={product.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => toggleProduct(product.id)}
                />
                <span className="text-sm">{product.name}</span>
              </label>
            ))}
          </div>
          {errors.productIds && <p className="text-red-500 text-sm">{errors.productIds.message}</p>}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/promocoes')}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminLayout>
  )
}
