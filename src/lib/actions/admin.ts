'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getMondayOfWeek } from '@/lib/utils/date'
import type { ConsumableDefaultRow, ThresholdChangeLogRow } from '@/types/database'

// ── 주간 점검 제출 현황 (전체 차량)
export interface InspectionStatusRow {
  vehicle_id: string
  vehicle_name: string
  plate: string
  submitted: boolean
  mileage: number | null
  submitted_at: string | null
}

export async function getWeeklyInspectionStatus(): Promise<InspectionStatusRow[]> {
  const supabase = await createClient()
  const weekStart = getMondayOfWeek(new Date())

  const [{ data: vehicles }, { data: inspections }] = await Promise.all([
    supabase.from('vehicles').select('id, name, plate').order('name'),
    supabase.from('weekly_inspections')
      .select('vehicle_id, mileage, created_at')
      .eq('week_start', weekStart),
  ])

  const inspMap = new Map(
    ((inspections ?? []) as { vehicle_id: string; mileage: number | null; created_at: string }[])
      .map((i) => [i.vehicle_id, i])
  )

  return ((vehicles ?? []) as { id: string; name: string; plate: string }[]).map((v) => {
    const insp = inspMap.get(v.id)
    return {
      vehicle_id: v.id,
      vehicle_name: v.name,
      plate: v.plate,
      submitted: !!insp,
      mileage: insp?.mileage ?? null,
      submitted_at: insp?.created_at ?? null,
    }
  })
}

// ── 소모품 기본값 조회
export async function getConsumableDefaultsAdmin(): Promise<ConsumableDefaultRow[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('consumable_defaults').select('*').order('sort_order')
  return (data ?? []) as unknown as ConsumableDefaultRow[]
}

// ── 소모품 기본값 저장
export async function saveConsumableDefaults(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.user_metadata?.role !== 'admin') throw new Error('관리자 권한이 필요합니다.')

  const ids = (formData.get('ids') as string).split(',').filter(Boolean)

  for (const id of ids) {
    const defaultKm     = formData.get(`default_km_${id}`)
    const defaultMonths = formData.get(`default_months_${id}`)
    const minKm         = formData.get(`min_km_${id}`)
    const minMonths     = formData.get(`min_months_${id}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('consumable_defaults') as any).update({
      default_km:     defaultKm     !== '' ? Number(defaultKm)     : null,
      default_months: defaultMonths !== '' ? Number(defaultMonths) : null,
      min_km:         minKm         !== '' ? Number(minKm)         : null,
      min_months:     minMonths     !== '' ? Number(minMonths)      : null,
    }).eq('id', id)
  }

  revalidatePath('/admin/defaults')
}

// ── 감사 로그 조회
export interface AuditLogItem extends ThresholdChangeLogRow {
  vehicle_name: string | null
  changer_email: string | null
}

export async function getAuditLog(limit = 50): Promise<AuditLogItem[]> {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('threshold_change_log')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(limit)

  if (!logs || logs.length === 0) return []

  const logList = logs as unknown as ThresholdChangeLogRow[]

  // 차량명 조회
  const vehicleIds = [...new Set(logList.map((l) => l.vehicle_id).filter(Boolean))] as string[]
  const userIds    = [...new Set(logList.map((l) => l.changed_by).filter(Boolean))] as string[]

  const [{ data: vehicles }, { data: users }] = await Promise.all([
    vehicleIds.length > 0
      ? supabase.from('vehicles').select('id, name').in('id', vehicleIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? supabase.from('auth.users' as 'vehicles').select('id, email').in('id', userIds)
      : Promise.resolve({ data: [] }),
  ])

  const vMap = new Map(((vehicles ?? []) as { id: string; name: string }[]).map((v) => [v.id, v.name]))
  const uMap = new Map(((users ?? []) as { id: string; email: string }[]).map((u) => [u.id, u.email]))

  return logList.map((l) => ({
    ...l,
    vehicle_name: l.vehicle_id ? (vMap.get(l.vehicle_id) ?? null) : null,
    changer_email: l.changed_by ? (uMap.get(l.changed_by) ?? null) : null,
  }))
}
