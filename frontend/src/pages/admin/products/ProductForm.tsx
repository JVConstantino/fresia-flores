import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { adminProductService } from '@/services/adminProductService'
import { adminCategoryService } from '@/services/adminCategoryService'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.coerce.number().min(1, 'Categoria é obrigatória'),
  price: z.coerce.number().min(0.01, 'Preço deve ser maior que 0'),
  salePrice: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0, 'Estoque não pode ser negativo'),
  images: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  allowCoupons: z.boolean().optional().default(true),
  tags: z.string().optional(),
  variants: z.string().optional(),
  specsTable: z.string().optional()
})

type ProductFormData = z.infer<typeof productSchema>

interface Variant {
  id?: number
  name: string
  description?: string
  price: number
  salePrice?: number | null
  stock: number
  images?: string
}


interface ProductModalProps {
  productId: number | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function ProductModal({ productId, open, onClose, onSaved }: ProductModalProps) {
  const isEdit = productId !== null
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState<Variant[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [mediaPicker, setMediaPicker] = useState<{ open: boolean; target: 'main' | number }>({ open: false, target: 'main' })
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: { isActive: true, isFeatured: false, allowCoupons: true }
  })

  useEffect(() => {
    if (!open) return
    if (productId !== null) {
      // Carregar categorias primeiro, depois o produto para garantir que o Select tenha as opções
      setLoading(true)
      loadCategories().then(() => loadProduct(productId))
    } else {
      loadCategories()
      reset({ isActive: true, isFeatured: false, allowCoupons: true, name: '', slug: '', description: '', shortDescription: '' })
      setVariants([])
      setTags([])
      setTagInput('')
      setUploadedImages([])
    }
  }, [open, productId])

  const loadCategories = async () => {
    try {
      const result = await adminCategoryService.getAll(1, 100)
      setCategories(Array.isArray(result) ? result : result.data || [])
    } catch (err: any) {
      toast.error('Erro ao carregar categorias')
    }
  }



