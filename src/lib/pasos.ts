/** Cómo se llama cada paso de la noche. Puro: lo usan el servidor y el celular del invitado. */

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const STEP_LABELS = ["Primer paso", "Segundo paso", "Tercer paso", "Cuarto paso", "Quinto paso", "Sexto paso"];

export function labelForStep(i: number, dish: string, total: number): string {
  if (i === total && /postre|dulce|helado|frutilla|torta|flan|mousse|panna|crema/i.test(dish)) return "El postre";
  return STEP_LABELS[i - 1] ?? `Paso ${i}`;
}
