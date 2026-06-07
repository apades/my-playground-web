export type Orientation = 'h' | 'v' | 'd'

export type Point = { x: number; y: number }

export type Segment = {
  id: number
  a: Point
  b: Point
  orientation: Orientation
}

export type GlyphResult = {
  width: number
  height: number
  segments: Segment[]
  pathD: string
}

const NEIGHBORS_8: Point[] = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: 1 },
]

function key(p: Point): string {
  return `${p.x},${p.y}`
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function classifyDirection(dx: number, dy: number): Orientation {
  const adx = Math.abs(dx)
  const ady = Math.abs(dy)
  if (adx < 1e-6 && ady < 1e-6) return 'd'
  if (ady <= adx * 0.42) return 'h'
  if (adx <= ady * 0.42) return 'v'
  return 'd'
}

function orientationOfSegment(seg: Segment): Orientation {
  return classifyDirection(seg.b.x - seg.a.x, seg.b.y - seg.a.y)
}

/** 二值化：字形像素为 true */
function binarize(data: ImageData, threshold = 128): boolean[][] {
  const { width, height, data: px } = data
  const grid: boolean[][] = Array.from({ length: height }, () =>
    Array<boolean>(width).fill(false),
  )
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const a = px[i + 3]
      if (a < 16) continue
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
      grid[y][x] = lum < threshold
    }
  }
  return grid
}

function countNeighbors(grid: boolean[][], x: number, y: number): number {
  const h = grid.length
  const w = grid[0].length
  let n = 0
  for (const { x: dx, y: dy } of NEIGHBORS_8) {
    const nx = x + dx
    const ny = y + dy
    if (nx >= 0 && ny >= 0 && nx < w && ny < h && grid[ny][nx]) n++
  }
  return n
}

/** Zhang-Suen 细化 */
function skeletonize(grid: boolean[][]): boolean[][] {
  const h = grid.length
  const w = grid[0].length
  const sk = grid.map((row) => row.slice())
  let changed = true

  const P = (g: boolean[][], x: number, y: number) => {
    const pts = [
      [x, y - 1],
      [x + 1, y - 1],
      [x + 1, y],
      [x + 1, y + 1],
      [x, y + 1],
      [x - 1, y + 1],
      [x - 1, y],
      [x - 1, y - 1],
    ] as const
    return pts.map(([px, py]): number =>
      py >= 0 && px >= 0 && py < h && px < w && g[py][px] ? 1 : 0,
    )
  }

  const transitions = (arr: number[]) => {
    let t = 0
    for (let i = 0; i < 8; i++) {
      if (arr[i] === 0 && arr[(i + 1) % 8] === 1) t++
    }
    return t
  }

  while (changed) {
    changed = false
    const toRemove: Point[] = []

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (!sk[y][x]) continue
        const bp = P(sk, x, y)
        const B = bp.reduce((s, v) => s + v, 0)
        if (B < 2 || B > 6) continue
        if (transitions(bp) !== 1) continue
        if (bp[0] * bp[2] * bp[4] === 0 && bp[2] * bp[4] * bp[6] === 0) {
          toRemove.push({ x, y })
        }
      }
    }

    for (const { x, y } of toRemove) {
      sk[y][x] = false
      changed = true
    }

    toRemove.length = 0
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (!sk[y][x]) continue
        const bp = P(sk, x, y)
        const B = bp.reduce((s, v) => s + v, 0)
        if (B < 2 || B > 6) continue
        if (transitions(bp) !== 1) continue
        if (bp[0] * bp[2] * bp[6] === 0 && bp[0] * bp[4] * bp[6] === 0) {
          toRemove.push({ x, y })
        }
      }
    }

    for (const { x, y } of toRemove) {
      sk[y][x] = false
      changed = true
    }
  }

  return sk
}

function collectSkeletonPoints(grid: boolean[][]): Point[] {
  const pts: Point[] = []
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x]) pts.push({ x, y })
    }
  }
  return pts
}

function isJunction(grid: boolean[][], p: Point): boolean {
  return countNeighbors(grid, p.x, p.y) >= 3
}

function isEndpoint(grid: boolean[][], p: Point): boolean {
  return countNeighbors(grid, p.x, p.y) === 1
}

function skeletonNeighbors(
  grid: boolean[][],
  p: Point,
  exclude?: Point,
): Point[] {
  const out: Point[] = []
  for (const { x: dx, y: dy } of NEIGHBORS_8) {
    const nx = p.x + dx
    const ny = p.y + dy
    if (nx < 0 || ny < 0 || nx >= grid[0].length || ny >= grid.length) continue
    if (!grid[ny][nx]) continue
    const n = { x: nx, y: ny }
    if (exclude && n.x === exclude.x && n.y === exclude.y) continue
    out.push(n)
  }
  return out
}

function isSpecial(grid: boolean[][], p: Point): boolean {
  return isEndpoint(grid, p) || isJunction(grid, p)
}

