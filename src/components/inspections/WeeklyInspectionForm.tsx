'use client'

import { useState, useTransition } from 'react'
import { submitWeeklyInspection } from '@/lib/actions/inspections'
import PhotoUpload from './PhotoUpload'
import SpeechMemoInput from './SpeechMemoInput'

interface Props {
  vehicleId: string
  vehicleName: string
  currentMileage: number
}

type RadioGroupProps = {
  label: string
  name: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  required?: boolean
}

function RadioGroup({ label, name, options, value, onChange, required }: RadioGroupProps) {
  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <p className="text-sm font-medium text-gray-700 mb-3">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </p>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex-1 min-w-[80px] min-h-[48px] flex items-center justify-center rounded-xl border text-sm font-medium cursor-pointer transition-colors select-none ${
              value === opt.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

export default function WeeklyInspectionForm({ vehicleId, vehicleName, currentMileage }: Props) {
  const [isPending, startTransition] = useTransition()

  const [mileage, setMileage] = useState(String(currentMileage || ''))
  const [exteriorOk, setExteriorOk] = useState<string>('')
  const [interiorClean, setInteriorClean] = useState<string>('')
  const [carWashDone, setCarWashDone] = useState<string>('')
  const [lightsOk, setLightsOk] = useState<string>('')
  const [fluidsOk, setFluidsOk] = useState<string>('')
  const [tireStatus, setTireStatus] = useState<string>('')
  const [note, setNote] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  function validate(): string[] {
    const errs: string[] = []
    if (!mileage || Number(mileage) === 0) errs.push('누적 주행거리를 입력하세요.')
    if (!exteriorOk) errs.push('외관 상태를 선택하세요.')
    if (!interiorClean) errs.push('실내 청소 상태를 선택하세요.')
    if (!carWashDone) errs.push('외부 세차 상태를 선택하세요.')
    if (!lightsOk) errs.push('등화 장치 상태를 선택하세요.')
    if (!fluidsOk) errs.push('냉각수·워셔액 상태를 선택하세요.')
    if (!tireStatus) errs.push('타이어 상태를 선택하세요.')
    if (exteriorOk === 'false' && !photoUrl) errs.push('외관 이상 시 사진을 첨부해야 합니다.')
    return errs
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs = validate()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])

    const form = e.currentTarget
    const formData = new FormData(form)
    if (photoUrl) formData.set('exterior_photo_url', photoUrl)

    startTransition(() => submitWeeklyInspection(formData))
  }

  const needsPhoto = exteriorOk === 'false'

  return (
    <form onSubmit={handleSubmit} className="pb-8">
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      {photoUrl && <input type="hidden" name="exterior_photo_url" value={photoUrl} />}

      {/* 주행거리 */}
      <div className="py-4 border-b border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          누적 주행거리 (km)<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            name="mileage"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            min={currentMileage}
            placeholder={String(currentMileage)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 pr-12"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">km</span>
        </div>
      </div>

      {/* 외관 상태 */}
      <RadioGroup
        label="외관 상태"
        name="exterior_ok"
        value={exteriorOk}
        onChange={setExteriorOk}
        required
        options={[
          { value: 'true', label: '정상' },
          { value: 'false', label: '이상' },
        ]}
      />
      {needsPhoto && (
        <div className="px-0 pb-4 -mt-2">
          <p className="text-xs text-red-500 mb-1">외관 이상 발견 시 사진을 첨부하세요.</p>
          <PhotoUpload
            onUploaded={(url) => setPhotoUrl(url)}
            onRemoved={() => setPhotoUrl(null)}
          />
        </div>
      )}

      {/* 실내 청소 */}
      <RadioGroup
        label="실내 청소 상태"
        name="interior_clean"
        value={interiorClean}
        onChange={setInteriorClean}
        required
        options={[
          { value: 'good', label: '상' },
          { value: 'fair', label: '중' },
          { value: 'poor', label: '하' },
        ]}
      />

      {/* 외부 세차 */}
      <RadioGroup
        label="외부 세차 상태"
        name="car_wash_done"
        value={carWashDone}
        onChange={setCarWashDone}
        required
        options={[
          { value: 'true', label: '완료' },
          { value: 'false', label: '미완' },
        ]}
      />

      {/* 등화 장치 */}
      <RadioGroup
        label="등화 장치"
        name="lights_ok"
        value={lightsOk}
        onChange={setLightsOk}
        required
        options={[
          { value: 'true', label: '정상' },
          { value: 'false', label: '이상' },
        ]}
      />

      {/* 냉각수·워셔액 */}
      <RadioGroup
        label="냉각수·워셔액"
        name="fluids_ok"
        value={fluidsOk}
        onChange={setFluidsOk}
        required
        options={[
          { value: 'true', label: '정상' },
          { value: 'false', label: '보충 필요' },
        ]}
      />

      {/* 타이어 */}
      <RadioGroup
        label="타이어 상태"
        name="tire_status"
        value={tireStatus}
        onChange={setTireStatus}
        required
        options={[
          { value: 'normal', label: '정상' },
          { value: 'wear', label: '편마모' },
          { value: 'replace', label: '교체 필요' },
        ]}
      />

      {/* 특이사항 메모 */}
      <div className="py-4">
        <p className="text-sm font-medium text-gray-700 mb-3">특이사항 메모</p>
        <SpeechMemoInput value={note} onChange={setNote} />
      </div>

      {/* 유효성 오류 */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-600">• {e}</p>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full min-h-[52px] rounded-xl bg-blue-600 text-white font-semibold text-base disabled:opacity-60 transition-opacity"
      >
        {isPending ? '제출 중…' : '주간 점검 제출'}
      </button>
    </form>
  )
}
