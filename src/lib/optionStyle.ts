/**
 * Identidade visual das opções. O participante vê no celular a mesma cor e a mesma letra que estão
 * no telão — é o que permite conferir a resposta à distância sem reler o texto.
 */
const palette = [
  'var(--option-1)',
  'var(--option-2)',
  'var(--option-3)',
  'var(--option-4)',
  'var(--option-5)',
  'var(--option-6)',
]

const markers = ['A', 'B', 'C', 'D', 'E', 'F']

export function optionColor(index: number): string {
  return palette[index % palette.length]
}

export function optionMarker(index: number): string {
  return markers[index % markers.length]
}