function traceBetweenSpecial(
  grid: boolean[][],
  start: Point,
  firstStep: Point,
  usedEdges: Set<string>,
): Point[] {
  const edgeKey = (a: Point, b: Point) => {
    const ka = key(a)
    const kb = key(b)
    return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
  }

  const chain: Point[] = [start, firstStep]
  usedEdges.add(edgeKey(start, firstStep))

  let prev = start
  let cur = firstStep

  while (!isSpecial(grid, cur)) {
    const nexts = skeletonNeighbors(grid, cur, prev)
    if (nexts.length !== 1) break
    const next = nexts[0]
    usedEdges.add(edgeKey(cur, next))
    chain.push(next)
    prev = cur
    cur = next
  }

  return chain
}

function splitChainToSegments(chain: Point[]): Segment[] {
  if (chain.length < 2) return []
  const segments: Segment[] = []
  let startIdx = 0
  let dir = classifyDirection(chain[1].x - chain[0].x, chain[1].y - chain[0].y)

  for (let i = 2; i <= chain.length; i++) {
    const atEnd = i === chain.length
    const stepDir = atEnd
      ? dir
      : classifyDirection(
          chain[i].x - chain[i - 1].x,
          chain[i].y - chain[i - 1].y,
        )
    const changed = !atEnd && stepDir !== dir

    if (changed || atEnd) {
      const endIdx = changed ? i - 1 : i - 1
      if (endIdx > startIdx) {
        segments.push({
          id: segments.length,
          a: { ...chain[startIdx] },
          b: { ...chain[endIdx] },
          orientation: dir,
        })
      }
      if (changed) {
        startIdx = i - 1
        dir = stepDir
      }
    }
  }

  return segments
}

function extractRawSegments(grid: boolean[][]): Segment[] {
  const edgeVisited = new Set<string>()
  const segmentKeys = new Set<string>()
  const segments: Segment[] = []
  const points = collectSkeletonPoints(grid)

  const edgeKey = (a: Point, b: Point) => {
    const ka = key(a)
    const kb = key(b)
    return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
  }

  for (const p of points) {
    if (!isSpecial(grid, p)) continue
    for (const n of skeletonNeighbors(grid, p)) {
      const ek = edgeKey(p, n)
      if (edgeVisited.has(ek)) continue

      const chain = traceBetweenSpecial(grid, p, n, edgeVisited)
      if (chain.length < 2) continue

      const parts = splitChainToSegments(chain)
      for (const part of parts) {
        const sk = edgeKey(part.a, part.b)
        if (segmentKeys.has(sk)) continue
        segmentKeys.add(sk)
        part.orientation = orientationOfSegment(part)
        part.id = segments.length
        segments.push(part)
      }
    }
  }

  if (segments.length === 0 && points.length >= 2) {
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
    segments.push({
      id: 0,
      a: sorted[0],
      b: sorted[sorted.length - 1],
      orientation: orientationOfSegment({
        id: 0,
        a: sorted[0],
        b: sorted[sorted.length - 1],
        orientation: 'd',
      }),
    })
  }

  return segments
}

function pointOnSegment(p: Point, seg: Segment, tol = 2.5): boolean {
  const { a, b } = seg
  const d = dist(a, b)
  if (d < 1e-6) return dist(p, a) <= tol
  const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (d * d)
  if (t < -0.05 || t > 1.05) return false
  const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }
  return dist(p, proj) <= tol
}

function segmentsAtPoint(
  segments: Segment[],
  p: Point,
  excludeId?: number,
): Segment[] {
  return segments.filter(
    (s) =>
      s.id !== excludeId &&
      (dist(s.a, p) <= 2.5 || dist(s.b, p) <= 2.5 || pointOnSegment(p, s)),
  )
}

function neighborOrientations(seg: Segment, all: Segment[]): Orientation[] {
  const result: Orientation[] = []
  for (const end of [seg.a, seg.b]) {
    const nearby = segmentsAtPoint(all, end, seg.id)
    for (const n of nearby) {
      const o = n.orientation === 'd' ? orientationOfSegment(n) : n.orientation
      if (o !== 'd') result.push(o)
    }
  }
  return result
}

function diagonalTargetOrientation(
  seg: Segment,
  neighbors: Orientation[],
): 'h' | 'v' {
  const hasH = neighbors.includes('h')
  const hasV = neighbors.includes('v')

  if (hasH && !hasV) return 'v'
  if (hasV && !hasH) return 'h'
  if (hasH && hasV) {
    const dx = Math.abs(seg.b.x - seg.a.x)
    const dy = Math.abs(seg.b.y - seg.a.y)
    return dx >= dy ? 'h' : 'v'
  }

  const dx = Math.abs(seg.b.x - seg.a.x)
  const dy = Math.abs(seg.b.y - seg.a.y)
  return dx >= dy ? 'h' : 'v'
}

