import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyNotifications, getUnreadCount } from '@/lib/actions/notifications'
import NotificationFeed from '@/components/field/NotificationFeed'
import ScanTriggerButton from '@/components/field/ScanTriggerButton'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.user_metadata?.role as string | undefined

  const [notifications, unreadCount] = await Promise.all([
    getMyNotifications(),
    getUnreadCount(),
  ])

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">알림</h1>
            <p className="text-sm text-gray-500 mt-0.5">소모품·법정 만기·점검 알림</p>
          </div>
          {role === 'admin' && <ScanTriggerButton />}
        </div>
      </div>

      <NotificationFeed notifications={notifications} unreadCount={unreadCount} />
    </div>
  )
}
