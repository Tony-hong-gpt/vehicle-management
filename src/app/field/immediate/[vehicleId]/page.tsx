import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EventTypePicker from '@/components/immediate/EventTypePicker'
import type { VehicleRow } from '@/types/database'

interface Props {
  params: Promise<{ vehicleId: string }>
  searchParams: Promise<{ success?: string }>
}

const SUCCESS_MSG: Record<string, string> = {
  consumable: '✅ 소모품 교환이 등록되었습니다.',
  incident:   '✅ 이벤트가 등록되었습니다.',
  legal:      '✅ 법정 갱신이 등록되었습니다.',
}

export default async function VehicleImmediatePage({ params, searchParams }: Props) {
  const { vehicleId } = await params
  const { success } = await searchParams

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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <Link href="/field/immediate" className="text-xs text-blue-500">← 차량 목록으로</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-1">{v.name}</h1>
        <p className="text-xs text-gray-400">{v.plate} · 현재 {v.current_mileage?.toLocaleString() ?? 0} km</p>
      </div>

      {success && (
        <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          {SUCCESS_MSG[success] ?? '✅ 등록 완료'}
        </div>
      )}

      <div className="px-4 mt-4">
        <p className="text-xs text-gray-500 mb-3 font-medium">등록할 이벤트를 선택하세요</p>
        <EventTypePicker vehicleId={vehicleId} />
      </div>
    </div>
  )
}
