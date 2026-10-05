import { optionColor, optionMarker } from '../lib/optionStyle'

export type OptionTileState = 'idle' | 'selected' | 'correct' | 'dimmed'

type OptionTileProps = {
  index: number
  text: string
  state?: OptionTileState
  /** Quantidade de respostas na opção. Só o apresentador recebe isso, e só após o fechamento. */
  count?: number
  onSelect?: () => void
  disabled?: boolean
}

/**
 * Opção de resposta. Mesma cor e mesma letra no telão e no celular — o participante que enxerga
 * o projetor de longe consegue responder olhando só para a cor.
 */
export function OptionTile({ index, text, state = 'idle', count, onSelect, disabled }: OptionTileProps) {
  const className = `option ${state === 'idle' ? '' : state}`
  const style = { background: optionColor(index) }
  const marker = optionMarker(index)

  const content = (
    <>
      <span className="marker" aria-hidden="true">
        {marker}
      </span>
      <span>{text}</span>
      {typeof count === 'number' && <span className="tally">{count}</span>}
    </>
  )

  if (!onSelect) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={onSelect}
      disabled={disabled}
      aria-label={`Opção ${marker}: ${text}`}
      aria-pressed={state === 'selected'}
    >
      {content}
    </button>
  )
}