function alignSegment(seg: Segment, target: 'h' | 'v'): Segment {
  const { a, b } = seg
  if (target === 'h') {
    const y = Math.round((a.y + b.y) / 2)
    return {
      ...seg,
      a: { x: a.x, y },
      b: { x: b.x, y },
      orientation: 'h',
    }
  }
  const x = Math.round((a.x + b.x) / 2)
  return {
    ...seg,
    a: { x, y: a.y },
    b: { x, y: b.y },
    orientation: 'v',
  }
}

function straightenDiagonals(segments: Segment[]): Segment[] {
  const oriented = segments.map((s) => ({
    ...s,
    orientation: orientationOfSegment(s),
  }))

  let result = oriented.map((s) => ({ ...s }))
  let guard = 0

  while (guard++ < 8) {
    let changed = false
    result = result.map((seg) => {
      const o = orientationOfSegment(seg)
      if (o !== 'd') {
        return { ...seg, orientation: o }
      }
      const neighbors = neighborOrientations(seg, result)
      const target = diagonalTargetOrientation(seg, neighbors)
      const aligned = alignSegment(seg, target)
      if (
        aligned.a.x !== seg.a.x ||
        aligned.a.y !== seg.a.y ||
        aligned.b.x !== seg.b.x ||
        aligned.b.y !== seg.b.y
      ) {
        changed = true
      }
      return aligned
    })
    if (!changed) break
  }

  return result
}

function mergeCollinear(segments: Segment[]): Segment[] {
  const merged: Segment[] = []
  const used = new Set<number>()

  for (const seg of segments) {
    if (used.has(seg.id)) continue
    let a = { ...seg.a }
    let b = { ...seg.b }
    let o = seg.orientation
    used.add(seg.id)

    let found = true
    while (found) {
      found = false
      for (const other of segments) {
        if (used.has(other.id) || other.orientation !== o) continue
        if (o === 'h' && Math.abs(other.a.y - a.y) > 1) continue
        if (o === 'v' && Math.abs(other.a.x - a.x) > 1) continue
        if (dist(b, other.a) <= 3 || dist(b, other.b) <= 3) {
          const far = dist(other.a, b) > dist(other.b, b) ? other.a : other.b
          b = far
          used.add(other.id)
          found = true
        } else if (dist(a, other.a) <= 3 || dist(a, other.b) <= 3) {
          const far = dist(other.a, a) > dist(other.b, a) ? other.a : other.b
          a = far
          used.add(other.id)
          found = true
        }
      }
    }

    merged.push({ id: merged.length, a, b, orientation: o })
  }

  return merged
}

function segmentsToPathD(segments: Segment[]): string {
  return segments
    .map((s) => `M ${s.a.x} ${s.a.y} L ${s.b.x} ${s.b.y}`)
    .join(' ')
}

export function renderCharToImageData(
  char: string,
  size: number,
  fontFamily: string,
): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${Math.floor(size * 0.78)}px ${fontFamily}`
  ctx.fillText(char, size / 2, size / 2)

  return ctx.getImageData(0, 0, size, size)
}

export function processGlyphFromImageData(data: ImageData): GlyphResult {
  const binary = binarize(data)
  const skeleton = skeletonize(binary)
  const raw = extractRawSegments(skeleton)
  const straight = straightenDiagonals(raw)
  const segments = mergeCollinear(straight)
  const pathD = segmentsToPathD(segments)

  return {
    width: data.width,
    height: data.height,
    segments,
    pathD,
  }
}

export function processGlyph(
  char: string,
  size = 256,
  fontFamily = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
): GlyphResult {
  const data = renderCharToImageData(char, size, fontFamily)
  return processGlyphFromImageData(data)
}

export function drawGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: GlyphResult,
  options?: {
    lineWidth?: number
    strokeStyle?: string
    offsetX?: number
    offsetY?: number
    scale?: number
  },
): void {
  const {
    lineWidth = 14,
    strokeStyle = '#111',
    offsetX = 0,
    offsetY = 0,
    scale = 1,
  } = options ?? {}

  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const seg of glyph.segments) {
    ctx.beginPath()
    ctx.moveTo(seg.a.x, seg.a.y)
    ctx.lineTo(seg.b.x, seg.b.y)
    ctx.stroke()
  }

  ctx.restore()
}

export function buildSvgFont(
  fontFamily: string,
  glyphs: { char: string; pathD: string; unitsPerEm?: number }[],
): string {
  const units = glyphs[0]?.unitsPerEm ?? 256
  const glyphTags = glyphs
    .map(
      (g) =>
        `    <glyph unicode="${g.char}" horiz-adv-x="${units}" d="${g.pathD}" />`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <font id="${fontFamily}" horiz-adv-x="${units}">
      <font-face font-family="${fontFamily}" units-per-em="${units}" ascent="${units * 0.8}" descent="${units * 0.2}" />
${glyphTags}
    </font>
  </defs>
</svg>`
}

export async function loadSvgFont(
  fontFamily: string,
  svgSource: string,
): Promise<FontFace> {
  const blob = new Blob([svgSource], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const face = new FontFace(fontFamily, `url(${url})`)
  await face.load()
  document.fonts.add(face)
  return face
}
