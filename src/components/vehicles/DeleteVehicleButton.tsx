'use client'

import { useTransition } from 'react'
import { deleteVehicle } from '@/lib/actions/vehicles'

export default function DeleteVehicleButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('이 차량을 삭제하면 관련된 모든 점검·정비·사고 기록도 함께 삭제됩니다.\n계속 진행하시겠습니까?')) return
    startTransition(() => deleteVehicle(id))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      {pending ? '삭제 중...' : '차량 삭제'}
    </button>
  )
}
