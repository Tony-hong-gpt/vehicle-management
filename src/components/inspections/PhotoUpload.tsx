'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onUploaded: (url: string) => void
  onRemoved: () => void
  bucket?: string
  label?: string
  required?: boolean
}

export default function PhotoUpload({
  onUploaded,
  onRemoved,
  bucket = 'inspection-photos',
  label = '📷 사진 첨부',
  required = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    setError(null)
    setUploading(true)

    // 미리보기
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `uploads/${Date.now()}.${ext}`

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false })

    setUploading(false)

    if (uploadError) {
      setError('업로드 실패: ' + uploadError.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    onUploaded(publicUrl)
  }

  function handleRemove() {
    setPreview(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onRemoved()
  }

  return (
    <div className="mt-3">
      {preview ? (
        <div className="relative w-full max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="외관 사진" className="w-full rounded-xl border border-gray-200 object-cover max-h-48" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full text-sm flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-red-300 text-red-500 text-sm font-medium w-full justify-center min-h-[48px] hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {uploading ? '업로드 중…' : `${label}${required ? ' (필수)' : ''}`}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
