import {
  getSuitMeta,
  isRedCard,
  type PokerCard as PokerCardData,
} from './deck'

type PokerCardViewProps = {
  card: PokerCardData
  collected: boolean
  onClick: () => void
}

export function PokerCardView({
  card,
  collected,
  onClick,
}: PokerCardViewProps) {
  const red = isRedCard(card)
  const colorClass = red ? 'text-[#c0392b]' : 'text-[#1a1a1a]'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={collected}
      aria-label={`${card.label}${collected ? '（已收集）' : '（未收集）'}`}
      className={[
        'relative aspect-[2.5/3.5] w-full overflow-hidden rounded-lg border bg-white text-left shadow-sm transition',
        'hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0d78c]',
        collected
          ? 'border-[#2d8a4e] ring-2 ring-[#2d8a4e]/35'
          : 'border-black/10 opacity-70 grayscale-[0.35]',
      ].join(' ')}
    >
      {card.kind === 'regular' ? (
        <RegularFace card={card} colorClass={colorClass} />
      ) : (
        <JokerFace card={card} colorClass={colorClass} />
      )}

      {collected && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2d8a4e] text-[11px] font-semibold leading-none text-white">
          ✓
        </span>
      )}
    </button>
  )
}

function RegularFace({
  card,
  colorClass,
}: {
  card: Extract<PokerCardData, { kind: 'regular' }>
  colorClass: string
}) {
  const { symbol } = getSuitMeta(card.suit)

  return (
    <div className={`flex h-full flex-col justify-between p-1.5 ${colorClass}`}>
      <div className="leading-none">
        <div className="text-sm font-semibold">{card.rank}</div>
        <div className="text-xs">{symbol}</div>
      </div>
      <div className="ab-center text-2xl">{symbol}</div>
      <div className="self-end rotate-180 leading-none">
        <div className="text-sm font-semibold">{card.rank}</div>
        <div className="text-xs">{symbol}</div>
      </div>
    </div>
  )
}

function JokerFace({
  card,
  colorClass,
}: {
  card: Extract<PokerCardData, { kind: 'joker' }>
  colorClass: string
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-between p-2 ${colorClass}`}
    >
      <span className="text-[10px] font-semibold tracking-wide">JOKER</span>
      <span className="text-base font-semibold">{card.label}</span>
      <span className="rotate-180 text-[10px] font-semibold tracking-wide">
        JOKER
      </span>
    </div>
  )
}
