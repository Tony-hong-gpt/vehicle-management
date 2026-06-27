'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import type { VehicleUsagePoint } from '@/lib/actions/stats'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface Props {
  data: VehicleUsagePoint[]
}

export default function UsageChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
        차량 데이터가 없습니다.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 52)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={72} />
        <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} km`, '누적 주행거리']} />
        <Bar dataKey="mileage" radius={[0, 6, 6, 0]} maxBarSize={32}
          label={{ position: 'right', fontSize: 11, fill: '#6b7280', formatter: (v: unknown) => `${Number(v).toLocaleString()}` }}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
