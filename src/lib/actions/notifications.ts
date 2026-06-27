'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { NotificationRow } from '@/types/database'

// ── 내 알림 목록 조회
export async function getMyNotifications(): Promise<NotificationRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []) as unknown as NotificationRow[]
}

// ── 미확인 알림 수
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .eq('is_read', false)

  return count ?? 0
}

// ── 단일 알림 읽음 처리
export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('notifications') as any)
    .update({ is_read: true })
    .eq('id', notificationId)
  revalidatePath('/field/notifications')
}

// ── 전체 읽음 처리
export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('notifications') as any)
    .update({ is_read: true })
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .eq('is_read', false)

  revalidatePath('/field/notifications')
}

// ── 알림 생성 헬퍼 (서버 액션에서 내부 호출용)
export async function createNotification(payload: {
  user_id?: string | null
  vehicle_id?: string | null
  notif_type: string
  title: string
  body: string
}) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('notifications') as any).insert([{
    ...payload,
    is_read: false,
  }])
}

// ── 소모품·법정 만기 스캔 및 알림 생성 (수동 실행 또는 Cron 호출)
export async function runDailyScan() {
  const supabase = await createClient()
  const today = new Date()

  function daysBetween(from: Date, to: Date) {
    return Math.floor((to.getTime() - from.getTime()) / 86400000)
  }

  // ── 법정 만기 알림
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, name, insurance_expire_date, next_inspection_date, assigned_field_user_id')

  for (const v of (vehicles ?? []) as {
    id: string; name: string
    insurance_expire_date: string | null
    next_inspection_date: string | null
    assigned_field_user_id: string | null
  }[]) {
    const legalItems = [
      { label: '보험', date: v.insurance_expire_date },
      { label: '정기검사', date: v.next_inspection_date },
    ]

    for (const item of legalItems) {
      if (!item.date) continue
      const daysLeft = daysBetween(today, new Date(item.date))

      let notifType = ''
      let title = ''
      let body = ''

      if (daysLeft < 0) {
        notifType = 'legal_overdue'
        title = `🟣 ${v.name} ${item.label} 만기 경과`
        body = `${item.label}이 ${Math.abs(daysLeft)}일 경과했습니다. 즉시 갱신하세요.`
      } else if (daysLeft <= 15) {
        notifType = 'legal_critical'
        title = `🔴 ${v.name} ${item.label} 만기 임박`
        body = `${item.label} 만기까지 ${daysLeft}일 남았습니다.`
      } else if (daysLeft <= 30) {
        notifType = 'legal_warn'
        title = `🟡 ${v.name} ${item.label} 만기 예정`
        body = `${item.label} 만기까지 ${daysLeft}일 남았습니다.`
      } else if (daysLeft <= 60) {
        notifType = 'legal_notice'
        title = `📅 ${v.name} ${item.label} 만기 예고`
        body = `${item.label} 만기까지 ${daysLeft}일 남았습니다.`
      }

      if (!notifType) continue

      // 오늘 이미 같은 타입 알림이 있으면 중복 발송 방지
      const todayStr = today.toISOString().split('T')[0]
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('vehicle_id', v.id)
        .eq('notif_type', notifType)
        .gte('created_at', todayStr)

      if ((count ?? 0) > 0) continue

      await createNotification({
        user_id: v.assigned_field_user_id,
        vehicle_id: v.id,
        notif_type: notifType,
        title,
        body,
      })
    }
  }

  // ── 소모품 임박 알림
  const { data: defaults } = await supabase.from('consumable_defaults').select('*')
  const { data: maintenance } = await supabase
    .from('maintenance_records')
    .select('vehicle_id, part_name, mileage_at_service, service_date')
    .order('service_date', { ascending: false })
  const { data: customs } = await supabase.from('consumable_thresholds').select('*')

  for (const v of (vehicles ?? []) as { id: string; name: string; assigned_field_user_id: string | null }[]) {
    const vMaint = (maintenance ?? []) as { vehicle_id: string; part_name: string; mileage_at_service: number; service_date: string }[]
    const vCustom = (customs ?? []) as { vehicle_id: string; part_name: string; custom_km: number | null; custom_months: number | null }[]

    const { data: vData } = await supabase
      .from('vehicles')
      .select('current_mileage')
      .eq('id', v.id)
      .single()
    const currentMileage = (vData as { current_mileage: number } | null)?.current_mileage ?? 0

    for (const def of (defaults ?? []) as { part_name: string; default_km: number | null; default_months: number | null }[]) {
      const custom = vCustom.find((c) => c.vehicle_id === v.id && c.part_name === def.part_name)
      const thKm = custom?.custom_km ?? def.default_km
      const thMonths = custom?.custom_months ?? def.default_months

      const lastRecord = vMaint.find((m) => m.vehicle_id === v.id && m.part_name === def.part_name)
      if (!lastRecord) continue

      const usedKm = currentMileage - lastRecord.mileage_at_service
      const usedMonths = Math.floor(daysBetween(new Date(lastRecord.service_date), today) / 30)

      let pct = 0
      if (thKm) pct = Math.max(pct, (usedKm / thKm) * 100)
      if (thMonths) pct = Math.max(pct, (usedMonths / thMonths) * 100)

      let notifType = ''
      let title = ''
      let body = ''

      if (pct >= 100) {
        notifType = `consumable_critical_${def.part_name}`
        title = `🔴 ${v.name} ${def.part_name} 즉시 교환 필요`
        body = `교환 기준을 초과했습니다. 즉시 교환하세요.`
      } else if (pct >= 90) {
        notifType = `consumable_warn_${def.part_name}`
        title = `🟡 ${v.name} ${def.part_name} 교환 임박`
        body = `교환 기준의 ${Math.round(pct)}%에 도달했습니다.`
      } else if (pct >= 80) {
        notifType = `consumable_notice_${def.part_name}`
        title = `📌 ${v.name} ${def.part_name} 교환 예고`
        body = `교환 기준의 ${Math.round(pct)}%에 도달했습니다.`
      }

      if (!notifType) continue

      const todayStr = today.toISOString().split('T')[0]
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('vehicle_id', v.id)
        .eq('notif_type', notifType)
        .gte('created_at', todayStr)

      if ((count ?? 0) > 0) continue

      await createNotification({
        user_id: v.assigned_field_user_id,
        vehicle_id: v.id,
        notif_type: notifType,
        title,
        body,
      })
    }
  }

  revalidatePath('/field/notifications')
}
