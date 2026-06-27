'use client'

import { useState, useTransition } from 'react'
import { registerIncident } from '@/lib/actions/immediate'
import PhotoUpload from '@/components/inspections/PhotoUpload'
import SpeechMemoInput from '@/components/inspections/SpeechMemoInput'

type IncidentType = 'damage' | 'battery'

interface Props {
  vehicleId: string
  type: IncidentType
}

const CONFIG: Record<IncidentType, { label: string; icon: string; photoRequired: boolean; notePlaceholder: string }> = {
  damage: {
    label: '외관 파손 발견',
    icon: '⚠️',
    photoRequired: true,
    notePlaceholder: '파손 위치와 상태를 설명해 주세요. (예: 우측 후방 범퍼 긁힘)',
  },
  battery: {
    label: '배터리 방전',
    icon: '🔋',
    photoRequired: false,
    notePlaceholder: '방전 상황을 간략히 기록해 주세요. (예: 주차 중 방전 발생, 출동 서비스 호출)',
  },
}

export default function IncidentForm({ vehicleId, type }: Props) {
  const [isPending, startTransition] = useTransition()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const config = CONFIG[type]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs: string[] = []
    const fd = new FormData(e.currentTarget)

    if (config.photoRequired && !photoUrl) errs.push('파손 사진은 필수입니다.')
    if (!note.trim()) errs.push('상황 설명을 입력하세요.')

    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])

    fd.set('note', note)
    if (photoUrl) fd.set('photo_url', photoUrl)
    startTransition(() => registerIncident(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <input type="hidden" name="incident_type" value={type} />

      {/* 파손 사진 (damage만 필수) */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          사진 첨부{config.photoRequired ? <span className="text-red-500"> *</span> : ' (선택)'}
        </p>
        <PhotoUpload
          onUploaded={setPhotoUrl}
          onRemoved={() => setPhotoUrl(null)}
          label={type === 'damage' ? '📷 파손 사진 첨부' : '📷 사진 첨부'}
          required={config.photoRequired}
        />
      </div>

      {/* 상황 설명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          상황 설명 <span className="text-red-500">*</span>
        </label>
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
        className="w-full min-h-[52px] rounded-xl bg-red-600 text-white font-semibold text-base disabled:opacity-60"
      >
        {isPending ? '등록 중…' : `${config.icon} ${config.label} 등록`}
      </button>
    </form>
  )
}
