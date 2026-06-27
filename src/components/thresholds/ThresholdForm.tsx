'use client'

import { useState, useTransition } from 'react'
import { saveThresholds, resetThresholds } from '@/lib/actions/thresholds'
import type { ThresholdWithDefault } from '@/lib/actions/thresholds'

interface Props {
  vehicleId: string
  thresholds: ThresholdWithDefault[]
  isAdmin: boolean
}

// 소모품별 현재 적용 기준 (커스텀 우선, 없으면 기본값)
function effectiveKm(t: ThresholdWithDefault) {
  return t.custom_km ?? t.default_km
}
function effectiveMonths(t: ThresholdWithDefault) {
  return t.custom_months ?? t.default_months
}

export default function ThresholdForm({ vehicleId, thresholds, isAdmin }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isResetting, startReset] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedOk, setSavedOk] = useState(false)

  // 각 부품의 km·months 로컬 상태
  const [values, setValues] = useState<Record<string, { km: string; months: string }>>(() => {
    const init: Record<string, { km: string; months: string }> = {}
    for (const t of thresholds) {
      init[t.part_name] = {
        km: effectiveKm(t) !== null ? String(effectiveKm(t)) : '',
        months: effectiveMonths(t) !== null ? String(effectiveMonths(t)) : '',
      }
    }
    return init
  })

  function handleChange(partName: string, field: 'km' | 'months', val: string) {
    setValues((prev) => ({ ...prev, [partName]: { ...prev[partName], [field]: val } }))
    setSavedOk(false)
    setSaveError(null)
  }

  function isCustomized(t: ThresholdWithDefault) {
    return t.custom_km !== null || t.custom_months !== null
  }

  function belowMin(t: ThresholdWithDefault, field: 'km' | 'months'): boolean {
    const val = Number(values[t.part_name]?.[field])
    if (!val) return false
    if (field === 'km' && t.min_km !== null) return val < t.min_km
    if (field === 'months' && t.min_months !== null) return val < t.min_months
    return false
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaveError(null)
    setSavedOk(false)

    const fd = new FormData()
    fd.set('vehicle_id', vehicleId)
    fd.set('part_names', thresholds.map((t) => t.part_name).join(','))
    for (const t of thresholds) {
      fd.set(`km_${t.part_name}`, values[t.part_name]?.km ?? '')
      fd.set(`months_${t.part_name}`, values[t.part_name]?.months ?? '')
    }

    startTransition(async () => {
      try {
        await saveThresholds(fd)
        setSavedOk(true)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : '저장 실패')
      }
    })
  }

  function handleReset() {
    if (!confirm('이 차량의 모든 알림 기준을 기본값으로 초기화하시겠습니까?')) return
    startReset(async () => {
      await resetThresholds(vehicleId)
      // 값도 기본값으로 리셋
      const next: Record<string, { km: string; months: string }> = {}
      for (const t of thresholds) {
        next[t.part_name] = {
          km: t.default_km !== null ? String(t.default_km) : '',
          months: t.default_months !== null ? String(t.default_months) : '',
        }
      }
      setValues(next)
      setSavedOk(true)
    })
  }

  // 카테고리 그룹핑
  const categories = Array.from(new Set(thresholds.map((t) => t.part_category)))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {categories.map((cat) => {
        const items = thresholds.filter((t) => t.part_category === cat)
        return (
          <div key={cat}>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{cat}</h3>
            <div className="space-y-3">
              {items.map((t) => {
                const kmErr = belowMin(t, 'km')
                const monthsErr = belowMin(t, 'months')
                const custom = isCustomized(t)
                return (
                  <div key={t.part_name} className={`bg-white rounded-2xl border p-4 ${custom ? 'border-blue-200' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900 text-sm">{t.part_name}</span>
                      {custom && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">커스텀</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* km 기준 */}
                      {t.default_km !== null && (
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">교환 주기 (km)</label>
                          <input
                            type="number"
                            min={t.min_km ?? 0}
                            value={values[t.part_name]?.km ?? ''}
                            onChange={(e) => handleChange(t.part_name, 'km', e.target.value)}
                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                              kmErr ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200'
                            }`}
                          />
                          {kmErr && (
                            <p className="text-xs text-red-500 mt-1">최소 {t.min_km?.toLocaleString()} km</p>
                          )}
                          <p className="text-xs text-gray-300 mt-1">
                            기본 {t.default_km.toLocaleString()} · 최소 {t.min_km?.toLocaleString() ?? '-'}
                          </p>
                        </div>
                      )}

                      {/* 기간 기준 */}
                      {t.default_months !== null && (
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">교환 주기 (개월)</label>
                          <input
                            type="number"
                            min={t.min_months ?? 0}
                            value={values[t.part_name]?.months ?? ''}
                            onChange={(e) => handleChange(t.part_name, 'months', e.target.value)}
                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                              monthsErr ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200'
                            }`}
                          />
                          {monthsErr && (
                            <p className="text-xs text-red-500 mt-1">최소 {t.min_months}개월</p>
                          )}
                          <p className="text-xs text-gray-300 mt-1">
                            기본 {t.default_months}개월 · 최소 {t.min_months ?? '-'}개월
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {saveError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          ⚠️ {saveError}
        </div>
      )}
      {savedOk && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          ✅ 저장되었습니다.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full min-h-[52px] rounded-xl bg-blue-600 text-white font-semibold text-base disabled:opacity-60"
      >
        {isPending ? '저장 중…' : '알림 기준 저장'}
      </button>

      {isAdmin && (
        <button
          type="button"
          onClick={handleReset}
          disabled={isResetting}
          className="w-full min-h-[48px] rounded-xl border border-gray-200 text-gray-500 text-sm font-medium disabled:opacity-60"
        >
          {isResetting ? '초기화 중…' : '🔄 기본값으로 초기화 (관리자)'}
        </button>
      )}
    </form>
  )
}
