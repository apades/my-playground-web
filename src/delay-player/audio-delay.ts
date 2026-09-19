/** DelayNode 创建时就要定好上限，改延迟只动 delayTime。 */
export const MAX_DELAY_SECONDS = 30

const graphs = new WeakMap<HTMLMediaElement, AudioDelayGraph>()

export class AudioDelayGraph {
  private readonly ctx: AudioContext
  private readonly delay: DelayNode

  private constructor(media: HTMLMediaElement, delaySeconds: number) {
    this.ctx = new AudioContext()
    const source = this.ctx.createMediaElementSource(media)
    this.delay = this.ctx.createDelay(MAX_DELAY_SECONDS)
    this.setDelay(delaySeconds)
    source.connect(this.delay)
    this.delay.connect(this.ctx.destination)
  }

  /** 每个 media 元素只能 createMediaElementSource 一次，StrictMode 重跑 effect 也必须复用。 */
  static for(media: HTMLMediaElement, delaySeconds: number) {
    const existing = graphs.get(media)
    if (existing) {
      existing.setDelay(delaySeconds)
      return existing
    }
    const graph = new AudioDelayGraph(media, delaySeconds)
    graphs.set(media, graph)
    return graph
  }

  setDelay(seconds: number) {
    const next = clampDelay(seconds)
    this.delay.delayTime.setValueAtTime(next, this.ctx.currentTime)
  }

  async resume() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }
}

export function clampDelay(seconds: number) {
  if (!Number.isFinite(seconds)) return 0
  return Math.min(MAX_DELAY_SECONDS, Math.max(0, seconds))
}
