// Supabase Edge Function — weekly-auto-yellow
// 매주 월요일 12:00 실행: 주간 점검 미제출 차량에 🟡 주의 알림 생성

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function getMondayOfWeek(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceKey)
  const weekStart = getMondayOfWeek(new Date())

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, name, assigned_field_user_id')

  const { data: submitted } = await supabase
    .from('weekly_inspections')
    .select('vehicle_id')
    .eq('week_start', weekStart)

  const submittedIds = new Set((submitted ?? []).map((r: { vehicle_id: string }) => r.vehicle_id))

  let alertCount = 0
  for (const v of vehicles ?? []) {
    if (submittedIds.has(v.id)) continue

    const todayStr = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', v.id)
      .eq('notif_type', 'inspection_overdue')
      .gte('created_at', todayStr)
    if ((count ?? 0) > 0) continue

    // 미제출 차량 담당자 + 전체 알림 (admin용 null)
    const targets = [
      v.assigned_field_user_id,
      null,  // admin 포함 전체
    ]
    for (const userId of targets) {
      await supabase.from('notifications').insert([{
        user_id: userId,
        vehicle_id: v.id,
        notif_type: 'inspection_overdue',
        title: `🟡 ${v.name} 주간 점검 미제출`,
        body: '오후 12시가 지났습니다. 주간 점검을 아직 제출하지 않아 주의 상태로 전환됩니다.',
        is_read: false,
      }])
    }
    alertCount++
  }

  return new Response(
    JSON.stringify({ ok: true, alerted: alertCount, week_start: weekStart }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
