import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { VehicleRow } from '@/types/database'

export default async function ImmediatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.user_metadata?.role as string | undefined

  let query = supabase.from('vehicles').select('*').order('name')
  if (role !== 'admin') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).eq('assigned_field_user_id', user.id)
  }

  const { data: vehicles } = await query
  const list = (vehicles ?? []) as unknown as VehicleRow[]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">즉시 등록</h1>
        <p className="text-sm text-gray-500 mt-1">소모품 교환·파손·법정 갱신을 즉시 기록하세요</p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {list.length === 0 && (
          <p className="text-center text-gray-400 mt-12 text-sm">담당 차량이 없습니다.</p>
        )}
        {list.map((v) => (
          <Link
            key={v.id}
            href={`/field/immediate/${v.id}`}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-300 transition-colors min-h-[72px]"
          >
            <span className="text-2xl">🚌</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{v.name}</p>
              <p className="text-xs text-gray-400">{v.plate} · {v.current_mileage?.toLocaleString() ?? 0} km</p>
            </div>
            <span className="ml-auto text-gray-300 text-lg">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
