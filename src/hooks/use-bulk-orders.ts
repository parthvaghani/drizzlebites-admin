import { useQuery, keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface ProductVariant {
  weight: string
  price: number
  discount: number
  _id: string
}

export interface ProductVariants {
  gm?: ProductVariant[]
  kg?: ProductVariant[]
}

export interface Product {
  variants: ProductVariants
  _id: string
  name: string
  description: string
  images: Array<{
    url: string
    _id: string
  }>
}

export interface BulkOrder {
  _id?: string
  id?: string
  fullName: string
  emailAddress: string
  phoneNumber?: string
  deliveryAddress?: string
  products: Product[]
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export interface GetBulkOrdersParams {
  page?: number
  limit?: number
  searchTerm?: string
}

interface BulkOrdersResponse {
  results: BulkOrder[]
  total?: number
  page?: number
  limit?: number
  currentResults?: number
  totalPages?: number
  totalResults?: number
}

const getBulkOrdersApi = async (
  params: GetBulkOrdersParams = {}
): Promise<BulkOrdersResponse> => {
  const { page, limit, searchTerm } = params
  const queryParams: Record<string, unknown> = {}
  if (typeof page !== 'undefined') queryParams.page = page
  if (typeof limit !== 'undefined') queryParams.limit = limit
  if (typeof searchTerm === 'string' && searchTerm.trim().length > 0) {
    queryParams.search = searchTerm
  }
  const response = await api.get('/bulk-orders/', {
    params: queryParams,
  })

  // Normalize common API envelope patterns
  const payload = response?.data?.data ?? response?.data ?? {}
  const results: BulkOrder[] = Array.isArray(payload)
    ? (payload as BulkOrder[])
    : (payload?.results ?? [])

  const total: number | undefined =
    payload?.total ?? payload?.count ?? payload?.totalResults ?? (Array.isArray(payload) ? results.length : undefined)
  const currentPage: number | undefined = payload?.page ?? payload?.currentPage
  const currentLimit: number | undefined = payload?.limit ?? payload?.pageSize

  return {
    results,
    total,
    page: currentPage,
    limit: currentLimit,
  }
}

export function useBulkOrdersList(params: GetBulkOrdersParams) {
  const { page = 1, limit = 10, searchTerm } = params
  return useQuery({
    queryKey: ['bulk-orders', { page, limit, searchTerm: searchTerm || undefined }],
    queryFn: () => getBulkOrdersApi({ page, limit, searchTerm: searchTerm || undefined }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

// Mutations
export type UpdateBulkOrderPayload = Partial<
  Pick<BulkOrder, 'fullName' | 'emailAddress' | 'phoneNumber' | 'deliveryAddress'>
> & Record<string, unknown>

const updateBulkOrderApi = async (params: { id: string; data: UpdateBulkOrderPayload }) => {
  const { id, data } = params
  const response = await api.patch(`/bulk-orders/${id}`, data)
  return response.data
}

const deleteBulkOrderApi = async (id: string) => {
  const response = await api.delete(`/bulk-orders/${id}`)
  return response.data
}

const downloadSummaryApi = async (id: string) => {
  const response = await api.get(`/bulk-orders/${id}/summary`, {
    responseType: 'blob',
  })
  return response.data
}

export function useUpdateBulkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateBulkOrderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-orders'] })
    },
  })
}

export function useDeleteBulkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBulkOrderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-orders'] })
    },
  })
}

export function useDownloadBulkOrderSummary() {
  return useMutation({
    mutationFn: downloadSummaryApi,
  })
}
