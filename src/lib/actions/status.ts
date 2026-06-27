'use server'

import { createClient } from '@/lib/supabase/server'
import { getMondayOfWeek } from '@/lib/utils/date'
import type {
  VehicleRow,
  MaintenanceRecordRow,
  IncidentRecordRow,
  LegalDocumentRow,
  ConsumableDefaultRow,
  ConsumableThresholdRow,
} from '@/types/database'

export type TrafficColor = 'green' | 'yellow' | 'red' | 'purple'

export interface ConsumableStatus {
  part_name: string
  part_category: string
  threshold_km: number | null
  threshold_months: number | null
  used_km: number | null
  used_months: number | null
  pct: number          // 0~100+, 진행률
  level: 'ok' | 'warn' | 'critical'
  last_service_date: string | null
  last_mileage: number | null
}

export interface LegalStatus {
  doc_type: string
  expire_date: string | null
  days_left: number | null
  level: 'ok' | 'warn' | 'critical' | 'overdue'
}

export interface VehicleStatusResult {
  vehicle: VehicleRow
  color: TrafficColor
  reasons: string[]
  consumables: ConsumableStatus[]
  legals: LegalStatus[]
  weekSubmitted: boolean
}

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / 86400000)
}

export async function getVehicleStatuses(): Promise<VehicleStatusResult[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const role = user.user_metadata?.role as string | undefined

  let vQuery = supabase.from('vehicles').select('*').order('name')
  if (role !== 'admin') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vQuery = (vQuery as any).eq('assigned_field_user_id', user.id)
  }
  const { data: vehicles } = await vQuery
  const vehicleList = (vehicles ?? []) as unknown as VehicleRow[]
  if (vehicleList.length === 0) return []

  const vehicleIds = vehicleList.map((v) => v.id)
  const weekStart = getMondayOfWeek(new Date())
  const today = new Date()

  const [
    { data: weeklyRaw },
    { data: maintenanceRaw },
    { data: incidentRaw },
    { data: legalRaw },
    { data: defaultsRaw },
    { data: customsRaw },
  ] = await Promise.all([
    supabase.from('weekly_inspections').select('vehicle_id, exterior_ok, interior_clean, lighting_ok, tire_status').eq('week_start', weekStart).in('vehicle_id', vehicleIds),
    supabase.from('maintenance_records').select('*').in('vehicle_id', vehicleIds).order('service_date', { ascending: false }),
    supabase.from('incident_records').select('*').in('vehicle_id', vehicleIds).order('created_at', { ascending: false }),
    supabase.from('legal_documents').select('*').in('vehicle_id', vehicleIds).order('updated_at', { ascending: false }),
    supabase.from('consumable_defaults').select('*').order('sort_order'),
    supabase.from('consumable_thresholds').select('*').in('vehicle_id', vehicleIds),
  ])

  const weekMap = new Map<string, typeof weeklyRaw extends (infer T)[] | null ? T : never>()
  for (const w of (weeklyRaw ?? [])) weekMap.set((w as { vehicle_id: string }).vehicle_id, w)

  const defaults = (defaultsRaw ?? []) as unknown as ConsumableDefaultRow[]
  const customs = (customsRaw ?? []) as unknown as ConsumableThresholdRow[]
  const maintenance = (maintenanceRaw ?? []) as unknown as MaintenanceRecordRow[]
  const incidents = (incidentRaw ?? []) as unknown as IncidentRecordRow[]
  const legals = (legalRaw ?? []) as unknown as LegalDocumentRow[]

  return vehicleList.map((vehicle) => {
    const reasons: string[] = []
    let color: TrafficColor = 'green'

    function upgrade(c: TrafficColor) {
      const rank = { green: 0, yellow: 1, red: 2, purple: 3 }
      if (rank[c] > rank[color]) color = c
    }

    // ── 주간 점검 미제출
    const weekData = weekMap.get(vehicle.id)
    const weekSubmitted = !!weekData

    if (!weekSubmitted) {
      upgrade('yellow')
      reasons.push('이번 주 점검 미제출')
    } else {
      const wd = weekData as { exterior_ok: boolean | null; lighting_ok: boolean | null; tire_status: string | null; interior_clean: string | null }
      if (wd.exterior_ok === false) { upgrade('red'); reasons.push('외관 이상') }
      if (wd.lighting_ok === false) { upgrade('red'); reasons.push('등화 이상') }
      if (wd.tire_status === 'replace') { upgrade('red'); reasons.push('타이어 교체 필요') }
      if (wd.interior_clean === 'poor') { upgrade('yellow'); reasons.push('실내 청소 불량') }
    }

    // ── 미해결 파손·방전 이벤트
    const vIncidents = incidents.filter((i) => i.vehicle_id === vehicle.id)
    if (vIncidents.length > 0) {
      upgrade('red')
      reasons.push('미해결 이벤트 있음')
    }

    // ── 소모품 상태
    const vMaintenance = maintenance.filter((m) => m.vehicle_id === vehicle.id)
    const customMap = new Map(customs.filter((c) => c.vehicle_id === vehicle.id).map((c) => [c.part_name, c]))

    const consumables: ConsumableStatus[] = defaults.map((def) => {
      const custom = customMap.get(def.part_name)
      const thKm = custom?.custom_km ?? def.default_km
      const thMonths = custom?.custom_months ?? def.default_months

      const lastRecord = vMaintenance.find((m) => m.part_name === def.part_name)
      const usedKm = lastRecord ? vehicle.current_mileage - lastRecord.mileage_at_service : null
      const usedMonths = lastRecord
        ? Math.floor(daysBetween(new Date(lastRecord.service_date), today) / 30)
        : null

      // 진행률 계산 (km·기간 중 더 높은 쪽)
      let pct = 0
      if (thKm && usedKm !== null) pct = Math.max(pct, (usedKm / thKm) * 100)
      if (thMonths && usedMonths !== null) pct = Math.max(pct, (usedMonths / thMonths) * 100)

      const level: ConsumableStatus['level'] = pct >= 100 ? 'critical' : pct >= 90 ? 'warn' : 'ok'

      if (level === 'critical') { upgrade('red'); reasons.push(`${def.part_name} 교환 초과`) }
      else if (level === 'warn') { upgrade('yellow'); reasons.push(`${def.part_name} 교환 임박`) }

      return {
        part_name: def.part_name,
        part_category: def.part_category,
        threshold_km: thKm,
        threshold_months: thMonths,
        used_km: usedKm,
        used_months: usedMonths,
        pct: Math.min(Math.round(pct), 999),
        level,
        last_service_date: lastRecord?.service_date ?? null,
        last_mileage: lastRecord?.mileage_at_service ?? null,
      }
    })

    // ── 법정 만기
    const vLegals = legals.filter((l) => l.vehicle_id === vehicle.id)
    const latestLegal = new Map<string, LegalDocumentRow>()
    for (const l of vLegals) {
      if (!latestLegal.has(l.doc_type ?? '')) latestLegal.set(l.doc_type ?? '', l)
    }

    // vehicles 테이블의 보험·검사 만기일도 병합
    const legalItems: LegalStatus[] = []

    function addLegal(docType: string, expireDate: string | null) {
      if (!expireDate) return
      const daysLeft = daysBetween(today, new Date(expireDate))
      let level: LegalStatus['level'] = 'ok'
      if (daysLeft < 0) { level = 'overdue'; upgrade('purple'); reasons.push(`${docType} 만기 경과`) }
      else if (daysLeft <= 15) { level = 'critical'; upgrade('purple'); reasons.push(`${docType} 만기 임박`) }
      else if (daysLeft <= 30) { level = 'warn'; upgrade('yellow') }
      legalItems.push({ doc_type: docType, expire_date: expireDate, days_left: daysLeft, level })
    }

    addLegal('보험', latestLegal.get('insurance')?.expire_date ?? vehicle.insurance_expire_date)
    addLegal('정기검사', latestLegal.get('inspection')?.expire_date ?? vehicle.next_inspection_date)
    addLegal('자동차세', latestLegal.get('tax')?.expire_date ?? null)

    if (reasons.length === 0) reasons.push('정상')

    return { vehicle, color, reasons, consumables, legals: legalItems, weekSubmitted }
  })
}

