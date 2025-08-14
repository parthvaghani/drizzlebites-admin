import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface WhatsappLeadMetadata {
  productId?: string
  productName?: string
  variant?: string
  discountApplied?: boolean
}

export interface WhatsappLead {
  _id: string
  page: string
  button: string
  message: string
  phoneNumber: string
  status: string
  sourceUrl?: string
  userAgent?: string
  ipAddress?: string
  metadata?: WhatsappLeadMetadata
  whatsappIntent?: boolean
  whatsappSent?: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
  __v?: number
}

export interface GetWhatsappLeadsParams {
  page?: number
  limit?: number
  search?: string | null
  status?: string
  whatsappIntent?: boolean
  whatsappSent?: boolean
}

interface PaginatedWhatsappLeadsResponse {
  results: WhatsappLead[]
  total?: number
  page?: number
  limit?: number
}

const getWhatsappLeadsApi = async (
  params: GetWhatsappLeadsParams = {}
): Promise<PaginatedWhatsappLeadsResponse> => {
  const { page, limit, search, status, whatsappIntent, whatsappSent } = params
  const response = await api.get('/leads/whatsApp-lead', {
    params: { page, limit, search, status, whatsappIntent, whatsappSent },
  })

  const payload = response?.data?.data ?? response?.data ?? {}
  const results: WhatsappLead[] = payload?.results ?? payload ?? []
  const total: number | undefined =
    payload?.total ?? payload?.count ?? payload?.totalResults ?? undefined
  const currentPage: number | undefined = payload?.page ?? payload?.currentPage
  const currentLimit: number | undefined = payload?.limit ?? payload?.pageSize

  return {
    results,
    total,
    page: currentPage,
    limit: currentLimit,
  }
}

const getWhatsappLeadByIdApi = async (id: string): Promise<WhatsappLead> => {
  const response = await api.get(`/leads/whatsApp-lead/${id}`)
  return response?.data?.data ?? response.data
}

export function useWhatsappLeadsList(params: GetWhatsappLeadsParams) {
  const {
    page = 1,
    limit = 100,
    search = null,
    status,
    whatsappIntent,
    whatsappSent,
  } = params
  return useQuery({
    queryKey: ['whatsapp-leads', { page, limit, search, status, whatsappIntent, whatsappSent }],
    queryFn: () => getWhatsappLeadsApi({ page, limit, search, status, whatsappIntent, whatsappSent }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

export function useWhatsappLeadById(id: string) {
  return useQuery({
    queryKey: ['whatsapp-lead', id],
    queryFn: () => getWhatsappLeadByIdApi(id),
    enabled: !!id,
  })
}


