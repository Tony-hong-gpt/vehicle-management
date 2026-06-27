'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { VehicleRow } from '@/types/database'

interface Props {
  defaultValues?: Partial<VehicleRow>
  action: (formData: FormData) => Promise<void>
  submitLabel?: string
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

const selectClass =
  'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function VehicleForm({ defaultValues: d = {}, action, submitLabel = '저장' }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => action(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">기본 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="차량명 *">
            <input name="name" required defaultValue={d.name ?? ''} className={inputClass} placeholder="대형버스 A" />
          </Field>
          <Field label="번호판 *">
            <input name="plate" required defaultValue={d.plate ?? ''} className={inputClass} placeholder="서울12가3456" />
          </Field>
          <Field label="연료 종류">
            <select name="fuel_type" defaultValue={d.fuel_type ?? ''} className={selectClass}>
              <option value="">선택</option>
              <option value="diesel">디젤</option>
              <option value="gasoline">가솔린</option>
              <option value="electric">전기</option>
              <option value="hybrid">하이브리드</option>
            </select>
          </Field>
          <Field label="연식">
            <input name="year" type="number" defaultValue={d.year ?? ''} className={inputClass} placeholder="2020" min="1990" max="2030" />
          </Field>
          <Field label="정원 (명)">
            <input name="capacity" type="number" defaultValue={d.capacity ?? ''} className={inputClass} placeholder="45" min="1" max="100" />
          </Field>
          <Field label="현재 주행거리 (km)">
            <input name="current_mileage" type="number" defaultValue={d.current_mileage ?? 0} className={inputClass} min="0" />
          </Field>
          <Field label="차대번호 (VIN)">
            <input name="vin" defaultValue={d.vin ?? ''} className={inputClass} />
          </Field>
          <Field label="주 운행 시간대">
            <input name="primary_operation_time" defaultValue={d.primary_operation_time ?? ''} className={inputClass} placeholder="주일 오전 8~12시" />
          </Field>
        </div>
      </section>

      {/* 보험 */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">보험</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="보험사">
            <input name="insurance_company" defaultValue={d.insurance_company ?? ''} className={inputClass} />
          </Field>
          <Field label="증권번호">
            <input name="insurance_policy_no" defaultValue={d.insurance_policy_no ?? ''} className={inputClass} />
          </Field>
          <Field label="보험 만기일">
            <input name="insurance_expire_date" type="date" defaultValue={d.insurance_expire_date ?? ''} className={inputClass} />
          </Field>
        </div>
      </section>

      {/* 법정 항목 */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">법정 항목</h2>
        <p className="text-xs text-gray-400">최근 정기검사일 입력 시 다음 검사일이 정원 기준으로 자동 계산됩니다.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="최근 정기검사일">
            <input name="last_inspection_date" type="date" defaultValue={d.last_inspection_date ?? ''} className={inputClass} />
          </Field>
          <Field label="다음 정기검사일 (자동)">
            <input
              name="next_inspection_date_display"
              type="date"
              readOnly
              defaultValue={d.next_inspection_date ?? ''}
              className={`${inputClass} bg-gray-50 text-gray-400`}
              tabIndex={-1}
            />
          </Field>
          <Field label="최근 자동차세 납부일">
            <input name="last_tax_paid_date" type="date" defaultValue={d.last_tax_paid_date ?? ''} className={inputClass} />
          </Field>
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors min-h-[40px]"
        >
          {pending ? '저장 중...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
