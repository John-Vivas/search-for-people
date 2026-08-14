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
  // \p{L} (Unicode) cubre cualquier letra: tildes, ñ, ü, ç, etc. sin problema.
  return lower.replace(
    /(^|[-/])(\p{L})/gu,
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

/**
 * Sentence case: solo la primera letra en mayúscula, el resto tal cual.
 * Para texto libre (descripciones, detalles) donde title-case arruinaría las
 * frases: "numero:313..." → "Numero:313...", "vestía azul" → "Vestía azul".
 * Devuelve '' si está vacío.
 */
export function capitalizeFirst(input: string | null | undefined): string {
  const text = (input ?? '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
