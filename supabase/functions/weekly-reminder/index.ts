// Supabase Edge Function — weekly-reminder
// 매주 월요일 09:00 실행: 주간 점검 미제출 차량 현장 관리자에게 리마인더 알림

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

  // 전체 차량 조회
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, name, assigned_field_user_id')

  // 이번 주 제출 현황
  const { data: submitted } = await supabase
    .from('weekly_inspections')
    .select('vehicle_id')
    .eq('week_start', weekStart)

  const submittedIds = new Set((submitted ?? []).map((r: { vehicle_id: string }) => r.vehicle_id))

  let sentCount = 0
  for (const v of vehicles ?? []) {
    if (submittedIds.has(v.id)) continue
    if (!v.assigned_field_user_id) continue

    // 오늘 이미 리마인더 발송했으면 스킵
    const todayStr = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', v.id)
      .eq('notif_type', 'inspection_reminder')
      .gte('created_at', todayStr)
    if ((count ?? 0) > 0) continue

    await supabase.from('notifications').insert([{
      user_id: v.assigned_field_user_id,
      vehicle_id: v.id,
      notif_type: 'inspection_reminder',
      title: `📋 ${v.name} 주간 점검 리마인더`,
      body: '이번 주 주간 점검을 아직 제출하지 않았습니다. 오늘 점검을 완료해 주세요.',
      is_read: false,
    }])
    sentCount++
  }

  return new Response(
    JSON.stringify({ ok: true, sent: sentCount, week_start: weekStart }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
