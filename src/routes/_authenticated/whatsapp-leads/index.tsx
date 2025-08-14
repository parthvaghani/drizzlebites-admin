import { createFileRoute } from '@tanstack/react-router'
import WhatsappLeads from '@/features/whatsapp-leads'

export const Route = createFileRoute('/_authenticated/whatsapp-leads/')({
  component: WhatsappLeads,
})
