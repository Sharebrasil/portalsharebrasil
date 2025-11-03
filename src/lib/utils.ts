import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export function formatMinutesToHHMM(totalMinutes: number): string {
  if (!isFinite(totalMinutes) || totalMinutes < 0) totalMinutes = 0
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)
  const adjHours = (minutes === 60) ? hours + 1 : hours
  const adjMinutes = (minutes === 60) ? 0 : minutes
  return `${String(adjHours).padStart(2, "0")}:${String(adjMinutes).padStart(2, "0")}`
}

export function formatDecimalHoursToHHMM(value?: number | string | null): string {
  if (value == null || value === "") return "00:00"
  if (typeof value === "string" && value.includes(":")) {
    const [h, m] = value.split(":")
    const hh = Math.max(0, parseInt(h || "0", 10))
    const mm = Math.max(0, Math.min(59, parseInt(m || "0", 10)))
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
  }
  const num = typeof value === "string" ? parseFloat(value) : value
  if (!isFinite(num as number)) return "00:00"
  const minutes = Math.round((num as number) * 60)
  return formatMinutesToHHMM(minutes)
}

export function parseHHMMToDecimal(value: string): number {
  if (!value) return 0
  if (!value.includes(":")) {
    const n = parseFloat(value)
    if (!isFinite(n)) return 0
    return Math.max(0, n)
  }
  const [h, m] = value.split(":")
  const hours = Math.max(0, parseInt(h || "0", 10))
  const minutes = Math.max(0, Math.min(59, parseInt(m || "0", 10)))
  return hours + minutes / 60
}

const UNITS = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"] as const
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"] as const
const HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"] as const

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

export function formatBRL(value: number | string): string {
  const n = typeof value === 'string' ? parseBRL(value) : (isFinite(value as number) ? (value as number) : 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

export function parseBRL(value: string): number {
  if (!value) return 0
  const raw = value.replace(/[^\d,.-]/g, '')
  if (!raw) return 0
  const hasComma = raw.includes(',')
  const normalized = hasComma ? raw.replace(/\./g, '').replace(',', '.') : raw
  const num = parseFloat(normalized)
  return isFinite(num) ? num : 0
}