// ── 단일 차량 타임라인
export interface TimelineItem {
  id: string
  date: string
  type: 'maintenance' | 'incident' | 'legal' | 'inspection'
  title: string
  subtitle: string
  photo_url: string | null
  color: string
}

export async function getVehicleTimeline(vehicleId: string): Promise<TimelineItem[]> {
  const supabase = await createClient()

  const [{ data: m }, { data: i }, { data: l }, { data: w }] = await Promise.all([
    supabase.from('maintenance_records').select('*').eq('vehicle_id', vehicleId).order('service_date', { ascending: false }),
    supabase.from('incident_records').select('*').eq('vehicle_id', vehicleId).order('created_at', { ascending: false }),
    supabase.from('legal_documents').select('*').eq('vehicle_id', vehicleId).order('updated_at', { ascending: false }),
    supabase.from('weekly_inspections').select('*').eq('vehicle_id', vehicleId).order('week_start', { ascending: false }).limit(12),
  ])

  const items: TimelineItem[] = []

  for (const r of (m ?? []) as unknown as MaintenanceRecordRow[]) {
    items.push({
      id: r.id,
      date: r.service_date,
      type: 'maintenance',
      title: `🔧 ${r.part_name} 교환`,
      subtitle: `${r.mileage_at_service.toLocaleString()} km${r.cost ? ` · ${r.cost.toLocaleString()}원` : ''}`,
      photo_url: r.receipt_url,
      color: 'blue',
    })
  }

  for (const r of (i ?? []) as unknown as IncidentRecordRow[]) {
    const isAlarm = r.incident_type === 'damage'
    items.push({
      id: r.id,
      date: r.created_at.split('T')[0],
      type: 'incident',
      title: r.incident_type === 'damage' ? '⚠️ 외관 파손' : r.incident_type === 'battery_dead' ? '🔋 배터리 방전' : '📌 기타 이벤트',
      subtitle: r.note,
      photo_url: r.photo_url,
      color: isAlarm ? 'red' : 'orange',
    })
  }

  for (const r of (l ?? []) as unknown as LegalDocumentRow[]) {
    const labels: Record<string, string> = { insurance: '🛡️ 보험 갱신', inspection: '📋 정기검사 완료', tax: '💳 자동차세 납부', license: '📄 면허 갱신' }
    items.push({
      id: r.id,
      date: r.updated_at.split('T')[0],
      type: 'legal',
      title: labels[r.doc_type ?? ''] ?? '📄 법정 서류',
      subtitle: r.expire_date ? `만기: ${r.expire_date}` : '',
      photo_url: r.photo_url,
      color: 'green',
    })
  }

  for (const r of (w ?? []) as unknown as { id: string; week_start: string; mileage: number | null; note: string | null; exterior_photo_url: string | null }[]) {
    items.push({
      id: r.id,
      date: r.week_start,
      type: 'inspection',
      title: '📋 주간 점검',
      subtitle: r.mileage ? `${r.mileage.toLocaleString()} km` : '',
      photo_url: r.exterior_photo_url,
      color: 'gray',
    })
  }

  items.sort((a, b) => b.date.localeCompare(a.date))
  return items
}

