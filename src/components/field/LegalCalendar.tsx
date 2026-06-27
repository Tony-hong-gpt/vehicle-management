'use client'

import { useState } from 'react'
import type { CalendarEvent } from '@/lib/actions/status'

const COLOR_MAP: Record<string, { dot: string; bg: string; text: string }> = {
  green:  { dot: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700' },
  orange: { dot: 'bg-orange-400', bg: 'bg-orange-50', text: 'text-orange-700' },
  red:    { dot: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-700' },
  purple: { dot: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function LegalCalendar({ events }: { events: CalendarEvent[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 이벤트를 날짜(day)별 맵으로
  const eventByDay = new Map<number, CalendarEvent[]>()
  for (const ev of events) {
    const d = new Date(ev.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!eventByDay.has(day)) eventByDay.set(day, [])
      eventByDay.get(day)!.push(ev)
    }
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // 6행 맞추기
  while (cells.length % 7 !== 0) cells.push(null)

  // 이번 달 이벤트 목록 (아래 리스트)
  const monthEvents = events.filter((e) => {
    const d = new Date(e.date)
    return d.getFullYear() === year && d.getMonth() === month
  }).sort((a, b) => a.date.localeCompare(b.date))

  const todayStr = today.toISOString().split('T')[0]

  return (
    <div>
      {/* 월 네비 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">‹</button>
        <span className="font-bold text-gray-900">{year}년 {month + 1}월</span>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">›</button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />

          const evs = eventByDay.get(day) ?? []
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === todayStr

          return (
            <div key={day} className={`flex flex-col items-center py-1 rounded-xl ${isToday ? 'bg-blue-50' : ''}`}>
              <span className={`text-xs font-medium ${
                isToday ? 'text-blue-600' :
                idx % 7 === 0 ? 'text-red-400' :
                idx % 7 === 6 ? 'text-blue-400' :
                'text-gray-700'
              }`}>{day}</span>
              {evs.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {evs.slice(0, 3).map((ev, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${COLOR_MAP[ev.color]?.dot ?? 'bg-gray-300'}`} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 이번 달 이벤트 목록 */}
      {monthEvents.length > 0 ? (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">이번 달 법정 일정</p>
          {monthEvents.map((ev, i) => {
            const c = COLOR_MAP[ev.color] ?? COLOR_MAP.green
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${c.bg} border-transparent`}>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${c.text}`}>{ev.vehicle_name}</p>
                  <p className={`text-xs ${c.text} opacity-80`}>{ev.label}</p>
                </div>
                <span className="text-xs text-gray-500">{ev.date}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-5 text-center text-sm text-gray-400">이번 달 법정 일정 없음</p>
      )}
    </div>
  )
}
