'use client'

import { useEffect } from 'react'

interface Props {
  url: string
  onClose: () => void
}

export default function PhotoModal({ url, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full text-xl flex items-center justify-center"
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="첨부 사진"
        className="max-w-full max-h-full rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
