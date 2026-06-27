'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { InteriorClean, TireStatus, WeeklyInspectionRow } from '@/types/database'
import { getMondayOfWeek } from '@/lib/utils/date'
import { createNotification } from '@/lib/actions/notifications'

export async function getWeeklyInspections(vehicleId: string): Promise<WeeklyInspectionRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weekly_inspections')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('submitted_at', { ascending: false })
    .limit(12)
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as WeeklyInspectionRow[]
}

export async function getThisWeekInspection(vehicleId: string): Promise<WeeklyInspectionRow | null> {
  const supabase = await createClient()
  const weekStart = getMondayOfWeek(new Date())
  const { data, error } = await supabase
    .from('weekly_inspections')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('week_start', weekStart)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as unknown as WeeklyInspectionRow | null
}

export async function submitWeeklyInspection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const vehicleId = formData.get('vehicle_id') as string
  const mileage = Number(formData.get('mileage')) || 0
  const exteriorOk = formData.get('exterior_ok') === 'true'
  const interiorClean = (formData.get('interior_clean') as InteriorClean) || null
  const carWashDone = formData.get('car_wash_done') === 'true'
  const lightsOk = formData.get('lights_ok') === 'true'
  const fluidsOk = formData.get('fluids_ok') === 'true'
  const tireStatus = (formData.get('tire_status') as TireStatus) || null
  const note = (formData.get('note') as string) || null
  const exteriorPhotoUrl = (formData.get('exterior_photo_url') as string) || null

  const payload = {
    vehicle_id: vehicleId,
    week_start: getMondayOfWeek(new Date()),
    mileage,
    exterior_ok: exteriorOk,
    interior_clean: interiorClean,
    car_wash_done: carWashDone,
    lights_ok: lightsOk,
    fluids_ok: fluidsOk,
    tire_status: tireStatus,
    note,
    exterior_photo_url: exteriorPhotoUrl,
    submitted_by: user.id,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('weekly_inspections') as any).insert([payload])
  if (error) throw new Error(error.message)

  // 주행거리 최신화
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('vehicles') as any).update({ current_mileage: mileage }).eq('id', vehicleId)

  // 이상 항목 발견 시 알림 생성
  if (!exteriorOk) {
    await createNotification({ user_id: user.id, vehicle_id: vehicleId, notif_type: 'inspection_exterior', title: '🔴 외관 이상 발견', body: '주간 점검에서 외관 이상이 보고되었습니다.' })
  }
  if (tireStatus === 'replace') {
    await createNotification({ user_id: user.id, vehicle_id: vehicleId, notif_type: 'inspection_tire', title: '🔴 타이어 교체 필요', body: '주간 점검에서 타이어 교체가 필요한 상태로 보고되었습니다.' })
  }

  revalidatePath(`/field/inspect/${vehicleId}`)
  revalidatePath('/admin/vehicles')
  redirect('/field/notifications')
}
