import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  buildSvgFont,
  drawGlyph,
  loadSvgFont,
  processGlyph,
  type GlyphResult,
} from './glyph-processor'

const TEST_CHAR = '刮'
const CANVAS_SIZE = 256
const FONT_FAMILY =
  '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif'
const DYNAMIC_FONT_NAME = 'CanvasDynamicGua'

function drawSourcePreview(
  ctx: CanvasRenderingContext2D,
  char: string,
  size: number,
): void {
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${Math.floor(size * 0.78)}px ${FONT_FAMILY}`
  ctx.fillText(char, size / 2, size / 2)
}

export function CanvasDynamicFont() {
  const sourceRef = useRef<HTMLCanvasElement>(null)
  const resultRef = useRef<HTMLCanvasElement>(null)
  const usageRef = useRef<HTMLCanvasElement>(null)
  const [glyph, setGlyph] = useState<GlyphResult | null>(null)
  const [svgUrl, setSvgUrl] = useState<string | null>(null)
  const [fontReady, setFontReady] = useState(false)

  useEffect(() => {
    const source = sourceRef.current
    const result = resultRef.current
    const usage = usageRef.current
    if (!source || !result || !usage) return

    const srcCtx = source.getContext('2d')
    const resCtx = result.getContext('2d')
    const useCtx = usage.getContext('2d')
    if (!srcCtx || !resCtx || !useCtx) return

    drawSourcePreview(srcCtx, TEST_CHAR, CANVAS_SIZE)

    const processed = processGlyph(TEST_CHAR, CANVAS_SIZE, FONT_FAMILY)
    setGlyph(processed)

    resCtx.fillStyle = '#fff'
    resCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    drawGlyph(resCtx, processed, { lineWidth: 12, strokeStyle: '#111' })

    const usageW = 520
    const usageH = 160
    usage.width = usageW
    usage.height = usageH
    useCtx.fillStyle = '#fafafa'
    useCtx.fillRect(0, 0, usageW, usageH)

    const samples = [
      { x: 48, y: 88, scale: 0.35 },
      { x: 168, y: 88, scale: 0.55 },
      { x: 328, y: 88, scale: 0.75 },
      { x: 448, y: 88, scale: 0.95 },
    ]
    for (const s of samples) {
      drawGlyph(useCtx, processed, {
        offsetX: s.x,
        offsetY: s.y,
        scale: s.scale,
        lineWidth: 12,
      })
    }

    const svg = buildSvgFont(DYNAMIC_FONT_NAME, [
      { char: TEST_CHAR, pathD: processed.pathD, unitsPerEm: CANVAS_SIZE },
    ])
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    setSvgUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })

    let cancelled = false
    loadSvgFont(DYNAMIC_FONT_NAME, svg)
      .then(() => {
        if (!cancelled) setFontReady(true)
      })
      .catch(() => {
        if (!cancelled) setFontReady(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (svgUrl) URL.revokeObjectURL(svgUrl)
    }
  }, [svgUrl])

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        background: '#f5f5f5',
        color: '#1a1a1a',
      }}
    >
      <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem' }}>
        Canvas 动态字体 · {TEST_CHAR}
      </h1>
      <p
        style={{
          margin: '0 0 1.5rem',
          maxWidth: '42rem',
          lineHeight: 1.6,
          color: '#444',
        }}
      >
        从系统字体渲染「{TEST_CHAR}」→ 骨架化 → 斜笔画按连通规则拉直为横/竖线：
        与横笔相连→竖线；与竖笔相连→横线；孤立斜笔按角度自动选择。
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <figure style={cardStyle}>
          <figcaption style={captionStyle}>原字（Canvas 绘制）</figcaption>
          <canvas
            ref={sourceRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={canvasStyle}
          />
        </figure>
        <figure style={cardStyle}>
          <figcaption style={captionStyle}>算法结果（仅横/竖）</figcaption>
          <canvas
            ref={resultRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={canvasStyle}
          />
        </figure>
      </div>

      <section style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>页面中使用</h2>
        <canvas
          ref={usageRef}
          style={{ ...canvasStyle, width: '100%', maxWidth: 520 }}
        />
        <p
          style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: '#666' }}
        >
          上方为 Path 矢量绘制（多字号）；下方为 SVG
          字体尝试（部分浏览器已不支持 SVG font）。
        </p>
        <p
          style={{
            marginTop: '1rem',
            fontSize: '2.5rem',
            fontFamily: fontReady ? DYNAMIC_FONT_NAME : FONT_FAMILY,
            letterSpacing: '0.5em',
          }}
        >
          {TEST_CHAR}
          {TEST_CHAR}
          {TEST_CHAR}
        </p>
      </section>

      {glyph && (
        <section style={cardStyle}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>笔画数据</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
            共 {glyph.segments.length} 段（
            {glyph.segments.filter((s) => s.orientation === 'h').length} 横 /{' '}
            {glyph.segments.filter((s) => s.orientation === 'v').length} 竖）
          </p>
          {svgUrl && (
            <a
              href={svgUrl}
              download="dynamic-gua.svg"
              style={{
                display: 'inline-block',
                marginTop: '0.75rem',
                color: '#0969da',
              }}
            >
              下载 SVG 字体文件
            </a>
          )}
        </section>
      )}
    </main>
  )
}

const cardStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: '1rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}

const captionStyle: CSSProperties = {
  margin: '0 0 0.5rem',
  fontSize: '0.85rem',
  color: '#666',
}

const canvasStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  maxWidth: CANVAS_SIZE,
  height: 'auto',
  border: '1px solid #e5e5e5',
  borderRadius: 4,
  background: '#fff',
}
