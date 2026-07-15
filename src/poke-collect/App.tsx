import '@style/index.ts'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { DECK, SUITS, type PokerCard } from './deck'
import { PokerCardView } from './PokerCardView'
import { loadCollected, saveCollected } from './storage'

export function PokeCollect() {
  const [collected, setCollected] = useState<Set<string>>(() => loadCollected())
  const [pendingUncollect, setPendingUncollect] = useState<PokerCard | null>(
    null,
  )

  useEffect(() => {
    saveCollected(collected)
  }, [collected])

  const collectedCount = collected.size
  const total = DECK.length

  function handleCardClick(card: PokerCard) {
    if (collected.has(card.id)) {
      setPendingUncollect(card)
      return
    }
    setCollected((prev) => new Set(prev).add(card.id))
  }

  function confirmUncollect() {
    if (!pendingUncollect) return
    setCollected((prev) => {
      const next = new Set(prev)
      next.delete(pendingUncollect.id)
      return next
    })
    setPendingUncollect(null)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,#2f6b45_0%,#1a3d28_55%,#12261a_100%)] px-4 py-8 text-[#f4efe4]">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              className="text-3xl tracking-wide text-[#f0d78c]"
              style={{ fontFamily: 'Georgia, "Palatino Linotype", serif' }}
            >
              扑克牌收集
            </h1>
            <p className="mt-1 text-sm text-[#f4efe4]/75">
              点击卡牌标记收集状态，数据保存在本地浏览器
            </p>
          </div>
          <div className="rounded-lg border border-[#f0d78c]/35 bg-black/20 px-3 py-2 text-sm">
            已收集{' '}
            <span className="font-semibold text-[#f0d78c]">
              {collectedCount}
            </span>{' '}
            / {total}
          </div>
        </header>

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-black/25">
          <div
            className="h-full rounded-full bg-[#f0d78c] transition-[width] duration-300"
            style={{ width: `${(collectedCount / total) * 100}%` }}
          />
        </div>

        {SUITS.map((suit) => {
          const cards = DECK.filter(
            (card) => card.kind === 'regular' && card.suit === suit.id,
          )
          return (
            <section key={suit.id} className="mb-6">
              <h2 className="mb-2 flex items-center gap-2 text-base text-[#f0d78c]/90">
                <span className={suit.red ? 'text-[#ff8a80]' : 'text-white'}>
                  {suit.symbol}
                </span>
                {suit.name}
              </h2>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 md:grid-cols-[repeat(13,minmax(0,1fr))]">
                {cards.map((card) => (
                  <PokerCardView
                    key={card.id}
                    card={card}
                    collected={collected.has(card.id)}
                    onClick={() => handleCardClick(card)}
                  />
                ))}
              </div>
            </section>
          )
        })}

        <section>
          <h2 className="mb-2 text-base text-[#f0d78c]/90">王牌</h2>
          <div className="grid max-w-xs grid-cols-2 gap-2">
            {DECK.filter((card) => card.kind === 'joker').map((card) => (
              <PokerCardView
                key={card.id}
                card={card}
                collected={collected.has(card.id)}
                onClick={() => handleCardClick(card)}
              />
            ))}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={pendingUncollect !== null}
        title="取消已收集"
        message={
          pendingUncollect
            ? `确认取消「${pendingUncollect.label}」的已收集状态？`
            : ''
        }
        confirmText="取消收集"
        onConfirm={confirmUncollect}
        onCancel={() => setPendingUncollect(null)}
      />
    </main>
  )
}
