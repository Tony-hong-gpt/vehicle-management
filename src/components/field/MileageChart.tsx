'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import type { WeeklyMileagePoint } from '@/lib/actions/stats'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface Props {
  data: WeeklyMileagePoint[]
  vehicleNames: string[]
}

export default function MileageChart({ data, vehicleNames }: Props) {
  if (data.length === 0) {
    return <EmptyState message="주간 점검 데이터가 없습니다." />
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => `${Number(v).toLocaleString()} km`} />
        {vehicleNames.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {vehicleNames.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
      {message}
    </div>
  )
}
