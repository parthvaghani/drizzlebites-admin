import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface SuggestedProduct {
  _id?: string
  id?: string
  name: string
  ingredients: string[]
  description: string
  status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface GetSuggestedProductsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

interface PaginatedSuggestedProductsResponse {
  results: SuggestedProduct[]
  total?: number
  page?: number
  limit?: number
}

const getSuggestedProductsApi = async (
  params: GetSuggestedProductsParams = {}
): Promise<PaginatedSuggestedProductsResponse> => {
  const { page, limit, search, status } = params
  const response = await api.get('/products/suggested', {
    params: { page, limit, search, status },
  })

  const payload = response?.data?.data ?? response?.data ?? {}
  const results: SuggestedProduct[] = payload?.results ?? payload ?? []
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

const getSuggestedProductByIdApi = async (id: string): Promise<SuggestedProduct> => {
  const response = await api.get(`/products/suggested/${id}`)
  return response?.data?.data ?? response.data
}

const updateSuggestedProductApi = async (
  payload: Omit<SuggestedProduct, 'createdAt' | 'updatedAt'> & { id: string }
): Promise<SuggestedProduct> => {
  const { id, ...rest } = payload
  const response = await api.put(`/products/suggested/${id}`, rest)
  return response?.data?.data ?? response.data
}

const deleteSuggestedProductApi = async (id: string): Promise<void> => {
  await api.delete(`/products/suggested/${id}`)
}

export function useSuggestedProductsList(params: GetSuggestedProductsParams) {
  const { page = 1, limit = 100, search = '', status } = params
  return useQuery({
    queryKey: ['suggested-products', { page, limit, search, status }],
    queryFn: () => getSuggestedProductsApi({ page, limit, search, status }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

export function useSuggestedProductById(id: string) {
  return useQuery({
    queryKey: ['suggested-product', id],
    queryFn: () => getSuggestedProductByIdApi(id),
    enabled: !!id,
  })
}

export function useUpdateSuggestedProduct() {
  return useMutation({
    mutationFn: updateSuggestedProductApi,
  })
}

export function useDeleteSuggestedProduct() {
  return useMutation<void, Error, string>({
    mutationFn: deleteSuggestedProductApi,
  })
}