// ── 법정 만기 캘린더용 데이터
export interface CalendarEvent {
  date: string
  label: string
  vehicle_name: string
  color: string
}

export async function getLegalCalendarEvents(): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const role = user.user_metadata?.role as string | undefined
  let vQuery = supabase.from('vehicles').select('*')
  if (role !== 'admin') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vQuery = (vQuery as any).eq('assigned_field_user_id', user.id)
  }
  const { data: vehicles } = await vQuery
  const list = (vehicles ?? []) as unknown as VehicleRow[]

  const events: CalendarEvent[] = []
  const today = new Date()

  for (const v of list) {
    const daysColor = (expire: string | null) => {
      if (!expire) return null
      const d = daysBetween(today, new Date(expire))
      if (d < 0) return 'purple'
      if (d <= 15) return 'red'
      if (d <= 30) return 'orange'
      return 'green'
    }

    if (v.insurance_expire_date) {
      const c = daysColor(v.insurance_expire_date)
      if (c) events.push({ date: v.insurance_expire_date, label: '보험 만기', vehicle_name: v.name, color: c })
    }
    if (v.next_inspection_date) {
      const c = daysColor(v.next_inspection_date)
      if (c) events.push({ date: v.next_inspection_date, label: '정기검사', vehicle_name: v.name, color: c })
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date))
}
