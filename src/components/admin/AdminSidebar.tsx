'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

const NAV_ITEMS = [
  { href: '/admin/dashboard',    icon: '📊', label: '전체 관제판' },
  { href: '/admin/inspections',  icon: '📋', label: '주간 점검 현황' },
  { href: '/admin/vehicles',     icon: '🚌', label: '차량 관리' },
  { href: '/admin/defaults',     icon: '⚙️', label: '알림 기준 기본값' },
  { href: '/admin/audit',        icon: '🔍', label: '변경 감사 로그' },
  { href: '/field/notifications', icon: '🔔', label: '알림 피드' },
  { href: '/field/status',       icon: '🔗', label: '현장 앱으로' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">차량 관리 시스템</p>
        <p className="mt-1 text-sm font-bold text-gray-800">상위 관리자</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href) && item.href !== '/field/status'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <LogoutButton />
      </div>
    </aside>
  )
}
