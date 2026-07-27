// Clasifica un nivel textual en alto / medio / bajo (para colores de barras/badges).
export function kind(n) {
  const s = (n == null ? '' : String(n)).toUpperCase().replace(/_/g, ' ')
  if (s.includes('MUY ALTO') || s.includes('SUPERIOR') || s.includes('SOBRESALIENTE') || s.includes('ALTO') || s.includes('ALTA')) return 'alto'
  if (s.includes('MEDIO') || s.includes('PROMEDIO') || s.includes('MODERAD') || s.includes('NORMAL') || s.includes('SÓLIDO') || s.includes('SOLIDO')) return 'medio'
  return 'bajo'
}

export const fmtNivel = (n) => (n == null ? '' : String(n)).replace(/_/g, ' ')
