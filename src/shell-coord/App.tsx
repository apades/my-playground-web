import '@style/index'
import { useState, type ClipboardEvent } from 'react'
import {
  calcShell,
  cardinalName,
  parseCoord,
  splitCoordPair,
  type ShellSolution,
  type Vec2,
} from './calc'

type CoordDraft = {
  x: string
  y: string
}

function toPoint(draft: CoordDraft): Vec2 | undefined {
  const x = parseCoord(draft.x)
  const y = parseCoord(draft.y)
  if (x === undefined || y === undefined) return undefined
  return { x, y }
}

export function ShellCoord() {
  const [self, setSelf] = useState<CoordDraft>({ x: '', y: '' })
  const [enemy, setEnemy] = useState<CoordDraft>({ x: '', y: '' })

  const selfPoint = toPoint(self)
  const enemyPoint = toPoint(enemy)
  const solution =
    selfPoint && enemyPoint ? calcShell(selfPoint, enemyPoint) : undefined

  const swap = () => {
    setSelf(enemy)
    setEnemy(self)
  }

  return (
    <main className="min-h-screen bg-[#0e1410] px-4 py-10 text-[#e8e4d4]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header>
          <h1 className="text-2xl tracking-wide text-amber-200">炮弹坐标</h1>
          <p className="mt-1 text-sm text-[#e8e4d4]/60">
            左边填本人，右边填敌人。0° 为正北（顺时针），距离与坐标同单位。
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 dp:grid-cols-[1fr_auto_1fr] dp:items-center">
          <CoordPanel
            title="本人坐标"
            hint="己方位置"
            accent="border-sky-500/40"
            labelClass="text-sky-300"
            value={self}
            onChange={setSelf}
          />

          <button
            type="button"
            onClick={swap}
            className="justify-self-center rounded-full border border-[#2c3a30] bg-[#171e19] px-3 py-2 text-xs text-[#e8e4d4]/70 hover:border-amber-500/50 hover:text-amber-200"
          >
            交换
          </button>

          <CoordPanel
            title="敌人坐标"
            hint="目标位置"
            accent="border-rose-500/40"
            labelClass="text-rose-300"
            value={enemy}
            onChange={setEnemy}
          />
        </div>

        <ResultPanel solution={solution} self={selfPoint} enemy={enemyPoint} />
      </div>
    </main>
  )
}

function CoordPanel({
  title,
  hint,
  accent,
  labelClass,
  value,
  onChange,
}: {
  title: string
  hint: string
  accent: string
  labelClass: string
  value: CoordDraft
  onChange: (next: CoordDraft) => void
}) {
  const applyPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pair = splitCoordPair(event.clipboardData.getData('text'))
    if (!pair) return
    event.preventDefault()
    onChange(pair)
  }

  return (
    <section className={`rounded-xl border bg-[#171e19] p-4 ${accent}`}>
      <div className="mb-4">
        <h2 className={`text-lg ${labelClass}`}>{title}</h2>
        <p className="text-xs text-[#e8e4d4]/45">{hint}</p>
      </div>
      <div className="flex flex-col gap-3">
        <NumberField
          label="X"
          value={value.x}
          onChange={(x) => onChange({ ...value, x })}
          onPaste={applyPaste}
        />
        <NumberField
          label="Y"
          value={value.y}
          onChange={(y) => onChange({ ...value, y })}
          onPaste={applyPaste}
        />
      </div>
      <p className="mt-3 text-xs text-[#e8e4d4]/40">
        可粘贴「x, y」一次填入两项
      </p>
    </section>
  )
}

