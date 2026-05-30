/**
 * Recadastra o catálogo do arquivo catalogo_produtos_fresia.md.
 * - Apaga todos os products + variants + wishlist + orderItems sem owner (cuidado: também limpa pedidos!)
 *   Para evitar perda, este script só apaga produtos e variantes — pedidos antigos ficam órfãos das FK.
 *   Como o schema usa onDelete padrão, ajustamos para limpar wishlist e orderItems primeiro.
 *
 * Uso: cd backend && npx tsx scripts/seedCatalog.ts
 */
import { prisma } from '../src/prisma/client'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface ProductSeed {
  name: string
  category: string
  shortDescription: string
  description: string
  variantNames?: string[]
}

// 21 produtos do catalogo (excluindo entradas "nan")
const CATALOG: ProductSeed[] = [
  {
    name: 'Buque de Rosas',
    category: 'Buquês',
    shortDescription: 'Buque de Rosas ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Buque de Rosas é uma excelente opção da categoria buquês, ideal para quem busca rosas nacionais ou importadas. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como vermelho / branco / rosas / chá / pink / amarelo / laranja. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Vermelho', 'Branco', 'Rosa', 'Chá', 'Pink', 'Amarelo', 'Laranja'],
  },
  {
    name: 'Buquês Elegancia de Rosas Chá',
    category: 'Buquês',
    shortDescription: 'Buquês Elegancia de Rosas Chá ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Buquês Elegancia de Rosas Chá é uma excelente opção da categoria buquês, ideal para quem busca rosas nacionais. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como champanhe. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Champanhe'],
  },
  {
    name: 'Buquê Doçura - Rosas Rosa',
    category: 'Buquês',
    shortDescription: 'Buquê Doçura - Rosas Rosa ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Buquê Doçura - Rosas Rosa é uma excelente opção da categoria buquês, ideal para quem busca rosas nacionais. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como rosa. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Rosa'],
  },
  {
    name: 'Buquê Amável - Rosas Brancas',
    category: 'Buquês',
    shortDescription: 'Buquê Amável - Rosas Brancas ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Buquê Amável - Rosas Brancas é uma excelente opção da categoria buquês, ideal para quem busca rosas nacionais. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como branco, rosa, vermelho, amarelo. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Branco', 'Rosa', 'Vermelho', 'Amarelo'],
  },
  {
    name: 'Buquê Raio de Sol - Girassois',
    category: 'Buquês',
    shortDescription: 'Buquê Raio de Sol - Girassois ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Buquê Raio de Sol - Girassois é uma excelente opção da categoria buquês, ideal para quem busca girassol. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como amarelo. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Amarelo'],
  },
  {
    name: 'Jardim Coloridos - Alstroemerias',
    category: 'Buquês',
    shortDescription: 'Jardim Coloridos - Alstroemerias ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Jardim Coloridos - Alstroemerias é uma excelente opção da categoria buquês, ideal para quem busca alstroemérias. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como mono ou poli. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Mono', 'Poli'],
  },
  {
    name: 'Buquê Mix de Flores',
    category: 'Buquês',
    shortDescription: 'Buquê Mix de Flores ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Buquê Mix de Flores é uma excelente opção da categoria buquês, ideal para quem busca rosas nacionais. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como tons de rosa. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Tons de Rosa'],
  },
  {
    name: 'Buquê Mix de Flores Brancas',
    category: 'Buquês',
    shortDescription: 'Buquê Mix de Flores Brancas ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Buquê Mix de Flores Brancas é uma excelente opção da categoria buquês, ideal para quem busca rosas nacionais. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como branco, rosa, vermelho, amarelo. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Branco', 'Rosa', 'Vermelho', 'Amarelo'],
  },
  {
    name: 'Buquê Mix da Estação Rosa',
    category: 'Buquês',
    shortDescription: 'Buquê Mix da Estação Rosa ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Buquê Mix da Estação Rosa é uma excelente opção da categoria buquês, ideal para quem busca rosas nacionais. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como rosa. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Rosa'],
  },
  {
    name: 'Box Mix de Flores da Estação',
    category: 'Box',
    shortDescription: 'Box Mix de Flores da Estação ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Box Mix de Flores da Estação é uma excelente opção da categoria box, ideal para quem busca flores do campo. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como flores do campo. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Flores do Campo'],
  },
  {
    name: 'Orquídea Phalaneopolis',
    category: 'Plantas',
    shortDescription: 'Orquídea Phalaneopolis ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Orquídea Phalaneopolis é uma excelente opção da categoria plantas, ideal para quem busca orquídea. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como conferir opções disponíveis. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
  },
  {
    name: 'Orquídea Embalada No Cachepot',
    category: 'Plantas',
    shortDescription: 'Orquídea Embalada No Cachepot ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Orquídea Embalada No Cachepot é uma excelente opção da categoria plantas, ideal para quem busca orquídea. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como lilás e branca. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Lilás', 'Branca'],
  },
  {
    name: 'Orquídea Em Vidro Lilás',
    category: 'Plantas',
    shortDescription: 'Orquídea Em Vidro ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Orquídea Em Vidro é uma excelente opção da categoria plantas, ideal para quem busca orquídea. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como lilás. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Lilás'],
  },
  {
    name: 'Orquídea Em Vidro Branco',
    category: 'Plantas',
    shortDescription: 'Orquídea Em Vidro ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Orquídea Em Vidro é uma excelente opção da categoria plantas, ideal para quem busca orquídea. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como branco. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Branco'],
  },
  {
    name: 'Combinado Perfeito',
    category: 'Box',
    shortDescription: 'Combinado Perfeito ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Combinado Perfeito é uma excelente opção da categoria box, ideal para quem busca mini buque com mini vinho e ferrero. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como branco, vermelho, amarelo, rosa. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Branco', 'Vermelho', 'Amarelo', 'Rosa'],
  },
  {
    name: 'Buquê Eterno',
    category: 'Buquês',
    shortDescription: 'Buquê Eterno ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Buquê Eterno é uma excelente opção da categoria buquês, ideal para quem busca rosas nacionais ou importadas. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como vermelho. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Vermelho'],
  },
  {
    name: 'Coleção de Plantas Únicas',
    category: 'Plantas',
    shortDescription: 'Coleção de Plantas Únicas ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Coleção de Plantas Únicas é uma excelente opção da categoria plantas, ideal para quem busca variadas. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como conferir opções. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
  },
  {
    name: 'Box Surpresa',
    category: 'Box',
    shortDescription: 'Box Surpresa ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Box Surpresa é uma excelente opção da categoria box, ideal para quem busca flores da estação. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como policromático. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Policromático'],
  },
  {
    name: 'Box Momento Especial',
    category: 'Box',
    shortDescription: 'Box Momento Especial ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Box Momento Especial é uma excelente opção da categoria box, ideal para quem busca mini buque com vinho e petiscos. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como branco, rosa, vermelho, amarelo. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Branco', 'Rosa', 'Vermelho', 'Amarelo'],
  },
  {
    name: 'Box Jardim Colorido',
    category: 'Box',
    shortDescription: 'Box Jardim Colorido ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Box Jardim Colorido é uma excelente opção da categoria box, ideal para quem busca alstroemerias. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como policromático. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Policromático'],
  },
  {
    name: 'Box Apaixonado',
    category: 'Box',
    shortDescription: 'Box Apaixonado ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Box Apaixonado é uma excelente opção da categoria box, ideal para quem busca rosas nacionais ou importadas. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como vermelho. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Vermelho'],
  },
  {
    name: 'Flores No Atacado',
    category: 'Atacado',
    shortDescription: 'Flores No Atacado ideal para presentear com elegância, carinho e sofisticação.',
    description: 'O Flores No Atacado é uma excelente opção da categoria atacado, ideal para quem busca variadas. Produzido com flores selecionadas e acabamento sofisticado, é perfeito para aniversários, datas especiais, decoração e presentes marcantes. Disponível em cores como policromatico. Um produto elegante que transforma qualquer ocasião em um momento inesquecível.',
    variantNames: ['Policromático'],
  },
]

