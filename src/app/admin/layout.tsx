import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/field/inspect')

  return (
    <div className="flex h-full">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  )
}
