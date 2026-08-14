/**
 * Normaliza texto libre para mostrar (nombres, ubicaciones, direcciones).
 *
 * La gente registra en minúscula ("johan gomez", "villa santana") o en
 * MAYÚSCULA. Esto lo lleva a "Capitalización De Título" al MOSTRAR, sin tocar
 * lo guardado en la BD. Cuida dos cosas:
 *  - Tokens con dígitos se dejan igual: "#1A-50", "53", "Cra 7" → intactos.
 *  - Conectores en español van en minúscula si no son la primera palabra:
 *    "unidad guadalupe del sur" → "Unidad Guadalupe del Sur".
 */

const LOWER_WORDS = new Set([
  'de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o', 'u', 'en', 'a', 'al',
]);

function capitalizeWord(word: string, isFirst: boolean): string {
  if (!word) return word;
  // Direcciones/códigos con números se dejan tal cual (#1A-50, 53, 1A).
  if (/\d/.test(word)) return word;

  const lower = word.toLowerCase();
  if (!isFirst && LOWER_WORDS.has(lower)) return lower;

  // Capitaliza la inicial y también tras guion/barra: "juan-pablo" → "Juan-Pablo".
  return lower.replace(
    /(^|[-/])([a-záéíóúñü])/g,
    (_, sep: string, ch: string) => sep + ch.toUpperCase()
  );
}

/** "johan gomez" → "Johan Gomez"; "villa santana" → "Villa Santana". */
export function toTitleCase(input: string | null | undefined): string {
  const text = (input ?? '').trim().replace(/\s+/g, ' ');
  if (!text) return '';
  return text
    .split(' ')
    .map((word, i) => capitalizeWord(word, i === 0))
    .join(' ');
}
