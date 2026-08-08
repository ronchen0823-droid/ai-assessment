import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '致知AI学院 | AI思维状态测评',
  description: '了解孩子在AI时代的思维主导权状态，获取个性化分析报告',
  openGraph: {
    title: '致知AI学院',
    description: '3分钟了解孩子的AI使用思维状态',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
