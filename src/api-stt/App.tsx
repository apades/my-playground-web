import '@style/index.ts'
import { useRef } from 'react'

export function ApiStt() {
  const sttRef = useRef(new SpeechRecognition())

  return (
    <main className="f-center min-h-screen">
      <h1
        onClick={() => {
          sttRef.current.start()
        }}
      >
        api-stt
      </h1>
    </main>
  )
}
