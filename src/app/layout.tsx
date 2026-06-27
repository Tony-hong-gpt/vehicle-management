import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: '교회 차량 관리 시스템',
  description: '교회 보유 차량 통합 관리',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '차량관리',
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-gray-50 font-sans">{children}</body>
    </html>
  )
}
