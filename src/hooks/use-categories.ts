import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface ProductCategory {
  id: string
  _id: string
  name: string
  description?: string
  pricingEnabled?: boolean
  createdAt?: string
  updatedAt?: string
  heroImage?: string
}

// Fetch all categories
const getProductCategoriesApi = async (): Promise<ProductCategory[]> => {
  const response = await api.get('/categories/product-category')
  return response.data.data
}
const searchProductCategoriesApi = async (search: string): Promise<ProductCategory[]> => {
  const response = await api.get('/categories/product-category', {
    params: { search }, // Pass search term as query param
  })
  return response.data
}
// Create new category
const createProductCategoryApi = async (payload: {category: string, name: string, description: string, pricingEnabled: boolean}): Promise<ProductCategory> => {
  const response = await api.post('/categories/product-category', payload)
  return response.data
}

// Update category
export const updateProductCategoryApi = async (payload: { id: string, category:string, name:string, description:string, pricingEnabled:boolean } ) => {
    const upadatedPayload = {
        category: payload.category,
        name: payload.name,
        description: payload.description,
        pricingEnabled:payload.pricingEnabled
    }
    const response = await api.put(`/categories/product-category/${payload.id}`, upadatedPayload)
    return response.data
  }

// Delete category
const deleteProductCategoryApi = async (id: string): Promise<void> => {
    await api.delete(`/categories/product-category/${id}`) 
  }
  

// Hooks
export function useProductCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: getProductCategoriesApi,
    staleTime: 1000 * 60 * 5,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

export function useCreateProductCategory() {
  return useMutation({
    mutationFn: createProductCategoryApi,
  })
}

export function useUpdateProductCategory() {
    return useMutation({
      mutationFn: (params: { id: string, category:string, name:string, description:string, pricingEnabled:boolean }) => updateProductCategoryApi(params),
    })
  }

export function useDeleteProductCategory() {
    return useMutation<void, Error, string>({
      mutationFn: deleteProductCategoryApi,
    })
  }

  export function useSearchProductCategories(search: string) {
    return useQuery({
      queryKey: ['product-categories-search', search],
      queryFn: () => searchProductCategoriesApi(search),
      enabled: !!search, // Only run when search is non-empty
      staleTime: 1000 * 60 * 5,
      retry: 3,
      refetchOnWindowFocus: false,
    })
  }