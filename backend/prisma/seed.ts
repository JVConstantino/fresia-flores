import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const NEIGHBORHOODS: { name: string; fee: number }[] = [
  { name: 'ALTO DAS BRAUNES', fee: 13 },
  { name: 'ALTO DE OLARIA', fee: 13 },
  { name: 'ALTO DO CALEDONIA', fee: 31 },
  { name: 'ALTO DO CASCATINHA (CANTAO SUICO)', fee: 21 },
  { name: 'ALTO DO FLORESTA', fee: 21 },
  { name: 'ALTO DO MOZER', fee: 21 },
  { name: 'ALTO DO SCHUENCK', fee: 51 },
  { name: 'ALTO DOS 50', fee: 51 },
  { name: 'AMPARO', fee: 33 },
  { name: 'BOA ESPERANCA', fee: 81 },
  { name: 'BOM JARDIM', fee: 51 },
  { name: 'BOM JESUS 1 E 2', fee: 15 },
  { name: 'BRAUNES', fee: 12 },
  { name: 'CALEDONIA (ATE CALEDONIA INN)', fee: 26 },
  { name: 'CAMPO DO COELHO', fee: 36 },
  { name: 'CANTO DO RIACHO', fee: 23 },
  { name: 'CARDINOT', fee: 34 },
  { name: 'CASCATINHA', fee: 16 },
  { name: 'CATARCIONE', fee: 13 },
  { name: 'CENTRO', fee: 11 },
  { name: 'CHACARA ATE UNIMED', fee: 14 },
  { name: 'CHACARA DEPOIS UNIMED', fee: 17 },
  { name: 'CONEGO (ATE IGREJA ADVENTISTA)', fee: 13 },
  { name: 'COND. STUKY', fee: 27 },
  { name: 'CONDOMINIO REMANSO PERISSE', fee: 14 },
  { name: 'CONQUISTA', fee: 46 },
  { name: 'CONSELHEIRO PAULINO', fee: 16 },
  { name: 'CORDOEIRA', fee: 12 },
  { name: 'CORREGO DANTAS (ATE EBMA)', fee: 17 },
  { name: 'CORREGO DANTAS (DEPOIS EBMA)', fee: 23 },
  { name: 'DEBOSSAN', fee: 29 },
  { name: 'DUAS PEDRAS', fee: 13 },
  { name: 'FAZENDA BELA VISTA', fee: 20 },
  { name: 'FAZENDA DA LAJE (ATE CEMITERIO)', fee: 23 },
  { name: 'FAZENDA DA LAJE (APOS CEMITERIO)', fee: 29 },
  { name: 'FLORESTA', fee: 19 },
  { name: 'FURNAS', fee: 28 },
  { name: 'GALDINOPOLIS', fee: 81 },
  { name: 'GENERAL OSORIO', fee: 11 },
  { name: 'GIRASSOL', fee: 17 },
  { name: 'GRANJA DO CEU', fee: 16 },
  { name: 'GRANJA MIMOSA', fee: 16 },
  { name: 'GRANJA SPINELLI', fee: 19 },
  { name: 'HORTO DO VINO', fee: 18 },
  { name: 'HOSPITAL RAUL SERTA', fee: 13 },
  { name: 'HOSPITAL SAO LUCAS', fee: 14 },
  { name: 'HOSPITAL UNIMED', fee: 16 },
  { name: 'JARDILANDIA', fee: 15 },
  { name: 'JARDIM CALIFORNIA', fee: 18 },
  { name: 'JARDIM MARAJOI', fee: 17 },
  { name: 'JARDIM OURO PRETO', fee: 14 },
  { name: 'LAGOINHA', fee: 13 },
  { name: 'LAZARETO', fee: 15 },
  { name: 'LUMIAR', fee: 71 },
  { name: 'MACAE DE CIMA', fee: 91 },
  { name: 'MARIA TEREZA', fee: 21 },
  { name: 'MARINGA', fee: 31 },
  { name: 'MARECHAL RONDON', fee: 15 },
  { name: 'MORRO DOS MAIAS / BELMONT', fee: 21 },
  { name: 'MURY ATE PATRULHA', fee: 18 },
  { name: 'MURY DEPOIS PATRULHA', fee: 21 },
  { name: 'NOVA SUICA', fee: 19 },
  { name: 'OLARIA', fee: 12 },
  { name: 'P. SAUDADE ATE BUSCKY', fee: 13 },
  { name: 'P. SAUDADE APOS BUSCKY', fee: 17 },
  { name: 'PARADA FOLLY', fee: 26 },
  { name: 'PARQUE DAS FLORES', fee: 23 },
  { name: 'PARQUE IMPERIAL', fee: 18 },
  { name: 'PARQUE SAO CLEMENTE', fee: 12 },
  { name: 'PERISSE', fee: 12 },
  { name: 'PRACA DA FURANFA', fee: 17 },
  { name: 'PRADO', fee: 15 },
  { name: 'RIO BONITO', fee: 91 },
  { name: 'RIO GRANDE DE CIMA', fee: 71 },
  { name: 'RIOGRANDINA', fee: 33 },
  { name: 'RUA EUTERPE FRIBURGUENSE', fee: 11 },
  { name: 'RUI SANGLARD', fee: 15 },
  { name: 'SALINAS', fee: 91 },
  { name: 'SANATORIO NAVAL', fee: 13 },
  { name: 'SANTA BERNADETE', fee: 17 },
  { name: 'SANTA ELIZA', fee: 13 },
  { name: 'SANTA TEREZINHA (SAO JORGE)', fee: 18 },
  { name: 'SAO CRISTOVAO', fee: 15 },
  { name: 'SAO GERALDO ATE SERRA AZUL', fee: 16 },
  { name: 'SAO GERALDO APOS SERRA AZUL', fee: 20 },
  { name: 'SAO GERALDO VALE DA MONTANHA', fee: 21 },
  { name: 'SAO JORGE', fee: 18 },
  { name: 'SAO LOURENCO', fee: 91 },
  { name: 'SAO PEDRO', fee: 81 },
  { name: 'SANTO ANDRE', fee: 16 },
  { name: 'SERRA NEVADA', fee: 31 },
  { name: 'SERRAVILLE', fee: 12 },
  { name: 'SITIO SAO LUIZ', fee: 16 },
  { name: 'SOLARES', fee: 16 },
  { name: 'STUCKY', fee: 46 },
  { name: 'TERRA NOVA', fee: 21 },
  { name: 'THEODORO', fee: 31 },
  { name: 'TINGUILY', fee: 13 },
  { name: 'TOLEDO', fee: 45 },
  { name: 'TRES IRMAOS', fee: 18 },
  { name: 'VALE DOS PINHEIROS', fee: 13 },
  { name: 'VARGEM ALTA (ATE HORTO HERCKET)', fee: 66 },
  { name: 'VARGEM GRANDE CONEGO', fee: 16 },
  { name: 'VARGINHA', fee: 16 },
  { name: 'VILA AMELIA', fee: 12 },
  { name: 'VILA NOVA', fee: 13 },
  { name: 'VILAGE', fee: 13 },
  { name: 'YPU', fee: 12 },
]

