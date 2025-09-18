import { createFileRoute } from '@tanstack/react-router'
import Dashboard from '@/features/dashboard'

export const Route = createFileRoute('/_authenticated/')({
  // beforeLoad: () => {
  //   throw redirect({ to: '/products' })
  // },
  component: Dashboard,
})
