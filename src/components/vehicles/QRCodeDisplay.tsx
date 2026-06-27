'use client'

import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

interface Props {
  vehicleId: string
  vehicleName: string
}

export default function QRCodeDisplay({ vehicleId, vehicleName }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)

  function download() {
    const canvas = canvasRef.current?.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `QR_${vehicleName}.png`
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={canvasRef as React.RefObject<HTMLDivElement>} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <QRCodeCanvas
          value={vehicleId}
          size={180}
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-xs text-gray-400 text-center">
        스캔 시 주간 점검 화면으로 이동합니다
      </p>
      <button
        onClick={download}
        className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
      >
        PNG 다운로드
      </button>
    </div>
  )
}
