'use server'

import { createClient } from '@/lib/supabase/server'
import type { VehicleRow, MaintenanceRecordRow } from '@/types/database'

// ── 주간 주행거리 추이 (최근 12주)
export interface WeeklyMileagePoint {
  week: string       // "MM/DD"
  [vehicleName: string]: number | string
}

export async function getWeeklyMileageStats(vehicleIds: string[], vehicleNames: Record<string, string>): Promise<WeeklyMileagePoint[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('weekly_inspections')
    .select('vehicle_id, week_start, mileage')
    .in('vehicle_id', vehicleIds)
    .order('week_start', { ascending: true })
    .limit(vehicleIds.length * 12)

  if (!data || data.length === 0) return []

  // 주차별 맵 구성
  const weekMap = new Map<string, WeeklyMileagePoint>()

  for (const row of data as { vehicle_id: string; week_start: string; mileage: number | null }[]) {
    const weekLabel = row.week_start.slice(5).replace('-', '/')  // "MM/DD"
    if (!weekMap.has(row.week_start)) {
      weekMap.set(row.week_start, { week: weekLabel })
    }
    const name = vehicleNames[row.vehicle_id] ?? row.vehicle_id
    weekMap.get(row.week_start)![name] = row.mileage ?? 0
  }

  return Array.from(weekMap.values()).slice(-12)
}

// ── 월별 소모품 교환 비용 (최근 6개월)
export interface MonthlyCostPoint {
  month: string   // "YYYY-MM"
  total: number
  breakdown: Record<string, number>
}

export async function getMonthlyCostStats(vehicleIds: string[]): Promise<MonthlyCostPoint[]> {
  const supabase = await createClient()

  // 최근 6개월 시작일
  const since = new Date()
  since.setMonth(since.getMonth() - 5)
  since.setDate(1)
  const sinceStr = since.toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('maintenance_records')
    .select('service_date, part_name, cost')
    .in('vehicle_id', vehicleIds)
    .gte('service_date', sinceStr)
    .not('cost', 'is', null)
    .order('service_date', { ascending: true })

  if (!data || (data as unknown[]).length === 0) return []

  const monthMap = new Map<string, MonthlyCostPoint>()

  for (const row of data as { service_date: string; part_name: string; cost: number }[]) {
    const month = row.service_date.slice(0, 7)
    if (!monthMap.has(month)) {
      monthMap.set(month, { month, total: 0, breakdown: {} })
    }
    const pt = monthMap.get(month)!
    pt.total += row.cost ?? 0
    pt.breakdown[row.part_name] = (pt.breakdown[row.part_name] ?? 0) + (row.cost ?? 0)
  }

  return Array.from(monthMap.values())
}

// ── 차량별 총 주행거리 비교
export interface VehicleUsagePoint {
  name: string
  mileage: number
  plate: string
}

export async function getVehicleUsageStats(vehicleIds: string[]): Promise<VehicleUsagePoint[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('vehicles')
    .select('name, plate, current_mileage')
    .in('id', vehicleIds)
    .order('current_mileage', { ascending: false })

  return ((data ?? []) as unknown as VehicleRow[]).map((v) => ({
    name: v.name,
    plate: v.plate,
    mileage: v.current_mileage ?? 0,
  }))
}

// ── 페이지 초기 데이터 (차량 목록 + 권한 필터)
export interface StatsPageData {
  vehicles: { id: string; name: string; plate: string }[]
  isAdmin: boolean
}

export async function getStatsPageData(): Promise<StatsPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { vehicles: [], isAdmin: false }

  const role = user.user_metadata?.role as string | undefined
  const isAdmin = role === 'admin'

  let query = supabase.from('vehicles').select('id, name, plate').order('name')
  if (!isAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).eq('assigned_field_user_id', user.id)
  }

  const { data } = await query
  return {
    vehicles: (data ?? []) as { id: string; name: string; plate: string }[],
    isAdmin,
  }
}

// ── 소모품 교환 횟수 TOP5
export interface PartCountPoint {
  part_name: string
  count: number
  total_cost: number
}

export async function getPartRankingStats(vehicleIds: string[]): Promise<PartCountPoint[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('maintenance_records')
    .select('part_name, cost')
    .in('vehicle_id', vehicleIds)

  if (!data || data.length === 0) return []

  const map = new Map<string, { count: number; total_cost: number }>()
  for (const row of data as { part_name: string; cost: number | null }[]) {
    if (!map.has(row.part_name)) map.set(row.part_name, { count: 0, total_cost: 0 })
    const pt = map.get(row.part_name)!
    pt.count++
    pt.total_cost += row.cost ?? 0
  }

  return Array.from(map.entries())
    .map(([part_name, v]) => ({ part_name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}
