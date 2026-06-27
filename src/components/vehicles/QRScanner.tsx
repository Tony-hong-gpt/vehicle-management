'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function QRScanner() {
  const scannerRef = useRef<InstanceType<typeof import('html5-qrcode').Html5Qrcode> | null>(null)
  const [status, setStatus] = useState<'idle' | 'scanning' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    async function startScan() {
      // StrictMode 이중 실행 방지: 기존 인스턴스 먼저 정리
      if (scannerRef.current) {
        try { await scannerRef.current.stop() } catch { /* ignore */ }
        scannerRef.current = null
      }
      // html5-qrcode가 삽입한 DOM 초기화
      const el = document.getElementById('qr-reader')
      if (el) el.innerHTML = ''

      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (uuidRegex.test(decodedText)) {
              scanner.stop().catch(() => {})
              router.push(`/field/inspect/${decodedText}`)
            }
          },
          undefined
        )
        if (mounted) setStatus('scanning')
      } catch {
        if (mounted) {
          setStatus('error')
          setErrorMsg('카메라 접근 권한이 필요합니다.')
        }
      }
    }

    startScan()

    return () => {
      mounted = false
      scannerRef.current?.stop().catch(() => {})
    }
  }, [router])

  return (
    <div className="flex flex-col items-center gap-4 px-4">
      <div className="w-full max-w-sm">
        <div
          id="qr-reader"
          className="w-full rounded-2xl overflow-hidden border-2 border-blue-200"
          style={{ minHeight: 300 }}
        />
      </div>

      {status === 'scanning' && (
        <p className="text-sm text-gray-500">차량 QR 코드를 카메라에 비춰주세요</p>
      )}
      {status === 'error' && (
        <div className="text-center">
          <p className="text-sm text-red-500">{errorMsg}</p>
          <p className="text-xs text-gray-400 mt-1">브라우저 설정에서 카메라 권한을 허용해 주세요.</p>
        </div>
      )}
    </div>
  )
}
