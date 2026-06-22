import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '@/components/shared/ToastNotification'

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-[#F4F4F5] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[1400px] mx-auto px-6 py-7 lg:px-8 lg:py-8 pt-16 lg:pt-7"
          >
            {children}
          </motion.div>
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
