'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialCount: number
  userId: string
}

export default function RealtimeBadge({ initialCount, userId }: Props) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('notifications-badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // 변경 발생 시 미확인 카운트 재조회
          const { count: newCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${userId},user_id.is.null`)
            .eq('is_read', false)
          setCount(newCount ?? 0)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  if (count === 0) return null

  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}
