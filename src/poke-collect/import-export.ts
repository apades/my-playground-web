import { DECK_IDS } from './deck'

const EXPORT_VERSION = 1

export type ExportData = {
  app: 'poke-collect'
  version: number
  exportedAt: string
  collected: string[]
}

export type ImportResult =
  | { ok: true; ids: Set<string> }
  | { ok: false; error: string }

function normalizeIds(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null
  const ids = raw.filter((id): id is string => typeof id === 'string')
  return ids.length === raw.length ? ids : null
}

function filterValidIds(ids: string[]): Set<string> {
  return new Set(ids.filter((id) => DECK_IDS.has(id)))
}

export function buildExportData(ids: Set<string>): ExportData {
  return {
    app: 'poke-collect',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    collected: [...ids].sort(),
  }
}

export function parseImportData(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: '文件不是有效的 JSON 格式' }
  }

  let rawIds: string[] | null = null

  if (Array.isArray(parsed)) {
    rawIds = normalizeIds(parsed)
  } else if (parsed && typeof parsed === 'object' && 'collected' in parsed) {
    rawIds = normalizeIds((parsed as ExportData).collected)
  }

  if (!rawIds) {
    return { ok: false, error: '未找到有效的收集记录数据' }
  }

  const ids = filterValidIds(rawIds)
  if (ids.size === 0) {
    return { ok: false, error: '文件中没有可识别的扑克牌记录' }
  }

  return { ok: true, ids }
}

export function downloadExport(ids: Set<string>): void {
  const data = buildExportData(ids)
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `poke-collect-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function readImportFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text()
    return parseImportData(text)
  } catch {
    return { ok: false, error: '读取文件失败' }
  }
}
