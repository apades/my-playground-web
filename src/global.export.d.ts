declare module 'react' {
  interface CSSProperties {
    [CSSCustomPropertiesKey: `--${string}`]: string | number
  }
}

declare global {
  class SpeechRecognition {
    constructor()
    continuous: boolean
    interimResults: boolean
    lang: string
    maxAlternatives: number

    start(): void
    stop(): void
    onresult: (event: Event) => void
    onerror: (event: Event) => void
    onend: (event: Event) => void
    onstart: (event: Event) => void
    onnomatch: (event: Event) => void
  }
}

export {}
