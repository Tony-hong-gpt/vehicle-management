'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import type { MonthlyCostPoint } from '@/lib/actions/stats'

interface Props {
  data: MonthlyCostPoint[]
}

const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function CostChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
        교환 비용 데이터가 없습니다.
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.total, 0)

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
          <Tooltip
            formatter={(v) => [`${Number(v).toLocaleString()}원`, '비용']}
            labelFormatter={(l) => `${l}`}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-right text-xs text-gray-400 mt-1">
        6개월 합계: <span className="font-semibold text-gray-700">{total.toLocaleString()}원</span>
      </p>
    </div>
  )
}
