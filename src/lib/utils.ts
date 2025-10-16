import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const UNITS = ["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"] as const
const TENS = ["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"] as const
const HUNDREDS = ["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"] as const

function numberToWordsPtBrInt(n: number): string {
  if (n === 0) return "zero"
  if (n < 0) return `menos ${numberToWordsPtBrInt(-n)}`
  let result: string[] = []
  const scales: [number, string, string][] = [
    [1_000_000_000_000, "trilhão", "trilhões"],
    [1_000_000_000, "bilhão", "bilhões"],
    [1_000_000, "milhão", "milhões"],
    [1_000, "mil", "mil"],
  ]

  const belowThousand = (num: number): string => {
    if (num === 0) return ""
    if (num === 100) return "cem"
    const c = Math.floor(num / 100)
    const d = Math.floor((num % 100) / 10)
    const u = num % 10
    const parts: string[] = []
    if (c) parts.push(HUNDREDS[c])
    const du = num % 100
    if (du) {
      if (parts.length) parts.push("e")
      if (du < 20) {
        parts.push(UNITS[du])
      } else {
        parts.push(TENS[d])
        if (u) parts.push("e", UNITS[u])
      }
    }
    return parts.join(" ")
  }

  for (const [value, singular, plural] of scales) {
    if (n >= value) {
      const q = Math.floor(n / value)
      n = n % value
      if (value === 1_000) {
        if (q === 1) result.push("mil")
        else result.push(`${belowThousand(q)} mil`)
      } else {
        result.push(`${q === 1 ? belowThousand(q) + " " + singular : belowThousand(q) + " " + plural}`)
      }
      if (n) result.push(n < 100 ? "e" : ",")
    }
  }
  if (n) result.push(belowThousand(n))
  let out = result.join(" ")
  out = out.replace(/ ,/g, ",").replace(/  +/g, " ")
  out = out.replace(/, e /g, ", ")
  return out.trim()
}

export function numberToCurrencyWordsPtBr(value: number): string {
  const reais = Math.floor(value)
  const centavos = Math.round((value - reais) * 100)
  const reaisText = reais === 0 ? "zero real" : `${numberToWordsPtBrInt(reais)} ${reais === 1 ? "real" : "reais"}`
  const centavosText = centavos === 0 ? "" : `${numberToWordsPtBrInt(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`
  if (centavos === 0) return reaisText
  if (reais === 0) return centavosText
  return `${reaisText} e ${centavosText}`
}
