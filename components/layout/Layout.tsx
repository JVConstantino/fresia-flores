'use client'

import { Header } from './Header'
import { Footer } from './Footer'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="overflow-x-hidden">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
