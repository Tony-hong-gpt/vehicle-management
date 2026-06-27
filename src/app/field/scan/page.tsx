'use client'

import dynamic from 'next/dynamic'

const QRScanner = dynamic(() => import('@/components/vehicles/QRScanner'), { ssr: false })

export default function ScanPage() {
  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-lg font-bold text-gray-900 mb-1">QR 스캔</h1>
      <p className="text-sm text-gray-500 mb-6">차량에 부착된 QR 코드를 스캔하여 주간 점검을 시작합니다.</p>
      <QRScanner />
    </div>
  )
}
