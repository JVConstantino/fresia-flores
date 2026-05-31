import type { Category } from '@/services/categoryService'

/** URL amigável da categoria curada de presentes para hospitais/maternidades. */
export const HOSPITAL_GIFTS_PATH = '/presentes-para-hospitais-maternidades'

/** Slugs de categorias permitidas em hospitais (balões, pelúcias, chocolates). */
export const HOSPITAL_CATEGORY_SLUGS = ['baloes', 'pelucias', 'chocolates']

/** Palavras-chave de nome como fallback caso os slugs não batam exatamente. */
const NAME_KEYWORDS = ['balao', 'balão', 'pelucia', 'pelúcia', 'chocolate']

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Filtra as categorias permitidas em hospitais a partir da lista completa. */
export function selectHospitalCategories(categories: Category[]): Category[] {
  return categories.filter(c => {
    const slug = normalize(c.slug || '')
    const name = normalize(c.name || '')
    if (HOSPITAL_CATEGORY_SLUGS.some(s => slug === normalize(s) || slug.includes(normalize(s)))) return true
    return NAME_KEYWORDS.some(k => name.includes(normalize(k)))
  })
}
