// Supabase Edge Function — daily-scan
// 매일 00:00 실행: 소모품 임박·법정 만기 스캔 → notifications INSERT
// SLICE 10에서 Cron 연결 예정

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceKey)
  const today = new Date()

  function daysBetween(from: Date, to: Date) {
    return Math.floor((to.getTime() - from.getTime()) / 86400000)
  }

  async function createNotif(payload: {
    user_id: string | null
    vehicle_id: string
    notif_type: string
    title: string
    body: string
  }) {
    const todayStr = today.toISOString().split('T')[0]
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', payload.vehicle_id)
      .eq('notif_type', payload.notif_type)
      .gte('created_at', todayStr)
    if ((count ?? 0) > 0) return  // 오늘 이미 발송

    await supabase.from('notifications').insert([{ ...payload, is_read: false }])
  }

  // ── 차량 목록
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, name, current_mileage, insurance_expire_date, next_inspection_date, assigned_field_user_id')

  for (const v of vehicles ?? []) {
    // 법정 만기 알림
    const legalItems = [
      { label: '보험', date: v.insurance_expire_date },
      { label: '정기검사', date: v.next_inspection_date },
    ]
    for (const item of legalItems) {
      if (!item.date) continue
      const daysLeft = daysBetween(today, new Date(item.date))
      let notifType = '', title = '', body = ''

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
      await createNotif({ user_id: v.assigned_field_user_id, vehicle_id: v.id, notif_type: notifType, title, body })
    }

    // 소모품 임박 알림
    const { data: defaults } = await supabase.from('consumable_defaults').select('*')
    const { data: customs }  = await supabase.from('consumable_thresholds').select('*').eq('vehicle_id', v.id)
    const { data: maint }    = await supabase.from('maintenance_records').select('*').eq('vehicle_id', v.id).order('service_date', { ascending: false })

    for (const def of defaults ?? []) {
      const custom = (customs ?? []).find((c: { part_name: string }) => c.part_name === def.part_name) as { custom_km: number | null; custom_months: number | null } | undefined
      const thKm     = custom?.custom_km     ?? def.default_km
      const thMonths = custom?.custom_months ?? def.default_months
      const last = (maint ?? []).find((m: { part_name: string }) => m.part_name === def.part_name) as { mileage_at_service: number; service_date: string } | undefined
      if (!last) continue

      const usedKm     = v.current_mileage - last.mileage_at_service
      const usedMonths = Math.floor(daysBetween(new Date(last.service_date), today) / 30)
      let pct = 0
      if (thKm)     pct = Math.max(pct, (usedKm / thKm) * 100)
      if (thMonths) pct = Math.max(pct, (usedMonths / thMonths) * 100)

      let notifType = '', title = '', body = ''
      if (pct >= 100) {
        notifType = `consumable_critical_${def.part_name}`
        title = `🔴 ${v.name} ${def.part_name} 즉시 교환 필요`
        body  = `교환 기준을 초과했습니다. 즉시 교환하세요.`
      } else if (pct >= 90) {
        notifType = `consumable_warn_${def.part_name}`
        title = `🟡 ${v.name} ${def.part_name} 교환 임박`
        body  = `교환 기준의 ${Math.round(pct)}%에 도달했습니다.`
      } else if (pct >= 80) {
        notifType = `consumable_notice_${def.part_name}`
        title = `📌 ${v.name} ${def.part_name} 교환 예고`
        body  = `교환 기준의 ${Math.round(pct)}%에 도달했습니다.`
      }
      if (!notifType) continue
      await createNotif({ user_id: v.assigned_field_user_id, vehicle_id: v.id, notif_type: notifType, title, body })
    }
  }

  return new Response(JSON.stringify({ ok: true, scanned_at: today.toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
