import '@style/index'
import { useEffect, useRef, useState } from 'react'
import { AudioDelayGraph, clampDelay, MAX_DELAY_SECONDS } from './audio-delay'

const DEFAULT_DELAY_SECONDS = 2
const DEFAULT_MEDIA_NAME = 'test.mp4'
const DEFAULT_MEDIA_URL = new URL('./test.mp4', import.meta.url).href

export function DelayPlayer() {
  const mediaRef = useRef<HTMLVideoElement>(null)
  const graphRef = useRef<AudioDelayGraph | null>(null)
  const delayRef = useRef(DEFAULT_DELAY_SECONDS)

  const [file, setFile] = useState<File | null>(null)
  const [fileSrc, setFileSrc] = useState('')
  const [defaultSrc, setDefaultSrc] = useState('')
  const [delaySeconds, setDelaySeconds] = useState(DEFAULT_DELAY_SECONDS)
  const [hasVideo, setHasVideo] = useState(false)
  const [error, setError] = useState('')

  delayRef.current = delaySeconds
  const src = fileSrc || defaultSrc
  const sourceLabel =
    file?.name ?? (defaultSrc ? `${DEFAULT_MEDIA_NAME}（默认）` : '')

  useEffect(() => {
    const ac = new AbortController()
    fetch(DEFAULT_MEDIA_URL, {
      headers: { Range: 'bytes=0-0' },
      signal: ac.signal,
    })
      .then((res) => {
        if (res.ok || res.status === 206) setDefaultSrc(DEFAULT_MEDIA_URL)
      })
      .catch(() => {})
    return () => ac.abort()
  }, [])

  useEffect(() => {
    if (!file) {
      setFileSrc('')
      return
    }
    const url = URL.createObjectURL(file)
    setFileSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    const media = mediaRef.current
    if (!media) return
    graphRef.current = AudioDelayGraph.for(media, delayRef.current)
  }, [])

  useEffect(() => {
    graphRef.current?.setDelay(delaySeconds)
  }, [delaySeconds])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0]
    if (!next) return
    setError('')
    setHasVideo(false)
    setFile(next)
  }

  const handleDelayChange = (raw: string) => {
    const parsed = Number(raw)
    setDelaySeconds(clampDelay(parsed))
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header>
          <h1 className="text-2xl">Delay Player</h1>
          <p className="mt-1 text-sm text-neutral-400">
            音频先按设定秒数延迟播出；画面延迟稍后接入。
          </p>
        </header>

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-700 px-4 py-8 text-sm text-neutral-300 hover:border-neutral-500 hover:bg-neutral-900">
          <span>选择音频或视频文件</span>
          {sourceLabel && (
            <span className="max-w-full truncate text-neutral-500">
              {sourceLabel}
            </span>
          )}
          <input
            type="file"
            accept="audio/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        <section className="rounded-xl bg-neutral-900 p-4">
          <label className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-neutral-300">音频延迟</span>
              <span className="tabular-nums text-lg">
                {delaySeconds.toFixed(1)} 秒
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_DELAY_SECONDS}
              step={0.1}
              value={delaySeconds}
              onChange={(e) => handleDelayChange(e.target.value)}
              className="w-full accent-emerald-400"
            />
            <input
              type="number"
              min={0}
              max={MAX_DELAY_SECONDS}
              step={0.1}
              value={delaySeconds}
              onChange={(e) => handleDelayChange(e.target.value)}
              className="w-28 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 tabular-nums"
            />
          </label>
          <p className="mt-3 text-xs text-neutral-500">
            播放开始后的前 {delaySeconds.toFixed(1)}{' '}
            秒是静音（正在填延迟缓冲）。之后听到的是 {delaySeconds.toFixed(1)}{' '}
            秒前的声音。
          </p>
        </section>

        <section
          className={`overflow-hidden rounded-xl bg-black ${hasVideo ? '' : 'min-h-0'}`}
        >
          <video
            ref={mediaRef}
            src={src || undefined}
            controls
            playsInline
            className={hasVideo ? 'aspect-video w-full' : 'w-full'}
            onPlay={() => {
              void graphRef.current?.resume()
            }}
            onLoadedMetadata={() => {
              const media = mediaRef.current
              setHasVideo(!!media && media.videoWidth > 0)
            }}
            onError={() => {
              setError('无法播放该文件，请换一个音频或视频试试。')
            }}
          />
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </main>
  )
}