  const loadProduct = async (id: number) => {
    try {
      const product = await adminProductService.getById(id)
      reset({
        name: product.name ?? '',
        slug: product.slug ?? '',
        description: product.description ?? '',
        shortDescription: (product as any).shortDescription ?? '',
        categoryId: product.categoryId,
        price: product.price,
        salePrice: product.salePrice ?? undefined,
        stock: product.stock,
        images: typeof product.images === 'string' ? product.images : JSON.stringify(product.images ?? []),
        isActive: product.isActive ?? true,
        isFeatured: (product as any).isFeatured ?? false,
        allowCoupons: (product as any).allowCoupons ?? true,
      })
      if (product.images) {
        try {
          const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images
          if (Array.isArray(imgs)) setUploadedImages(imgs)
        } catch {}
      }
      if (Array.isArray((product as any).variants) && (product as any).variants.length > 0) {
        setVariants((product as any).variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          description: v.description ?? '',
          price: parseFloat(v.price),
          salePrice: v.salePrice ? parseFloat(v.salePrice) : null,
          stock: v.stock,
          images: v.images ?? '',
        })))
      }
    } catch (err: any) {
      toast.error('Erro ao carregar produto')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true)
      const payload: any = {
        name: data.name,
        slug: data.slug || undefined,
        description: data.description,
        categoryId: Number(data.categoryId),
        price: Number(data.price),
        salePrice: data.salePrice ? Number(data.salePrice) : null,
        stock: Number(data.stock),
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        allowCoupons: data.allowCoupons ?? true,
        images: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : (data.images || null),
        variants: variants,
      }
      if (isEdit) {
        await adminProductService.update(productId!, payload)
        toast.success('Produto atualizado com sucesso')
      } else {
        await adminProductService.create(payload)
        toast.success('Produto criado com sucesso')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar produto')
    } finally {
      setLoading(false)
    }
  }


  const addVariant = () => {
    setVariants([...variants, { name: '', price: 0, salePrice: null, stock: 0, description: '', images: '' }])
  }

  const updateVariant = (idx: number, field: keyof Variant, value: any) => {
    const updated = [...variants]
    updated[idx] = { ...updated[idx], [field]: value }
    setVariants(updated)
  }

  const removeVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx))
  }

  const handleVariantImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    try {
      const uploaded: string[] = []
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        uploaded.push(data.url)
      }
      const existing = (() => {
        try { return JSON.parse(variants[idx].images || '[]') } catch { return [] }
      })()
      updateVariant(idx, 'images', JSON.stringify([...existing, ...uploaded]))
      toast.success('Foto(s) da variação enviada(s)')
    } catch {
      toast.error('Erro ao enviar foto da variação')
    } finally {
      if (e.target) e.target.value = ''
    }
  }

  const removeVariantImage = (variantIdx: number, imgIdx: number) => {
    const imgs = (() => {
      try { return JSON.parse(variants[variantIdx].images || '[]') } catch { return [] }
    })()
    imgs.splice(imgIdx, 1)
    updateVariant(variantIdx, 'images', JSON.stringify(imgs))
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setUploadedImages(prev => [...prev, data.url])
      }
      toast.success('Imagem(ns) enviada(s) com sucesso')
    } catch (err: any) {
      toast.error('Erro ao fazer upload: ' + (err.response?.data?.error || err.message))
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const removeImage = (idx: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    if (uploadedImages.length > 0) {
      setValue('images', JSON.stringify(uploadedImages))
    }
  }, [uploadedImages, setValue])

  const name = watch('name')
  const autoSlug = name
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-5 gap-6 pt-2">
        <div className="lg:col-span-3 space-y-2">
          <Accordion type="multiple" defaultValue={['basic']} className="space-y-3">
          {/* BÁSICO */}
          <AccordionItem value="basic" className="border border-ink-200 rounded-md overflow-hidden px-0">
            <AccordionTrigger className="px-4 py-3 bg-ink-50 hover:bg-ink-100 hover:no-underline font-semibold text-ink-800 text-sm [&[data-state=open]]:border-b [&[data-state=open]]:border-ink-200">
              Informações Básicas
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-4 pb-4 space-y-4 bg-white">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <Input {...register('name')} placeholder="Ex: Buquê Rosas Vermelhas" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição Curta</label>
              <Input {...register('shortDescription')} placeholder="Descrição para listas" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição Completa</label>
              <Textarea {...register('description')} placeholder="Detalhes do produto..." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoria *</label>
              <Select
                value={watch('categoryId')?.toString() || ''}
                onValueChange={v => setValue('categoryId', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
            </div>
          </AccordionContent>
          </AccordionItem>

          {/* MÍDIA */}
          <AccordionItem value="media" className="border border-ink-200 rounded-md overflow-hidden px-0">
            <AccordionTrigger className="px-4 py-3 bg-ink-50 hover:bg-ink-100 hover:no-underline font-semibold text-ink-800 text-sm [&[data-state=open]]:border-b [&[data-state=open]]:border-ink-200">
              Mídia
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-4 pb-4 bg-white">
            <div className="space-y-4">
              <div>
                <label htmlFor="image-upload" className="block text-sm font-medium mb-2 cursor-pointer">
                  <div className="border-2 border-dashed border-lilac-300 rounded-lg p-6 text-center hover:bg-lilac-50 transition-colors">
                    <Upload size={24} className="mx-auto mb-2 text-lilac-500" />
                    <p className="font-medium text-ink-800">Clique para fazer upload</p>
                    <p className="text-xs text-ink-500 mt-1">ou arraste imagens aqui</p>
                  </div>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 gap-2"
                  onClick={() => setMediaPicker({ open: true, target: 'main' })}
                >
                  Escolher da galeria
                </Button>
              </div>

              {uploadedImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Imagens Enviadas</label>
                  <div className="grid grid-cols-3 gap-3">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt="Uploaded"
                          className="w-full h-24 object-cover rounded border border-ink-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Ou Cole URLs Manualmente</label>
                <Textarea
                  {...register('images')}
                  placeholder='["https://...jpg", "https://...jpg"]'
                  rows={2}
                />
                <p className="text-xs text-ink-500 mt-1">Array JSON de URLs (substitui upload)</p>
              </div>
            </div>
          </AccordionContent>
          </AccordionItem>

          {/* PREÇOS */}
          <AccordionItem value="prices" className="border border-ink-200 rounded-md overflow-hidden px-0">
            <AccordionTrigger className="px-4 py-3 bg-ink-50 hover:bg-ink-100 hover:no-underline font-semibold text-ink-800 text-sm [&[data-state=open]]:border-b [&[data-state=open]]:border-ink-200">
              Preços &amp; Estoque
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-4 pb-4 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preço *</label>
                <Input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Preço de Promoção</label>
                <Input
                  {...register('salePrice', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
                <p className="text-xs text-ink-500 mt-1">Deixe vazio para sem promoção</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estoque</label>
              <Input
                {...register('stock', { valueAsNumber: true })}
                type="number"
                placeholder="0"
              />
              {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="allowCoupons"
                render={({ field }) => (
                  <Checkbox
                    id="allowCoupons"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label htmlFor="allowCoupons" className="text-sm font-medium cursor-pointer">
                Permite cupons de desconto
              </label>
            </div>
          </AccordionContent>
          </AccordionItem>

          {/* VARIAÇÕES */}
          <AccordionItem value="variants" className="border border-ink-200 rounded-md overflow-hidden px-0">
            <AccordionTrigger className="px-4 py-3 bg-ink-50 hover:bg-ink-100 hover:no-underline font-semibold text-ink-800 text-sm [&[data-state=open]]:border-b [&[data-state=open]]:border-ink-200">
              {`Variações ${variants.length > 0 ? `(${variants.length})` : ''}`}
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-4 pb-4 bg-white">
            <p className="text-xs text-ink-500 bg-ink-50 rounded p-2">
              Variações permitem oferecer o mesmo produto com diferenças de composição, tamanho ou apresentação, cada uma com preço, estoque e fotos próprios.
            </p>

            <div className="space-y-4">
              {variants.map((variant, idx) => {
                const varImgs: string[] = (() => { try { return JSON.parse(variant.images || '[]') } catch { return [] } })()
                return (
                  <div key={idx} className="border border-ink-200 rounded-lg overflow-hidden">
                    {/* Header da variação */}
                    <div className="flex items-center justify-between px-4 py-2 bg-ink-50 border-b border-ink-200">
                      <span className="text-sm font-semibold text-ink-700">
                        Variação {idx + 1}{variant.name ? ` — ${variant.name}` : ''}
                      </span>
                      <Button type="button" size="sm" variant="destructive" onClick={() => removeVariant(idx)}>
                        Remover
                      </Button>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Nome e Descrição */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-ink-700 mb-1">
                            Nome da variação *
                            <span className="font-normal text-ink-500 ml-1">— Ex: "Buquê 3 hastes", "Rosa Pink", "Caixa G"</span>
                          </label>
                          <Input
                            placeholder="Ex: Rosa Vermelha 5 hastes"
                            value={variant.name}
                            onChange={e => updateVariant(idx, 'name', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink-700 mb-1">
                            Descrição curta
                            <span className="font-normal text-ink-500 ml-1">— Detalhe exibido ao cliente na seleção</span>
                          </label>
                          <Input
                            placeholder="Ex: Inclui fita de cetim e embalagem kraft"
                            value={variant.description || ''}
                            onChange={e => updateVariant(idx, 'description', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Preços e Estoque */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-ink-700 mb-1">
                            Preço (R$) *
                            <span className="font-normal text-ink-500 ml-1">— Valor de venda desta variação</span>
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={variant.price || ''}
                            onChange={e => updateVariant(idx, 'price', Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink-700 mb-1">
                            Preço promocional (R$)
                            <span className="font-normal text-ink-500 ml-1">— Deixe vazio para sem promoção</span>
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={variant.salePrice || ''}
                            onChange={e => updateVariant(idx, 'salePrice', e.target.value ? Number(e.target.value) : null)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink-700 mb-1">
                            Estoque *
                            <span className="font-normal text-ink-500 ml-1">— Unidades disponíveis</span>
                          </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={variant.stock || ''}
                            onChange={e => updateVariant(idx, 'stock', Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Fotos da variação */}
                      <div>
                        <label className="block text-xs font-semibold text-ink-700 mb-2">
                          Fotos da variação
                          <span className="font-normal text-ink-500 ml-1">— Substituem as fotos do produto quando esta variação é selecionada</span>
                        </label>
                        <div className="flex gap-3 flex-wrap">
                          {varImgs.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative group w-20 h-20 rounded border border-ink-200 overflow-hidden">
                              <img src={img} alt={`variante-${idx}-${imgIdx}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeVariantImage(idx, imgIdx)}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={16} className="text-white" />
                              </button>
                            </div>
                          ))}
                          <label className="w-20 h-20 rounded border-2 border-dashed border-lilac-300 flex flex-col items-center justify-center cursor-pointer hover:bg-lilac-50 transition-colors">
                            <Upload size={16} className="text-lilac-400 mb-1" />
                            <span className="text-[10px] text-lilac-500 text-center leading-tight">Adicionar foto</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={e => handleVariantImageUpload(idx, e)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <Button
                type="button"
                variant="outline"
                onClick={addVariant}
                className="w-full border-dashed border-lilac-300 text-lilac-600 hover:bg-lilac-50"
              >
                + Adicionar Variação
              </Button>
            </div>

            <hr className="border-ink-200" />

            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Digite uma tag"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addTag}
                  className="bg-lilac-500 hover:bg-lilac-600"
                >
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <div key={tag} className="bg-lilac-100 text-lilac-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-lilac-900"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
          </AccordionItem>

          {/* SEO */}
          <AccordionItem value="seo" className="border border-ink-200 rounded-md overflow-hidden px-0">
            <AccordionTrigger className="px-4 py-3 bg-ink-50 hover:bg-ink-100 hover:no-underline font-semibold text-ink-800 text-sm [&[data-state=open]]:border-b [&[data-state=open]]:border-ink-200">
              SEO &amp; Extras
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-4 pb-4 bg-white">
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <Input
                {...register('slug')}
                placeholder={autoSlug || 'auto-generated'}
                className="font-mono text-sm"
              />
              <p className="text-xs text-ink-500 mt-1">Deixe vazio para gerar automaticamente</p>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="isFeatured"
                render={({ field }) => (
                  <Checkbox
                    id="isFeatured"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label htmlFor="isFeatured" className="text-sm font-medium cursor-pointer">
                Destacado na home
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Checkbox
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                Produto ativo
              </label>
            </div>
          </AccordionContent>
          </AccordionItem>
          </Accordion>
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-2">
          <div className="bg-ink-50 rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-ink-800">Ações</h4>
              <div className="flex gap-2 flex-col">
                <Button type="submit" disabled={loading} className="bg-lilac-500 hover:bg-lilac-600 w-full">
                  {loading ? 'Salvando...' : 'Salvar Produto'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>

            <hr className="border-ink-200" />

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-ink-800 mb-3">Resumo</h4>
                <div className="bg-white rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-600">Nome:</span>
                    <span className="font-medium text-ink-800 truncate ml-2">{watch('name') || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Categoria:</span>
                    <span className="font-medium text-ink-800">
                      {categories.find(c => c.id === watch('categoryId'))?.name || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Preço:</span>
                    <span className="font-medium text-lilac-600">R$ {(Number(watch('price')) || 0).toFixed(2)}</span>
                  </div>
                  {watch('salePrice') && (
                    <div className="flex justify-between">
                      <span className="text-ink-600">Promoção:</span>
                      <span className="font-medium text-petal-500 line-through">R$ {Number(watch('salePrice')).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-600">Estoque:</span>
                    <span className="font-medium text-ink-800">{watch('stock') || 0}</span>
                  </div>
                </div>
              </div>

              <hr className="border-ink-200" />

              <div>
                <h4 className="font-semibold text-sm text-ink-800 mb-3">Configuração</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-white">
                    <span className="text-xs text-ink-600">Ativo</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${watch('isActive') ? 'bg-leaf-100 text-leaf-700' : 'bg-ink-200 text-ink-700'}`}>
                      {watch('isActive') ? '✓ Sim' : '✗ Não'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white">
                    <span className="text-xs text-ink-600">Destaque</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${watch('isFeatured') ? 'bg-petal-100 text-petal-600' : 'bg-ink-200 text-ink-700'}`}>
                      {watch('isFeatured') ? '⭐ Sim' : '○ Não'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white">
                    <span className="text-xs text-ink-600">Permite cupom</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${watch('allowCoupons') ? 'bg-leaf-100 text-leaf-700' : 'bg-ink-200 text-ink-700'}`}>
                      {watch('allowCoupons') ? '✓ Sim' : '✗ Não'}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-ink-200" />

              <div>
                <h4 className="font-semibold text-sm text-ink-800 mb-2">Imagens</h4>
                <div className="text-xs text-ink-600">
                  {uploadedImages.length > 0 ? (
                    <div className="space-y-2">
                      <p className="font-medium">{uploadedImages.length} imagem(ns) enviada(s)</p>
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedImages.slice(0, 6).map((img, i) => (
                          <div key={i} className="aspect-square rounded border border-ink-200 bg-ink-50 overflow-hidden">
                            <img src={img} alt={`preview-${i}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-ink-500">Nenhuma imagem enviada</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <MediaPicker
        open={mediaPicker.open}
        onClose={() => setMediaPicker({ open: false, target: 'main' })}
        multiple={true}
        selectedUrls={mediaPicker.target === 'main' ? uploadedImages : []}
        onSelect={(urls) => {
          if (mediaPicker.target === 'main') {
            setUploadedImages([...new Set([...uploadedImages, ...urls])])
          } else {
            const idx = mediaPicker.target as number
            const variantImages = JSON.parse(variants[idx]?.images || '[]')
            const merged = [...new Set([...variantImages, ...urls])]
            setVariants(v => v.map((vt, i) => i === idx ? { ...vt, images: JSON.stringify(merged) } : vt))
          }
        }}
      />
      </DialogContent>
    </Dialog>
  )
}
