'use client'

import { useState } from 'react'
import PhotoModal from './PhotoModal'
import type { TimelineItem } from '@/lib/actions/status'

const DOT_COLOR: Record<string, string> = {
  blue:   'bg-blue-500',
  red:    'bg-red-500',
  orange: 'bg-orange-400',
  green:  'bg-green-500',
  gray:   'bg-gray-300',
}

const LINE_COLOR: Record<string, string> = {
  blue:   'border-blue-100',
  red:    'border-red-100',
  orange: 'border-orange-100',
  green:  'border-green-100',
  gray:   'border-gray-100',
}

export default function Timeline({ items }: { items: TimelineItem[] }) {
  const [modalUrl, setModalUrl] = useState<string | null>(null)

  if (items.length === 0) {
    return <p className="text-center text-gray-400 mt-12 text-sm">등록된 이력이 없습니다.</p>
  }

  return (
    <>
      <div className="relative pl-6">
        {/* 세로 선 */}
        <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gray-100" />

        <div className="space-y-1">
          {items.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="relative pb-4">
              {/* 점 */}
              <div className={`absolute -left-3.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${DOT_COLOR[item.color] ?? 'bg-gray-300'}`} />

              <div className={`ml-2 bg-white rounded-2xl border p-4 ${LINE_COLOR[item.color] ?? 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.subtitle}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{item.date}</p>
                </div>

                {item.photo_url && (
                  <button
                    type="button"
                    onClick={() => setModalUrl(item.photo_url!)}
                    className="mt-3 block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.photo_url}
                      alt="첨부 사진"
                      className="w-full max-h-40 object-cover rounded-xl border border-gray-100"
                    />
                    <p className="text-xs text-blue-500 mt-1">🔍 탭하여 확대</p>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalUrl && <PhotoModal url={modalUrl} onClose={() => setModalUrl(null)} />}
    </>
  )
}
