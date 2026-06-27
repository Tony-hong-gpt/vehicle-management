import { createClient } from '@/lib/supabase/server'
import { getUnreadCount } from '@/lib/actions/notifications'
import RealtimeBadge from './RealtimeBadge'

export default async function NotifBadge() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const count = await getUnreadCount()

  return <RealtimeBadge initialCount={count} userId={user.id} />
}
