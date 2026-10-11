export type Vec2 = {
  x: number
  y: number
}

export type ShellSolution = {
  dx: number
  dy: number
  distance: number
  azimuthDeg: number
  coincident: boolean
}

const CARDINALS = [
  '北',
  '东北',
  '东',
  '东南',
  '南',
  '西南',
  '西',
  '西北',
] as const

/** 0° 为正北，顺时针增加（东 90°、南 180°、西 270°） */
export function calcShell(self: Vec2, enemy: Vec2): ShellSolution {
  const dx = enemy.x - self.x
  const dy = enemy.y - self.y
  const distance = Math.hypot(dx, dy)
  const coincident = distance === 0
  let azimuthDeg = 0
  if (!coincident) {
    azimuthDeg = (Math.atan2(dx, dy) * 180) / Math.PI
    if (azimuthDeg < 0) azimuthDeg += 360
  }
  return { dx, dy, distance, azimuthDeg, coincident }
}

export function cardinalName(azimuthDeg: number): string {
  const idx = Math.round(azimuthDeg / 45) % 8
  return CARDINALS[idx]
}

export function parseCoord(raw: string): number | undefined {
  const text = raw.trim()
  if (text === '') return undefined
  const value = Number(text)
  return Number.isFinite(value) ? value : undefined
}

export function splitCoordPair(
  raw: string,
): { x: string; y: string } | undefined {
  const parts = raw
    .trim()
    .split(/[,，;\s|/]+/)
    .filter(Boolean)
  if (parts.length !== 2) return undefined
  if (parts.some((part) => !Number.isFinite(Number(part)))) return undefined
  return { x: parts[0], y: parts[1] }
}
