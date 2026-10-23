// Converte texto digitado no padrão brasileiro para número.
// Aceita: "3000", "3.000", "3.000,50", "10,85", "10.85", "10,85%", "R$ 1.200"
export function parseNumeroBR(input) {
  if (input === null || input === undefined) return NaN
  let s = String(input)
    .trim()
    .replace(/\s/g, '')
    .replace(/%/g, '')
    .replace(/R\$/gi, '')

  if (!s) return NaN

  let negativo = false
  if (/^\(.*\)$/.test(s)) {
    negativo = true
    s = s.slice(1, -1)
  }
  if (s.startsWith('-')) {
    negativo = true
    s = s.slice(1)
  } else if (s.startsWith('+')) {
    s = s.slice(1)
  }

  const temVirgula = s.includes(',')
  const temPonto = s.includes('.')

  if (temVirgula) {
    // vírgula é decimal; pontos são separadores de milhar
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (temPonto) {
    // "3.000" / "1.234.567" -> separador de milhar
    // "10.85" -> ponto decimal
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  }

  const n = Number(s)
  if (!Number.isFinite(n)) return NaN
  return negativo ? -n : n
}

// Formata número no padrão brasileiro (3.000 / 10,85 / 10,85%)
export function formatNumeroBR(value, { percentual = false } = {}) {
  const n = typeof value === 'number' ? value : parseNumeroBR(value)
  if (Number.isNaN(n)) return ''
  const texto = n.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return percentual ? `${texto}%` : texto
}
