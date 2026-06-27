import Link from 'next/link'
import { headers } from 'next/headers'
import NotifBadge from '@/components/field/NotifBadge'

const tabs = [
  { href: '/field/notifications', label: '알림',    icon: '🔔', badge: true },
  { href: '/field/inspect',       label: '주간점검', icon: '📋', badge: false },
  { href: '/field/immediate',     label: '즉시등록', icon: '⚡', badge: false },
  { href: '/field/status',        label: '차량현황', icon: '🚌', badge: false },
  { href: '/field/history',       label: '이력',    icon: '📜', badge: false },
]

export default async function FieldBottomNav() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center z-40">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[48px] text-xs font-medium transition-colors relative ${
              active ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-none relative">
              {t.icon}
              {t.badge && <NotifBadge />}
            </span>
            <span>{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
