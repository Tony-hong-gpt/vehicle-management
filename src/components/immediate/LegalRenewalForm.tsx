'use client'

import { useState, useTransition } from 'react'
import { registerLegalRenewal } from '@/lib/actions/immediate'
import PhotoUpload from '@/components/inspections/PhotoUpload'
import SpeechMemoInput from '@/components/inspections/SpeechMemoInput'

type LegalType = 'insurance' | 'inspection' | 'tax'

interface Props {
  vehicleId: string
  type: LegalType
  capacity?: number
}

const CONFIG: Record<LegalType, {
  label: string
  icon: string
  docType: string
  photoRequired: boolean
  photoLabel: string
  showExpireDate: boolean
  showServiceDate: boolean
  expireLabel: string
}> = {
  insurance: {
    label: '보험 갱신 완료',
    icon: '🛡️',
    docType: 'insurance',
    photoRequired: true,
    photoLabel: '📷 새 보험증권 사진 첨부',
    showExpireDate: true,
    showServiceDate: false,
    expireLabel: '새 보험 만기일',
  },
  inspection: {
    label: '정기검사 완료',
    icon: '📋',
    docType: 'inspection',
    photoRequired: true,
    photoLabel: '📷 검사증 사진 첨부',
    showExpireDate: false,
    showServiceDate: true,
    expireLabel: '다음 검사 만기일 (자동 계산)',
  },
  tax: {
    label: '자동차세 납부 완료',
    icon: '💳',
    docType: 'tax',
    photoRequired: false,
    photoLabel: '📷 납부 영수증 첨부',
    showExpireDate: true,
    showServiceDate: false,
    expireLabel: '납부 기한',
  },
}

function getNextInspectionDate(serviceDate: string, capacity: number): string {
  const d = new Date(serviceDate)
  if (capacity >= 16) d.setMonth(d.getMonth() + 6)
  else if (capacity >= 11) d.setMonth(d.getMonth() + 12)
  else d.setMonth(d.getMonth() + 24)
  return d.toISOString().split('T')[0]
}

export default function LegalRenewalForm({ vehicleId, type, capacity = 0 }: Props) {
  const [isPending, startTransition] = useTransition()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const config = CONFIG[type]

  // 정기검사: 수검일 입력 시 다음 만기일 미리 계산해서 표시
  const autoNextDate = type === 'inspection' && serviceDate
    ? getNextInspectionDate(serviceDate, capacity)
    : null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs: string[] = []
    const fd = new FormData(e.currentTarget)

    if (config.photoRequired && !photoUrl) errs.push(`${config.label}에 필요한 사진을 첨부하세요.`)
    if (config.showServiceDate && !fd.get('service_date')) errs.push('수검일을 입력하세요.')
    if (config.showExpireDate && !fd.get('expire_date')) errs.push('만기일을 입력하세요.')

    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])

    // 정기검사는 자동 계산된 다음 만기일을 expire_date로 전송
    if (type === 'inspection' && autoNextDate) {
      fd.set('expire_date', autoNextDate)
    }
    if (photoUrl) fd.set('photo_url', photoUrl)
    fd.set('note', note)
    startTransition(() => registerLegalRenewal(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <input type="hidden" name="doc_type" value={config.docType} />

      {/* 수검일 (정기검사) */}
      {config.showServiceDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            수검일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="service_date"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
          />
          {autoNextDate && (
            <p className="mt-2 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
              ✅ 다음 정기검사 만기일 자동 계산: <strong>{autoNextDate}</strong>
              {capacity >= 16 ? ' (6개월, 대형버스)' : capacity >= 11 ? ' (12개월, 중형승합)' : ' (24개월)'}
            </p>
          )}
        </div>
      )}

      {/* 만기일 (보험·자동차세) */}
      {config.showExpireDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {config.expireLabel} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="expire_date"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>
      )}

      {/* 증빙 사진 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          증빙 사진{config.photoRequired ? <span className="text-red-500"> *</span> : ' (선택)'}
        </p>
        <PhotoUpload
          onUploaded={setPhotoUrl}
          onRemoved={() => setPhotoUrl(null)}
          label={config.photoLabel}
          required={config.photoRequired}
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
        className="w-full min-h-[52px] rounded-xl bg-green-600 text-white font-semibold text-base disabled:opacity-60"
      >
        {isPending ? '등록 중…' : `${config.icon} ${config.label} 등록`}
      </button>
    </form>
  )
}
