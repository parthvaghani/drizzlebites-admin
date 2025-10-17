import { ReactNode } from 'react'

interface POSLayoutProps {
  children: ReactNode
}

export function POSLayout({ children }: POSLayoutProps) {
  return (
    <div className="h-screen w-screen bg-gray-50">
      {children}
    </div>
  )
}
