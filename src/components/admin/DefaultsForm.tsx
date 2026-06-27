'use client'

import { useState, useTransition } from 'react'
import { saveConsumableDefaults } from '@/lib/actions/admin'
import type { ConsumableDefaultRow } from '@/types/database'
import PartImageTooltip from '@/components/PartImageTooltip'

interface Props {
  defaults: ConsumableDefaultRow[]
}

export default function DefaultsForm({ defaults }: Props) {
  const [isPending, startTransition] = useTransition()
  const [savedOk, setSavedOk] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavedOk(false)
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('ids', defaults.map((d) => d.id).join(','))

    startTransition(async () => {
      try {
        await saveConsumableDefaults(fd)
        setSavedOk(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장 실패')
      }
    })
  }

  const categories = [...new Set(defaults.map((d) => d.part_category))]

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{cat}</h3>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-40">소모품</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">기본 km</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">기본 개월</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">최소 km</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">최소 개월</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {defaults.filter((d) => d.part_category === cat).map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <span className="flex items-center gap-0.5">
                        {d.part_name}
                        <PartImageTooltip
                          partName={d.part_name}
                          imageUrl={d.image_url ?? null}
                          defaultKm={d.default_km}
                          defaultMonths={d.default_months}
                        />
                      </span>
                    </td>
                    {(['default_km', 'default_months', 'min_km', 'min_months'] as const).map((field) => (
                      <td key={field} className="px-4 py-3 text-center">
                        <input
                          type="number"
                          name={`${field}_${d.id}`}
                          defaultValue={d[field] ?? ''}
                          min={0}
                          className="w-24 text-center rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">⚠️ {error}</p>}
      {savedOk && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">✅ 기본값이 저장되었습니다. 이후 현장 관리자의 하한선 기준도 함께 갱신됩니다.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
      >
        {isPending ? '저장 중…' : '기본값 저장'}
      </button>
    </form>
  )
}
