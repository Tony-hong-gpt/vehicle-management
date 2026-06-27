'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
}

// Web Speech API types (not in default TS lib)
interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}
interface ISpeechRecognitionEvent {
  results: ISpeechRecognitionResultList
}
interface ISpeechRecognitionResultList {
  [index: number]: ISpeechRecognitionResult
  length: number
}
interface ISpeechRecognitionResult {
  [index: number]: { transcript: string }
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

export default function SpeechMemoInput({ value, onChange }: Props) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(!!SR)
  }, [])

  function toggleListening() {
    if (!supported) return

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('')
      onChange(value ? value + ' ' + transcript : transcript)
    }

    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <div className="relative">
      <textarea
        name="note"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="특이사항을 입력하세요"
        rows={3}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 pr-12"
      />
      {supported && (
        <button
          type="button"
          onClick={toggleListening}
          className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            listening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title={listening ? '음성 입력 중지' : '음성으로 입력'}
        >
          🎤
        </button>
      )}
    </div>
  )
}
