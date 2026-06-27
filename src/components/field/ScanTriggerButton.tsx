'use client'

import { useState, useTransition } from 'react'
import { runDailyScan } from '@/lib/actions/notifications'

export default function ScanTriggerButton() {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleScan() {
    setDone(false)
    startTransition(async () => {
      await runDailyScan()
      setDone(true)
    })
  }

  return (
    <button
      onClick={handleScan}
      disabled={isPending}
      className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 disabled:opacity-50"
    >
      {isPending ? '스캔 중…' : done ? '✅ 완료' : '🔄 알림 스캔'}
    </button>
  )
}
