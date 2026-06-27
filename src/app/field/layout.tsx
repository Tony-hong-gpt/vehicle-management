import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FieldBottomNav from '@/components/FieldBottomNav'

export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-auto pb-16">{children}</main>
      <FieldBottomNav />
    </div>
  )
}
