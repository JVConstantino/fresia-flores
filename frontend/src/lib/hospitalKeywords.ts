/** Palavras-chave que indicam endereço de hospital/maternidade. */
const HOSPITAL_TERMS = ['hospital', 'upa', 'clinica', 'maternidade', 'santa casa', 'pronto socorro', 'pronto-socorro']

function normalize(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Detecção simples (case/acento-insensível) de endereço de hospital. */
export function looksLikeHospital(text: string): boolean {
  const t = normalize(text)
  if (!t.trim()) return false
  return HOSPITAL_TERMS.some(term => t.includes(term))
}
