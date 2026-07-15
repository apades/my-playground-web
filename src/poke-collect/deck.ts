export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'

export type RegularCard = {
  id: string
  kind: 'regular'
  suit: Suit
  rank: Rank
  label: string
}

export type JokerCard = {
  id: string
  kind: 'joker'
  color: 'black' | 'red'
  label: string
}

export type PokerCard = RegularCard | JokerCard

export const SUITS: { id: Suit; symbol: string; name: string; red: boolean }[] =
  [
    { id: 'spades', symbol: '♠', name: '黑桃', red: false },
    { id: 'hearts', symbol: '♥', name: '红心', red: true },
    { id: 'diamonds', symbol: '♦', name: '方块', red: true },
    { id: 'clubs', symbol: '♣', name: '梅花', red: false },
  ]

export const RANKS: Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
]

function buildDeck(): PokerCard[] {
  const regular: RegularCard[] = SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${suit.id}-${rank}`,
      kind: 'regular' as const,
      suit: suit.id,
      rank,
      label: `${suit.name}${rank}`,
    })),
  )

  const jokers: JokerCard[] = [
    {
      id: 'joker-black',
      kind: 'joker',
      color: 'black',
      label: '小王',
    },
    {
      id: 'joker-red',
      kind: 'joker',
      color: 'red',
      label: '大王',
    },
  ]

  return [...regular, ...jokers]
}

export const DECK = buildDeck()

export function getSuitMeta(suit: Suit) {
  return SUITS.find((s) => s.id === suit)!
}

export function isRedCard(card: PokerCard): boolean {
  if (card.kind === 'joker') return card.color === 'red'
  return getSuitMeta(card.suit).red
}
