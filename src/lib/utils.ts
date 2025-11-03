import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function numberToCurrencyWordsPtBr(num: number): string {
  const ones = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
  const scales = [
    { singular: "mil", plural: "mil", value: 1000 },
    { singular: "milhão", plural: "milhões", value: 1000000 },
    { singular: "bilhão", plural: "bilhões", value: 1000000000 },
    { singular: "trilhão", plural: "trilhões", value: 1000000000000 }
  ];

  if (num === 0) return "zero";
  if (num < 0) return "menos " + numberToCurrencyWordsPtBr(-num);

  const integer = Math.floor(num);
  const decimal = Math.round((num - integer) * 100);

  const convertGroup = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one > 0 ? " e " + ones[one] : "");
    }
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return hundreds[hundred] + (remainder > 0 ? " e " + convertGroup(remainder) : "");
  };

  let words: string[] = [];
  let scaleIndex = scales.length - 1;

  let remaining = integer;
  while (remaining > 0 && scaleIndex >= 0) {
    const scale = scales[scaleIndex];
    const scaleValue = scale.value;
    const quotient = Math.floor(remaining / scaleValue);

    if (quotient > 0) {
      const groupWords = convertGroup(quotient);
      const scaleName = quotient === 1 && scale.value !== 1000 ? scale.singular : scale.plural;
      words.push(groupWords + " " + scaleName);
      remaining = remaining % scaleValue;
    }
    scaleIndex--;
  }

  let result = words.join(" ").trim();

  if (decimal > 0) {
    if (result) result += " e ";
    result += convertGroup(decimal) + (decimal === 1 ? " centavo" : " centavos");
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}
