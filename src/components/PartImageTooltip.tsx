'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  partName: string
  imageUrl: string | null
  defaultKm: number | null
  defaultMonths: number | null
}

function formatPeriod(km: number | null, months: number | null): string {
  const parts: string[] = []
  if (km)     parts.push(`${km.toLocaleString()}km`)
  if (months) parts.push(`${months}개월`)
  return parts.length > 0 ? parts.join(' 또는 ') : '주기 미설정'
}

export default function PartImageTooltip({ partName, imageUrl, defaultKm, defaultMonths }: Props) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos]         = useState({ top: 0, left: 0 })
  const [imgError, setImgError] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const TOOLTIP_W = 220
  const TOOLTIP_H = 210

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const vw   = window.innerWidth
    const vh   = window.innerHeight

    let left = rect.right + 8
    let top  = rect.top - 8

    if (left + TOOLTIP_W > vw - 8) left = rect.left - TOOLTIP_W - 8
    if (top + TOOLTIP_H > vh - 8)  top  = vh - TOOLTIP_H - 8
    if (top < 8) top = 8

    setPos({ top, left })
  }, [])

  // 마우스 진입 시 위치 계산 후 표시
  function handleMouseEnter() {
    setImgError(false)
    calcPos()
    setVisible(true)
  }

  // 모바일 터치 토글
  function handleTouch(e: React.TouchEvent) {
    e.preventDefault()
    if (!visible) {
      setImgError(false)
      calcPos()
      setVisible(true)
    } else {
      setVisible(false)
    }
  }

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!visible) return
    function onClickOutside(e: MouseEvent) {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setVisible(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [visible])

  if (!imageUrl) return null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisible(false)}
        onTouchStart={handleTouch}
        aria-label={`${partName} 이미지 보기`}
        className="ml-1 text-gray-400 hover:text-blue-500 transition-colors leading-none"
      >
        🔍
      </button>

      {visible && (
        <div
          ref={tooltipRef}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: TOOLTIP_W }}
          className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden pointer-events-auto"
        >
          <div className="w-full h-[150px] bg-gray-100 flex items-center justify-center overflow-hidden">
            {imgError ? (
              <span className="text-xs text-gray-400">이미지 없음</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={partName}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="px-3 py-2">
            <p className="text-sm font-bold text-gray-900 truncate">{partName}</p>
            <p className="text-xs text-gray-500 mt-0.5">교환 주기: {formatPeriod(defaultKm, defaultMonths)}</p>
          </div>
        </div>
      )}
    </>
  )
}
