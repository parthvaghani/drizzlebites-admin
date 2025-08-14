import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/api'

export interface Testimonial {
  _id?: string
  id?: string
  name: string
  body: string
  img?: string
  location?: string
  visible?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface GetTestimonialsParams {
  page?: number
  limit?: number
  search?: string
  visible?: boolean
}

interface TestimonialsResponse {
  results: Testimonial[]
  total?: number
  page?: number
  limit?: number
}

// Fetch testimonials (pagination/search/visible)
const getTestimonialsApi = async (
  params: GetTestimonialsParams = {}
): Promise<TestimonialsResponse> => {
  const { search, visible } = params
  const response = await api.get('/testimonials/testimonial', {
    params: { search, visible },
  })

  const payload = response?.data?.data ?? response?.data ?? {}
  const results: Testimonial[] = payload?.results ?? payload ?? []
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

// Get testimonial by ID
const getTestimonialByIdApi = async (id: string): Promise<Testimonial> => {
  const response = await api.get(`/testimonials/testimonial/${id}`)
  return response?.data?.data ?? response.data
}

// Create testimonial
const createTestimonialApi = async (payload: {
  name: string
  body: string
  img?: string
  location?: string
  visible?: boolean
}): Promise<Testimonial> => {
  const response = await api.post('/testimonials/testimonial', payload)
  return response?.data?.data ?? response.data
}

// Update testimonial
const updateTestimonialApi = async (payload: {
  id: string
  name: string
  body: string
  img?: string
  location?: string
  visible?: boolean
}): Promise<Testimonial> => {
  const { id, ...rest } = payload
  const response = await api.put(`/testimonials/testimonial/${id}`, rest)
  return response?.data?.data ?? response.data
}

// Delete testimonial
const deleteTestimonialApi = async (id: string): Promise<void> => {
  await api.delete(`/testimonials/testimonial/${id}`)
}

// Hooks
export function useTestimonialsList(params: GetTestimonialsParams) {
  const { search = '', visible } = params
  return useQuery({
    queryKey: ['testimonials', { search, visible }],
    queryFn: () => getTestimonialsApi({ search, visible }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

export function useTestimonialById(id: string) {
  return useQuery({
    queryKey: ['testimonial', id],
    queryFn: () => getTestimonialByIdApi(id),
    enabled: !!id,
  })
}

export function useCreateTestimonial() {
  return useMutation({
    mutationFn: createTestimonialApi,
  })
}

export function useUpdateTestimonial() {
  return useMutation({
    mutationFn: updateTestimonialApi,
  })
}

export function useDeleteTestimonial() {
  return useMutation<void, Error, string>({
    mutationFn: deleteTestimonialApi,
  })
}


