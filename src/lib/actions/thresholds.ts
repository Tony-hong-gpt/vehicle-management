'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ConsumableDefaultRow, ConsumableThresholdRow } from '@/types/database'

export interface ThresholdWithDefault extends ConsumableDefaultRow {
  custom_km: number | null
  custom_months: number | null
  threshold_id: string | null
}

export async function getThresholdsForVehicle(vehicleId: string): Promise<ThresholdWithDefault[]> {
  const supabase = await createClient()

  const [{ data: defaults }, { data: customs }] = await Promise.all([
    supabase.from('consumable_defaults').select('*').order('sort_order'),
    supabase.from('consumable_thresholds').select('*').eq('vehicle_id', vehicleId),
  ])

  const customMap = new Map(
    ((customs ?? []) as unknown as ConsumableThresholdRow[]).map((c) => [c.part_name, c])
  )

  return ((defaults ?? []) as unknown as ConsumableDefaultRow[]).map((d) => {
    const custom = customMap.get(d.part_name)
    return {
      ...d,
      custom_km: custom?.custom_km ?? null,
      custom_months: custom?.custom_months ?? null,
      threshold_id: custom?.id ?? null,
    }
  })
}

export async function saveThresholds(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const vehicleId = formData.get('vehicle_id') as string

  // consumable_defaults에서 하한선 조회
  const { data: defaults } = await supabase.from('consumable_defaults').select('*')
  const defaultMap = new Map(
    ((defaults ?? []) as unknown as ConsumableDefaultRow[]).map((d) => [d.part_name, d])
  )

  // 폼에서 part_names 목록 추출
  const partNames = (formData.get('part_names') as string).split(',').filter(Boolean)

  for (const partName of partNames) {
    const rawKm = formData.get(`km_${partName}`)
    const rawMonths = formData.get(`months_${partName}`)

    const newKm = rawKm !== '' && rawKm !== null ? Number(rawKm) : null
    const newMonths = rawMonths !== '' && rawMonths !== null ? Number(rawMonths) : null

    const def = defaultMap.get(partName)
    if (!def) continue

    // 하한선 검증 (50% 미만 불가)
    if (newKm !== null && def.min_km !== null && newKm < def.min_km) {
      throw new Error(`${partName}: km 기준이 하한선(${def.min_km.toLocaleString()} km) 미만입니다.`)
    }
    if (newMonths !== null && def.min_months !== null && newMonths < def.min_months) {
      throw new Error(`${partName}: 기간 기준이 하한선(${def.min_months}개월) 미만입니다.`)
    }

    // 기존 커스텀 조회
    const { data: existing } = await supabase
      .from('consumable_thresholds')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('part_name', partName)
      .maybeSingle()

    const existingRow = existing as unknown as ConsumableThresholdRow | null

    // 기본값과 동일하면 커스텀 행 삭제 (또는 미생성)
    const isDefault = newKm === def.default_km && newMonths === def.default_months
    if (isDefault) {
      if (existingRow) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('consumable_thresholds') as any).delete().eq('id', existingRow.id)
      }
      continue
    }

    // 감사 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('threshold_change_log') as any).insert([{
      vehicle_id: vehicleId,
      part_name: partName,
      old_km: existingRow?.custom_km ?? def.default_km,
      old_months: existingRow?.custom_months ?? def.default_months,
      new_km: newKm,
      new_months: newMonths,
      changed_by: user.id,
    }])

    if (existingRow) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('consumable_thresholds') as any)
        .update({ custom_km: newKm, custom_months: newMonths, modified_by: user.id })
        .eq('id', existingRow.id)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('consumable_thresholds') as any).insert([{
        vehicle_id: vehicleId,
        part_name: partName,
        custom_km: newKm,
        custom_months: newMonths,
        modified_by: user.id,
      }])
    }
  }

  revalidatePath(`/field/thresholds/${vehicleId}`)
}

// 상위 관리자 전용: 차량 커스텀 기준 전체 초기화
export async function resetThresholds(vehicleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role as string | undefined
  if (role !== 'admin') throw new Error('관리자 권한이 필요합니다.')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('consumable_thresholds') as any).delete().eq('vehicle_id', vehicleId)
  revalidatePath(`/field/thresholds/${vehicleId}`)
}