async function main() {
  console.log('🧹 Limpando produtos existentes...')

  // Limpar dependências em ordem (FK)
  await prisma.wishlist.deleteMany({})
  await prisma.orderItem.deleteMany({})
  // Desconectar Product de Promotion (tabela de junção implícita)
  const promos = await prisma.promotion.findMany({ include: { products: true } })
  for (const promo of promos) {
    if (promo.products.length > 0) {
      await prisma.promotion.update({
        where: { id: promo.id },
        data: { products: { set: [] } }
      })
    }
  }
  await prisma.productVariant.deleteMany({})
  await prisma.product.deleteMany({})
  // Não apaga pedidos (Order) — eles ficam sem itens mas registro permanece
  // Também não apaga as categorias existentes — só criamos novas se faltarem

  console.log('✓ Produtos e variantes apagados\n')

  // Garantir categorias
  const categoriasNecessarias = Array.from(new Set(CATALOG.map(p => p.category)))
  const categoriaMap = new Map<string, number>()

  for (const nome of categoriasNecessarias) {
    const slug = slugify(nome)
    let cat = await prisma.category.findUnique({ where: { slug } })
    if (!cat) {
      cat = await prisma.category.create({ data: { name: nome, slug } })
      console.log(`✓ Categoria criada: ${nome}`)
    } else {
      console.log(`• Categoria já existe: ${nome}`)
    }
    categoriaMap.set(nome, cat.id)
  }

  console.log(`\n📦 Inserindo ${CATALOG.length} produtos...\n`)

  for (const p of CATALOG) {
    const categoryId = categoriaMap.get(p.category)!
    // Slug único — se já existir (mesmo nome), append id
    let slug = slugify(p.name)
    const exists = await prisma.product.findUnique({ where: { slug } })
    if (exists) slug = `${slug}-${Date.now()}`

    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug,
        shortDescription: p.shortDescription,
        description: p.description,
        price: 0, // a ser definido depois
        stock: 0,
        images: null,
        isActive: true,
        isFeatured: false,
        allowCoupons: true,
        categoryId,
        variants: p.variantNames ? {
          create: p.variantNames.map(name => ({
            name,
            price: 0,
            stock: 0,
          }))
        } : undefined,
      },
    })

    console.log(`✓ ${product.name}${p.variantNames ? ` (${p.variantNames.length} variantes)` : ''}`)
  }

  console.log(`\n🎉 ${CATALOG.length} produtos cadastrados com sucesso!`)
  console.log(`📌 Próximos passos: definir preços, estoque e fotos no admin (/admin/produtos)`)
}

main()
  .catch(err => {
    console.error('❌ Erro:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
