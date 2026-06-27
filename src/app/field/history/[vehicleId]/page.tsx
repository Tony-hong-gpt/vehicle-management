import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getVehicleTimeline } from '@/lib/actions/status'
import Timeline from '@/components/field/Timeline'
import type { VehicleRow } from '@/types/database'

interface Props {
  params: Promise<{ vehicleId: string }>
}

export default async function VehicleHistoryPage({ params }: Props) {
  const { vehicleId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single()

  if (!vehicle) notFound()
  const v = vehicle as unknown as VehicleRow

  const timeline = await getVehicleTimeline(vehicleId)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <Link href="/field/history" className="text-xs text-blue-500">← 차량 목록으로</Link>
        <h1 className="text-lg font-bold text-gray-900 mt-1">{v.name} — 정비 이력</h1>
        <p className="text-xs text-gray-400">{v.plate} · {v.current_mileage?.toLocaleString() ?? 0} km · 총 {timeline.length}건</p>
      </div>

      {/* 범례 */}
      <div className="px-4 mt-3 flex gap-3 flex-wrap">
        {[
          { color: 'bg-blue-500',   label: '소모품 교환' },
          { color: 'bg-red-500',    label: '파손' },
          { color: 'bg-orange-400', label: '방전' },
          { color: 'bg-green-500',  label: '법정 갱신' },
          { color: 'bg-gray-300',   label: '주간 점검' },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="px-4 mt-4">
        <Timeline items={timeline} />
      </div>
    </div>
  )
}