function NumberField({
  label,
  value,
  onChange,
  onPaste,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-5 text-sm text-[#e8e4d4]/70">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onPaste={onPaste}
        className="w-full rounded-md border border-[#2c3a30] bg-[#0e1410] px-3 py-2 font-mono tabular-nums outline-none placeholder:text-[#e8e4d4]/20 focus:border-amber-500/60"
      />
    </label>
  )
}

function ResultPanel({
  solution,
  self,
  enemy,
}: {
  solution: ShellSolution | undefined
  self: Vec2 | undefined
  enemy: Vec2 | undefined
}) {
  const coincident = solution?.coincident ?? false
  const angleText =
    !solution || coincident ? '--' : `${solution.azimuthDeg.toFixed(1)}°`
  const angleHint = !solution
    ? '填写两侧坐标后计算'
    : coincident
      ? '两点重合'
      : cardinalName(solution.azimuthDeg)
  const distanceText = solution ? solution.distance.toFixed(1) : '--'
  const deltaText = solution
    ? `ΔX ${formatDelta(solution.dx)}　ΔY ${formatDelta(solution.dy)}`
    : '与输入坐标同单位'

  return (
    <section className="rounded-xl border border-amber-500/30 bg-[#171e19] p-4">
      <h2 className="mb-4 text-lg text-amber-200">射击诸元</h2>
      <div className="grid grid-cols-1 gap-4 dp:grid-cols-2">
        <div className="rounded-lg bg-[#0e1410] px-4 py-5">
          <p className="text-sm text-[#e8e4d4]/55">角度（方位角）</p>
          <p className="mt-2 font-mono text-4xl tabular-nums text-amber-300">
            {angleText}
          </p>
          <p className="mt-2 text-sm text-[#e8e4d4]/55">{angleHint}</p>
        </div>
        <div className="rounded-lg bg-[#0e1410] px-4 py-5">
          <p className="text-sm text-[#e8e4d4]/55">距离</p>
          <p className="mt-2 font-mono text-4xl tabular-nums text-amber-300">
            {distanceText}
          </p>
          <p className="mt-2 font-mono text-sm tabular-nums text-[#e8e4d4]/55">
            {deltaText}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 dp:grid-cols-2">
        <Compass
          azimuth={solution?.azimuthDeg ?? 0}
          active={Boolean(solution) && !coincident}
        />
        <RelativeMap self={self} enemy={enemy} />
      </div>
    </section>
  )
}

function formatDelta(value: number): string {
  const abs = Math.abs(value).toFixed(1)
  if (value > 0) return `+${abs}`
  if (value < 0) return `-${abs}`
  return '0.0'
}

function projectPoints(self: Vec2 | undefined, enemy: Vec2 | undefined) {
  if (!self || !enemy) return undefined
  const minX = Math.min(self.x, enemy.x)
  const maxX = Math.max(self.x, enemy.x)
  const minY = Math.min(self.y, enemy.y)
  const maxY = Math.max(self.y, enemy.y)
  const span = Math.max(maxX - minX, maxY - minY, 1) * 1.4
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2
  const toSvg = (point: Vec2) => ({
    x: 24 + ((point.x - (midX - span / 2)) / span) * 152,
    y: 24 + ((midY + span / 2 - point.y) / span) * 152,
  })
  return { self: toSvg(self), enemy: toSvg(enemy) }
}

function Compass({ azimuth, active }: { azimuth: number; active: boolean }) {
  return (
    <div className="rounded-lg bg-[#0e1410] p-4">
      <p className="mb-2 text-sm text-[#e8e4d4]/55">罗盘（北朝上）</p>
      <svg viewBox="0 0 200 200" className="mx-auto block w-full max-w-[220px]">
        <circle
          cx="100"
          cy="100"
          r="84"
          fill="none"
          stroke="#2c3a30"
          strokeWidth="2"
        />
        {Array.from({ length: 36 }, (_, i) => {
          const deg = i * 10
          const rad = ((deg - 90) * Math.PI) / 180
          const outer = 84
          const inner = i % 9 === 0 ? 70 : 78
          return (
            <line
              key={deg}
              x1={100 + Math.cos(rad) * inner}
              y1={100 + Math.sin(rad) * inner}
              x2={100 + Math.cos(rad) * outer}
              y2={100 + Math.sin(rad) * outer}
              stroke={i % 9 === 0 ? '#d6b25e' : '#2c3a30'}
              strokeWidth={i % 9 === 0 ? 2 : 1}
            />
          )
        })}
        <text x="100" y="28" textAnchor="middle" fill="#93c5fd" fontSize="12">
          N
        </text>
        <text x="176" y="104" textAnchor="middle" fill="#e8e4d4" fontSize="11">
          E
        </text>
        <text x="100" y="186" textAnchor="middle" fill="#e8e4d4" fontSize="11">
          S
        </text>
        <text x="24" y="104" textAnchor="middle" fill="#e8e4d4" fontSize="11">
          W
        </text>
        <g
          transform={`rotate(${active ? azimuth : 0} 100 100)`}
          opacity={active ? 1 : 0.25}
        >
          <polygon points="100,32 108,108 100,98 92,108" fill="#fbbf24" />
          <polygon points="100,168 108,108 100,118 92,108" fill="#64748b" />
        </g>
        <circle cx="100" cy="100" r="4" fill="#e8e4d4" />
      </svg>
    </div>
  )
}

function RelativeMap({
  self,
  enemy,
}: {
  self: Vec2 | undefined
  enemy: Vec2 | undefined
}) {
  const points = projectPoints(self, enemy)

  return (
    <div className="rounded-lg bg-[#0e1410] p-4">
      <p className="mb-2 text-sm text-[#e8e4d4]/55">相对位置（北朝上）</p>
      <svg viewBox="0 0 200 200" className="mx-auto block w-full max-w-[220px]">
        <rect
          x="16"
          y="16"
          width="168"
          height="168"
          fill="none"
          stroke="#2c3a30"
          strokeWidth="1.5"
        />
        <text x="100" y="14" textAnchor="middle" fill="#93c5fd" fontSize="10">
          北
        </text>
        {points ? (
          <>
            <line
              x1={points.self.x}
              y1={points.self.y}
              x2={points.enemy.x}
              y2={points.enemy.y}
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <circle
              cx={points.self.x}
              cy={points.self.y}
              r="6"
              fill="#38bdf8"
            />
            <circle
              cx={points.enemy.x}
              cy={points.enemy.y}
              r="6"
              fill="#fb7185"
            />
          </>
        ) : (
          <text
            x="100"
            y="104"
            textAnchor="middle"
            fill="#e8e4d4"
            fillOpacity="0.35"
            fontSize="12"
          >
            等待坐标
          </text>
        )}
      </svg>
      <div className="mt-2 flex justify-center gap-4 text-xs text-[#e8e4d4]/55">
        <span className="f-i-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
          本人
        </span>
        <span className="f-i-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
          敌人
        </span>
      </div>
    </div>
  )
}
