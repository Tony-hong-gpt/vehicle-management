'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ConsumableDefaultRow } from '@/types/database'

export async function getConsumableDefaults(): Promise<ConsumableDefaultRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consumable_defaults')
    .select('*')
    .order('sort_order')
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ConsumableDefaultRow[]
}

// 소모품 교환
export async function registerConsumable(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const vehicleId = formData.get('vehicle_id') as string
  const mileage = Number(formData.get('mileage_at_service')) || 0

  const payload = {
    vehicle_id: vehicleId,
    part_category: formData.get('part_category') as string,
    part_name: formData.get('part_name') as string,
    mileage_at_service: mileage,
    service_date: formData.get('service_date') as string,
    cost: formData.get('cost') ? Number(formData.get('cost')) : null,
    receipt_url: (formData.get('receipt_url') as string) || null,
    note: (formData.get('note') as string) || null,
    registered_by: user.id,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('maintenance_records') as any).insert([payload])
  if (error) throw new Error(error.message)

  // 차량 주행거리 업데이트
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('vehicles') as any).update({ current_mileage: mileage }).eq('id', vehicleId)

  revalidatePath(`/field/immediate/${vehicleId}`)
  revalidatePath('/admin/vehicles')
  redirect(`/field/immediate/${vehicleId}?success=consumable`)
}

// 파손·방전 이벤트
export async function registerIncident(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const vehicleId = formData.get('vehicle_id') as string

  const payload = {
    vehicle_id: vehicleId,
    incident_type: formData.get('incident_type') as string,
    photo_url: (formData.get('photo_url') as string) || null,
    note: formData.get('note') as string,
    registered_by: user.id,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('incident_records') as any).insert([payload])
  if (error) throw new Error(error.message)

  revalidatePath(`/field/immediate/${vehicleId}`)
  revalidatePath('/admin/vehicles')
  redirect(`/field/immediate/${vehicleId}?success=incident`)
}

// 법정 갱신 (보험·정기검사·자동차세)
export async function registerLegalRenewal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const vehicleId = formData.get('vehicle_id') as string
  const docType = formData.get('doc_type') as string
  const expireDate = (formData.get('expire_date') as string) || null
  const photoUrl = (formData.get('photo_url') as string) || null
  const note = (formData.get('note') as string) || null

  // legal_documents upsert (같은 차량+타입은 최신 기록으로 갱신)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: docError } = await (supabase.from('legal_documents') as any).insert([{
    vehicle_id: vehicleId,
    doc_type: docType,
    expire_date: expireDate,
    photo_url: photoUrl,
    note,
    updated_by: user.id,
  }])
  if (docError) throw new Error(docError.message)

  // 정기검사의 경우 vehicle 테이블의 검사일 업데이트
  if (docType === 'inspection' && expireDate) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('capacity, last_inspection_date')
      .eq('id', vehicleId)
      .single()

    if (vehicle) {
      const serviceDate = formData.get('service_date') as string
      const capacity = (vehicle as { capacity: number | null }).capacity ?? 0
      let nextDate = expireDate

      // CLAUDE.md 정기검사 주기 로직
      if (serviceDate) {
        const d = new Date(serviceDate)
        if (capacity >= 16) d.setMonth(d.getMonth() + 6)
        else if (capacity >= 11) d.setMonth(d.getMonth() + 12)
        else d.setMonth(d.getMonth() + 24)
        nextDate = d.toISOString().split('T')[0]
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('vehicles') as any).update({
        last_inspection_date: serviceDate || expireDate,
        next_inspection_date: nextDate,
      }).eq('id', vehicleId)
    }
  }

  // 보험의 경우 vehicle 테이블 만기일 업데이트
  if (docType === 'insurance' && expireDate) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('vehicles') as any)
      .update({ insurance_expire_date: expireDate })
      .eq('id', vehicleId)
  }

  revalidatePath(`/field/immediate/${vehicleId}`)
  revalidatePath('/admin/vehicles')
  redirect(`/field/immediate/${vehicleId}?success=legal`)
}
