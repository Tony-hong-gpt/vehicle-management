'use client'

import Link from 'next/link'

const EVENT_TYPES = [
  {
    type: 'consumable',
    icon: '🔧',
    label: '소모품 교환',
    desc: '엔진오일·타이어·브레이크패드 등',
    color: 'blue',
  },
  {
    type: 'damage',
    icon: '⚠️',
    label: '외관 파손 발견',
    desc: '긁힘·찌그러짐·파손 사진 첨부',
    color: 'red',
  },
  {
    type: 'battery',
    icon: '🔋',
    label: '배터리 방전',
    desc: '방전 발생 즉시 등록',
    color: 'orange',
  },
  {
    type: 'insurance',
    icon: '🛡️',
    label: '보험 갱신 완료',
    desc: '새 보험증권 사진 첨부',
    color: 'green',
  },
  {
    type: 'inspection',
    icon: '📋',
    label: '정기검사 완료',
    desc: '검사증 사진·다음 만기일 자동 계산',
    color: 'green',
  },
  {
    type: 'tax',
    icon: '💳',
    label: '자동차세 납부 완료',
    desc: '납부 영수증 첨부 (선택)',
    color: 'green',
  },
]

const colorMap: Record<string, string> = {
  blue:   'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
  red:    'border-red-200 hover:border-red-400 hover:bg-red-50',
  orange: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50',
  green:  'border-green-200 hover:border-green-400 hover:bg-green-50',
}

interface Props {
  vehicleId: string
}

export default function EventTypePicker({ vehicleId }: Props) {
  return (
    <div className="space-y-3">
      {EVENT_TYPES.map((ev) => (
        <Link
          key={ev.type}
          href={`/field/immediate/${vehicleId}/${ev.type}`}
          className={`flex items-center gap-4 p-4 rounded-2xl border bg-white transition-colors min-h-[72px] ${colorMap[ev.color]}`}
        >
          <span className="text-3xl leading-none flex-shrink-0">{ev.icon}</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{ev.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ev.desc}</p>
          </div>
          <span className="ml-auto text-gray-300 text-lg">›</span>
        </Link>
      ))}
    </div>
  )
}
