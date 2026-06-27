import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getConsumableDefaults } from '@/lib/actions/immediate'
import ConsumableForm from '@/components/immediate/ConsumableForm'
import IncidentForm from '@/components/immediate/IncidentForm'
import LegalRenewalForm from '@/components/immediate/LegalRenewalForm'
import type { VehicleRow } from '@/types/database'

type EventType = 'consumable' | 'damage' | 'battery' | 'insurance' | 'inspection' | 'tax'

const VALID_TYPES: EventType[] = ['consumable', 'damage', 'battery', 'insurance', 'inspection', 'tax']

const TITLES: Record<EventType, string> = {
  consumable: '🔧 소모품 교환',
  damage:     '⚠️ 외관 파손 발견',
  battery:    '🔋 배터리 방전',
  insurance:  '🛡️ 보험 갱신 완료',
  inspection: '📋 정기검사 완료',
  tax:        '💳 자동차세 납부 완료',
}

interface Props {
  params: Promise<{ vehicleId: string; type: string }>
}

export default async function ImmediateFormPage({ params }: Props) {
  const { vehicleId, type } = await params

  if (!VALID_TYPES.includes(type as EventType)) notFound()
  const eventType = type as EventType

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

  const consumables = eventType === 'consumable' ? await getConsumableDefaults() : []

  function renderForm() {
    if (eventType === 'consumable') {
      return (
        <ConsumableForm
          vehicleId={vehicleId}
          currentMileage={v.current_mileage ?? 0}
          consumables={consumables}
        />
      )
    }
    if (eventType === 'damage' || eventType === 'battery') {
      return <IncidentForm vehicleId={vehicleId} type={eventType} />
    }
    return <LegalRenewalForm vehicleId={vehicleId} type={eventType} capacity={v.capacity ?? 0} />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <Link href={`/field/immediate/${vehicleId}`} className="text-xs text-blue-500">← 이벤트 선택으로</Link>
        <h1 className="text-lg font-bold text-gray-900 mt-1">{TITLES[eventType]}</h1>
        <p className="text-xs text-gray-400">{v.name} · {v.plate}</p>
      </div>

      <div className="px-4 mt-5">
        {renderForm()}
      </div>
    </div>
  )
}
