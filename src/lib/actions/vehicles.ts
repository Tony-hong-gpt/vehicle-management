'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { FuelType, VehicleRow } from '@/types/database'

function getNextInspectionDate(lastDate: string, capacity: number): string {
  const d = new Date(lastDate)
  if (capacity >= 16) d.setMonth(d.getMonth() + 6)
  else if (capacity >= 11) d.setMonth(d.getMonth() + 12)
  else d.setMonth(d.getMonth() + 24)
  return d.toISOString().split('T')[0]
}

export async function getVehicles(): Promise<VehicleRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as VehicleRow[]
}

export async function getVehicle(id: string): Promise<VehicleRow> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as unknown as VehicleRow
}

export async function createVehicle(formData: FormData) {
  const supabase = await createClient()

  const capacity = Number(formData.get('capacity')) || null
  const lastInspection = (formData.get('last_inspection_date') as string) || null

  const payload = {
    name: formData.get('name') as string,
    plate: formData.get('plate') as string,
    fuel_type: ((formData.get('fuel_type') as string) || null) as FuelType | null,
    year: Number(formData.get('year')) || null,
    capacity,
    current_mileage: Number(formData.get('current_mileage')) || 0,
    insurance_company: (formData.get('insurance_company') as string) || null,
    insurance_policy_no: (formData.get('insurance_policy_no') as string) || null,
    insurance_expire_date: (formData.get('insurance_expire_date') as string) || null,
    last_inspection_date: lastInspection,
    next_inspection_date:
      lastInspection && capacity
        ? getNextInspectionDate(lastInspection, capacity)
        : null,
    last_tax_paid_date: (formData.get('last_tax_paid_date') as string) || null,
    vin: (formData.get('vin') as string) || null,
    primary_operation_time: (formData.get('primary_operation_time') as string) || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('vehicles') as any).insert([payload])
  if (error) throw new Error(error.message)

  revalidatePath('/admin/vehicles')
  redirect('/admin/vehicles')
}

export async function updateVehicle(id: string, formData: FormData) {
  const supabase = await createClient()

  const capacity = Number(formData.get('capacity')) || null
  const lastInspection = (formData.get('last_inspection_date') as string) || null

  const payload = {
    name: formData.get('name') as string,
    plate: formData.get('plate') as string,
    fuel_type: ((formData.get('fuel_type') as string) || null) as FuelType | null,
    year: Number(formData.get('year')) || null,
    capacity,
    current_mileage: Number(formData.get('current_mileage')) || 0,
    insurance_company: (formData.get('insurance_company') as string) || null,
    insurance_policy_no: (formData.get('insurance_policy_no') as string) || null,
    insurance_expire_date: (formData.get('insurance_expire_date') as string) || null,
    last_inspection_date: lastInspection,
    next_inspection_date:
      lastInspection && capacity
        ? getNextInspectionDate(lastInspection, capacity)
        : null,
    last_tax_paid_date: (formData.get('last_tax_paid_date') as string) || null,
    vin: (formData.get('vin') as string) || null,
    primary_operation_time: (formData.get('primary_operation_time') as string) || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('vehicles') as any).update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/vehicles')
  revalidatePath(`/admin/vehicles/${id}`)
  redirect(`/admin/vehicles/${id}`)
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('vehicles') as any).delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/vehicles')
  redirect('/admin/vehicles')
}