async function main() {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.neighborhood.deleteMany()
  await prisma.city.deleteMany()
  await prisma.address.deleteMany()
  await prisma.user.deleteMany()

  const adminHash = await bcrypt.hash('Lets291224#', 12)
  await prisma.user.create({
    data: { name: 'Constantino', email: 'constantino.dev.br@gmail.com', passwordHash: adminHash, isAdmin: true },
  })

  const novaFriburgo = await prisma.city.create({
    data: { name: 'Nova Friburgo', state: 'RJ', ibgeCode: '3303401' },
  })

  await prisma.neighborhood.createMany({
    data: NEIGHBORHOODS.map(n => ({ cityId: novaFriburgo.id, name: n.name, deliveryFee: n.fee, isActive: true })),
  })

  const buques    = await prisma.category.create({ data: { name: 'Buques',    slug: 'buques'    } })
  const arranjos  = await prisma.category.create({ data: { name: 'Arranjos',  slug: 'arranjos'  } })
  const plantas   = await prisma.category.create({ data: { name: 'Plantas',   slug: 'plantas'   } })
  const presentes = await prisma.category.create({ data: { name: 'Presentes', slug: 'presentes' } })

  const products = [
    { name: 'Buque Primavera Rosa', slug: 'buque-primavera-rosa', categoryId: buques.id, description: 'Um buque fresco e delicado, perfeito para presentear em qualquer ocasiao especial.', price: 89, stock: 23, variants: [{ name: 'Pequeno', price: 89, stock: 10 }, { name: 'Medio', price: 119, stock: 8 }, { name: 'Grande', price: 159, stock: 5 }] },
    { name: 'Buque Amor Eterno', slug: 'buque-amor-eterno', categoryId: buques.id, description: 'Rosas vermelhas selecionadas, simbolo do amor verdadeiro e eterno.', price: 129, stock: 13, variants: [{ name: '12 Rosas', price: 129, stock: 8 }, { name: '24 Rosas', price: 219, stock: 5 }] },
    { name: 'Buque Silvestre', slug: 'buque-silvestre', categoryId: buques.id, description: 'Flores silvestres coloridas para um toque natural e espontaneo.', price: 75, stock: 18, variants: [{ name: 'Pequeno', price: 75, stock: 12 }, { name: 'Grande', price: 115, stock: 6 }] },
    { name: 'Arranjo Tropical', slug: 'arranjo-tropical', categoryId: arranjos.id, description: 'Flores exoticas e tropicais que trazem alegria e cor a qualquer ambiente.', price: 120, stock: 11, variants: [{ name: 'Mesa', price: 120, stock: 7 }, { name: 'Grande', price: 185, stock: 4 }] },
    { name: 'Arranjo Mesa Elegante', slug: 'arranjo-mesa-elegante', categoryId: arranjos.id, description: 'Arranjo sofisticado para decorar mesas de jantar e eventos especiais.', price: 145, stock: 12, variants: [{ name: 'Compacto', price: 145, stock: 6 }, { name: 'Padrao', price: 195, stock: 4 }, { name: 'Premium', price: 265, stock: 2 }] },
    { name: 'Arranjo Campestre', slug: 'arranjo-campestre', categoryId: arranjos.id, description: 'Charme e simplicidade do campo reunidos em um arranjo encantador.', price: 95, stock: 9, variants: [{ name: 'Unico', price: 95, stock: 9 }] },
    { name: 'Suculenta Trio', slug: 'suculenta-trio', categoryId: plantas.id, description: 'Conjunto de tres suculentas cuidadosamente selecionadas, baixa manutencao.', price: 55, stock: 25, variants: [{ name: 'Pequeno', price: 55, stock: 15 }, { name: 'Medio', price: 85, stock: 10 }] },
    { name: 'Orquidea Branca', slug: 'orquidea-branca', categoryId: plantas.id, description: 'Orquidea Phalaenopsis branca, elegante e duradoura, ideal para presentear.', price: 89, stock: 13, variants: [{ name: '1 Haste', price: 89, stock: 8 }, { name: '2 Hastes', price: 149, stock: 5 }] },
    { name: 'Ficus Lyrata', slug: 'ficus-lyrata', categoryId: plantas.id, description: 'A planta queridinha da decoracao, com folhas grandes e marcantes.', price: 120, stock: 12, variants: [{ name: 'P (30cm)', price: 120, stock: 6 }, { name: 'M (60cm)', price: 185, stock: 4 }, { name: 'G (90cm)', price: 265, stock: 2 }] },
    { name: 'Kit Romantico', slug: 'kit-romantico', categoryId: presentes.id, description: 'Buque de rosas, chocolates finos e cartao personalizado para surpreender.', price: 185, stock: 12, variants: [{ name: 'Padrao', price: 185, stock: 8 }, { name: 'Premium', price: 265, stock: 4 }] },
    { name: 'Cesta Floral', slug: 'cesta-floral', categoryId: presentes.id, description: 'Cesta artesanal com flores frescas, ideal para comemoracoes especiais.', price: 145, stock: 9, variants: [{ name: 'Pequena', price: 145, stock: 6 }, { name: 'Grande', price: 215, stock: 3 }] },
    { name: 'Box Especial', slug: 'box-especial', categoryId: presentes.id, description: 'Box exclusiva com flores, vela aromatica e mensagem personalizada.', price: 225, stock: 5, variants: [{ name: 'Unico', price: 225, stock: 5 }] },
  ]

  for (const { variants, ...product } of products) {
    const created = await prisma.product.create({ data: { ...product, images: JSON.stringify([]) } })
    await prisma.productVariant.createMany({ data: variants.map(v => ({ ...v, productId: created.id })) })
  }

  console.log(`Seed concluido: 1 admin, 1 cidade, ${NEIGHBORHOODS.length} bairros, 4 categorias, 12 produtos.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
