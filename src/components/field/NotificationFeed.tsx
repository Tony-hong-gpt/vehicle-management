'use client'

import { useTransition } from 'react'
import { markAsRead, markAllAsRead } from '@/lib/actions/notifications'
import type { NotificationRow } from '@/types/database'

const TYPE_CONFIG: Record<string, { bg: string; border: string; icon: string }> = {
  legal_overdue:  { bg: 'bg-purple-50', border: 'border-purple-200', icon: '🟣' },
  legal_critical: { bg: 'bg-red-50',    border: 'border-red-200',    icon: '🔴' },
  legal_warn:     { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '🟡' },
  legal_notice:   { bg: 'bg-blue-50',   border: 'border-blue-100',   icon: '📅' },
  inspection_reminder: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '📋' },
}

function getConfig(notifType: string | null) {
  if (!notifType) return { bg: 'bg-gray-50', border: 'border-gray-100', icon: '🔔' }
  if (notifType in TYPE_CONFIG) return TYPE_CONFIG[notifType]
  if (notifType.startsWith('consumable_critical')) return { bg: 'bg-red-50',    border: 'border-red-200',    icon: '🔴' }
  if (notifType.startsWith('consumable_warn'))     return { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '🟡' }
  if (notifType.startsWith('consumable_notice'))   return { bg: 'bg-blue-50',   border: 'border-blue-100',   icon: '📌' }
  return { bg: 'bg-gray-50', border: 'border-gray-100', icon: '🔔' }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return '방금'
  if (mins  < 60) return `${mins}분 전`
  if (hours < 24) return `${hours}시간 전`
  return `${days}일 전`
}

interface Props {
  notifications: NotificationRow[]
  unreadCount: number
}

export default function NotificationFeed({ notifications, unreadCount }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleRead(id: string) {
    startTransition(() => markAsRead(id))
  }

  function handleReadAll() {
    startTransition(() => markAllAsRead())
  }

  return (
    <div>
      {/* 헤더 액션 */}
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <span className="text-xs text-gray-500">
          {unreadCount > 0 ? `미확인 ${unreadCount}개` : '모두 읽음'}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={handleReadAll}
            disabled={isPending}
            className="text-xs text-blue-500 font-medium disabled:opacity-50"
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      {/* 알림 목록 */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-4xl mb-3">🔔</span>
          <p className="text-sm">알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2 px-4 pb-6">
          {notifications.map((n) => {
            const cfg = getConfig(n.notif_type)
            return (
              <button
                key={n.id}
                onClick={() => !n.is_read && handleRead(n.id)}
                className={`w-full text-left rounded-2xl border p-4 transition-opacity ${cfg.bg} ${cfg.border} ${
                  n.is_read ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5 shrink-0">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold text-gray-900 ${!n.is_read ? '' : 'font-normal text-gray-500'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-xs text-gray-300 mt-1.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
