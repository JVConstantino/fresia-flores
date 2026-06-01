import { Header } from './Header'
import { Footer } from './Footer'

interface LayoutProps {
  children: React.ReactNode
  hideHeader?: boolean
  hideFooter?: boolean
}

export function Layout({ children, hideHeader = false, hideFooter = false }: LayoutProps) {
  return (
    <div className="overflow-x-hidden min-h-screen flex flex-col">
      <div className={hideHeader ? 'hidden md:block' : 'block'}>
        <Header />
      </div>
      <main className="flex-1 flex flex-col">{children}</main>
      <div className={hideFooter ? 'hidden md:block' : 'block'}>
        <Footer />
      </div>
    </div>
  )
}
