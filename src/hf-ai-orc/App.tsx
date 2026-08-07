import '@style/index'
import {
  AutoProcessor,
  AutoModelForImageTextToText,
  AutoModelForAudioClassification,
  load_image,
  Tensor,
  pipeline,
} from '@huggingface/transformers'
import { useEffect, useState } from 'react'
import { onceCall } from '@utils/index'

// ONNX build for in-browser inference; zai-org/GLM-OCR is the PyTorch checkpoint.
const MODEL_ID = 'onnx-community/GLM-OCR-ONNX'

const loadOcr = onceCall(async () => {
  const processor = await AutoProcessor.from_pretrained(MODEL_ID)
  const model = await AutoModelForImageTextToText.from_pretrained(MODEL_ID, {
    device: 'webgpu',
    dtype: 'fp16',
  })
  return { processor, model }
})

const ocrImage = async (file: File) => {
  const { processor, model } = await loadOcr()
  const imageUrl = URL.createObjectURL(file)

  processor.apply_chat_template
  try {
    const messages = [
      {
        role: 'user' as const,
        content: [
          { type: 'image' as const },
          { type: 'text' as const, text: 'Text Recognition:' },
        ],
      },
    ]
    const prompt = processor.apply_chat_template(messages, {
      add_generation_prompt: true,
    })
    const image = await load_image(imageUrl)
    const inputs = await processor(prompt, image, {
      add_special_tokens: false,
    })

    const outputs = await model.generate({
      ...inputs,
      max_new_tokens: 2048,
    })

    const promptLen = inputs.input_ids.dims.at(-1) ?? 0
    const decoded = processor.batch_decode(
      (outputs as Tensor).slice(null, [promptLen, null]),
      { skip_special_tokens: true },
    )
    return decoded[0] ?? ''
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

export function HfAiOrc() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState('')
  const [durationMs, setDurationMs] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0]
    if (!nextFile) return

    setFile(nextFile)
    setLoading(true)
    setResult('')
    setDurationMs(null)
    const startedAt = performance.now()
    try {
      const text = await ocrImage(nextFile)
      setResult(text)
      setDurationMs(performance.now() - startedAt)
    } catch (err) {
      console.error(err)
      setResult(err instanceof Error ? err.message : String(err))
      setDurationMs(performance.now() - startedAt)
    } finally {
      setLoading(false)
    }
  }

  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {loading && <p>Running OCR…</p>}
      {durationMs !== null && (
        <p className="text-sm text-gray-500">
          总处理时间：{(durationMs / 1000).toFixed(2)}s
        </p>
      )}
      <p>preview</p>
      <div>{file && <img src={previewUrl} alt="preview" />}</div>
      {result && (
        <pre className="mt-2 whitespace-pre-wrap text-sm">{result}</pre>
      )}
    </div>
  )
}
