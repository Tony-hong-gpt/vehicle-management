import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLegalCalendarEvents } from '@/lib/actions/status'
import LegalCalendar from '@/components/field/LegalCalendar'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const events = await getLegalCalendarEvents()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <Link href="/field/status" className="text-xs text-blue-500">← 차량 현황으로</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-1">법정 만기 캘린더</h1>
        <p className="text-sm text-gray-500 mt-1">보험·정기검사·자동차세 만기일</p>

        {/* 색상 범례 */}
        <div className="flex gap-3 mt-3 flex-wrap">
          {[
            { color: 'bg-green-500',  label: '60일 초과' },
            { color: 'bg-orange-400', label: '30일 이내' },
            { color: 'bg-red-500',    label: '15일 이내' },
            { color: 'bg-purple-500', label: '만기 경과' },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        <LegalCalendar events={events} />
      </div>
    </div>
  )
}
