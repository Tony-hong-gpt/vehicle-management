'use client'

import { useState, useTransition } from 'react'
import { registerConsumable } from '@/lib/actions/immediate'
import PhotoUpload from '@/components/inspections/PhotoUpload'
import SpeechMemoInput from '@/components/inspections/SpeechMemoInput'
import type { ConsumableDefaultRow } from '@/types/database'

interface Props {
  vehicleId: string
  currentMileage: number
  consumables: ConsumableDefaultRow[]
}

export default function ConsumableForm({ vehicleId, currentMileage, consumables }: Props) {
  const [isPending, startTransition] = useTransition()
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  // 부품 선택 시 category 자동 설정
  const [selectedPart, setSelectedPart] = useState<ConsumableDefaultRow | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs: string[] = []
    const fd = new FormData(e.currentTarget)

    if (!fd.get('part_name')) errs.push('교환 부품을 선택하세요.')
    if (!fd.get('mileage_at_service') || Number(fd.get('mileage_at_service')) === 0) errs.push('교환 시 주행거리를 입력하세요.')
    if (!fd.get('service_date')) errs.push('교환 날짜를 입력하세요.')

    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])

    if (receiptUrl) fd.set('receipt_url', receiptUrl)
    fd.set('note', note)
    startTransition(() => registerConsumable(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      {selectedPart && <input type="hidden" name="part_category" value={selectedPart.part_category} />}

      {/* 부품 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          교환 부품 <span className="text-red-500">*</span>
        </label>
        <select
          name="part_name"
          onChange={(e) => {
            const found = consumables.find(c => c.part_name === e.target.value) ?? null
            setSelectedPart(found)
          }}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          defaultValue=""
        >
          <option value="" disabled>부품을 선택하세요</option>
          {consumables.map((c) => (
            <option key={c.id} value={c.part_name}>
              [{c.part_category}] {c.part_name}
            </option>
          ))}
        </select>
      </div>

      {/* 교환 시 주행거리 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          교환 시 주행거리 (km) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="mileage_at_service"
          min={0}
          defaultValue={currentMileage || ''}
          placeholder={String(currentMileage)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* 교환 날짜 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          교환 날짜 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="service_date"
          defaultValue={new Date().toISOString().split('T')[0]}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* 비용 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">비용 (원, 선택)</label>
        <input
          type="number"
          name="cost"
          min={0}
          placeholder="예: 45000"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* 영수증 사진 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">영수증 사진 (권장)</p>
        <PhotoUpload
          onUploaded={setReceiptUrl}
          onRemoved={() => setReceiptUrl(null)}
          label="📷 영수증 사진 첨부"
        />
      </div>

      {/* 메모 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">메모 (선택)</label>
        <SpeechMemoInput value={note} onChange={setNote} />
      </div>

      {errors.length > 0 && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-200">
          {errors.map((e, i) => <p key={i} className="text-xs text-red-600">• {e}</p>)}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full min-h-[52px] rounded-xl bg-blue-600 text-white font-semibold text-base disabled:opacity-60"
      >
        {isPending ? '등록 중…' : '소모품 교환 등록'}
      </button>
    </form>
  )
}
