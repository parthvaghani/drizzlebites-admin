import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/api'

interface Variant {
  weight: string;
  price: number;
  discount?: number;
}

interface Variants {
  gm?: Variant[];
  kg?: Variant[];
}

interface Product {
  id?: string;
  _id?: string;
  category?: { _id?: string; id?: string; name?: string } | string;
  name?: string;
  description?: string;
  isPremium?: boolean;
  isPopular?: boolean;
  variants?: Variants;
  images?: string[];
  ingredients?: string[];
  benefits?: string[];
}

interface GetProductsParams {
  page?: number
  limit?: number
  search?: string
  isPremium?: boolean
  isPopular?: boolean
}

interface PaginatedProductsResponse {
  results: Product[]
  total?: number
  page?: number
  limit?: number
}

//  Fetch products with pagination/search/filters
const getProductsApi = async (
  params: GetProductsParams = {}
): Promise<PaginatedProductsResponse> => {
  const { page, limit, search, isPremium, isPopular } = params
  const response = await api.get('/products/product', {
    params: {
      page,
      limit,
      search,
      isPremium,
      isPopular,
    },
  })

  const payload = response?.data?.data ?? response?.data ?? {}
  const results: Product[] = payload?.results ?? []

  // Try common meta fields for total/page/limit with graceful fallback
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

//  Get product by ID
const getProductByIdApi = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/product/${id}`)
  return response.data
}

//  Create new product (supports JSON or multipart FormData)
const createProductApi = async (
  payload:
    | {
        category: string; // category ID
        name: string;
        description?: string;
        product_slug?: string;
        isPremium?: boolean;
        isPopular?: boolean;
        variants?: Variants;
        images?: string[];
        ingredients?: string[];
        benefits?: string[];
      }
    | FormData
): Promise<Product> => {
  // If payload is FormData, set multipart headers
  if (typeof FormData !== 'undefined' && payload instanceof FormData) {
    const response = await api.post('/products/product', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }
  const response = await api.post('/products/product', payload)
  return response.data
}

//  Update product (supports JSON or multipart FormData)
const updateProductApi = async (
  payload:
    | {
        id: string
        category?: string
        name?: string
        description?: string
        isPremium?: boolean
        isPopular?: boolean
        variants?: Variants
        images?: string[]
        ingredients?: string[]
        benefits?: string[]
        // When provided, we will build multipart/form-data
        files?: File[] | Blob[]
        imagesToRemove?: string[]
        product_slug?: string
      }
    | { id: string; data: FormData }
): Promise<Product> => {
  // Case 1: Direct FormData provided by caller
  if (
    typeof FormData !== 'undefined' &&
    (payload as { data?: unknown }).data instanceof FormData
  ) {
    const { id, data } = payload as { id: string; data: FormData }
    const response = await api.put(`/products/product/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  // Narrow to JSON-like payload
  const jsonPayload = payload as {
    id: string
    category?: string
    name?: string
    description?: string
    isPremium?: boolean
    isPopular?: boolean
    variants?: Variants
    images?: string[]
    ingredients?: string[]
    benefits?: string[]
    files?: File[] | Blob[]
    imagesToRemove?: string[]
    product_slug?: string
  }

  // Case 2: If files or imagesToRemove are present, build multipart matching curl
  const shouldUseMultipart =
    typeof FormData !== 'undefined' &&
    (Array.isArray(jsonPayload.files) && jsonPayload.files.length > 0 ||
      Array.isArray(jsonPayload.imagesToRemove) && jsonPayload.imagesToRemove.length > 0)

  if (shouldUseMultipart) {
    const formData = new FormData()

    // Files: append under field name 'images' (ONLY new File objects, not existing image strings)
    if (Array.isArray(jsonPayload.files) && jsonPayload.files.length > 0) {
      for (const file of jsonPayload.files) {
        formData.append('images', file as Blob)
      }
    }

    // Images to remove: append as repeated 'imagesToRemove[]'
    if (Array.isArray(jsonPayload.imagesToRemove) && jsonPayload.imagesToRemove.length > 0) {
      for (const key of jsonPayload.imagesToRemove) {
        formData.append('imagesToRemove[]', key)
      }
    }

    // Include other optional fields
    if (jsonPayload.category !== undefined) formData.append('category', String(jsonPayload.category))
    if (jsonPayload.name !== undefined) formData.append('name', String(jsonPayload.name))
    if (jsonPayload.description !== undefined) formData.append('description', String(jsonPayload.description))
    if (jsonPayload.isPremium !== undefined) formData.append('isPremium', String(jsonPayload.isPremium))
    if (jsonPayload.isPopular !== undefined) formData.append('isPopular', String(jsonPayload.isPopular))
    if (jsonPayload.product_slug !== undefined) formData.append('product_slug', String(jsonPayload.product_slug))
    // Variants: append as structured object-like keys (backend expects object, not JSON string)
    if (jsonPayload.variants !== undefined) {
      (['gm', 'kg'] as const).forEach((type) => {
        jsonPayload.variants?.[type]?.forEach((v, i) => {
          formData.append(`variants[${type}][${i}][weight]`, v.weight)
          formData.append(`variants[${type}][${i}][price]`, String(v.price))
          formData.append(`variants[${type}][${i}][discount]`, String(v.discount || 0))
        })
      })
    }
    // Arrays as repeated fields
    if (Array.isArray(jsonPayload.ingredients)) {
      jsonPayload.ingredients.forEach((ing) => formData.append('ingredients', ing))
    }
    if (Array.isArray(jsonPayload.benefits)) {
      jsonPayload.benefits.forEach((ben) => formData.append('benefits', ben))
    }

    const response = await api.put(`/products/product/${jsonPayload.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  // Case 3: Regular JSON update
  const updatedPayload: {
    category?: string
    name?: string
    description?: string
    isPremium?: boolean
    isPopular?: boolean
    variants?: Variants
    images?: string[]
    ingredients?: string[]
    benefits?: string[]
    product_slug?: string
  } = {
    category: jsonPayload.category,
    name: jsonPayload.name,
    description: jsonPayload.description,
    isPremium: jsonPayload.isPremium,
    isPopular: jsonPayload.isPopular,
    variants: jsonPayload.variants,
    ingredients: jsonPayload.ingredients || [],
    benefits: jsonPayload.benefits || [],
    product_slug: jsonPayload.product_slug,
  }

  // Only include images if provided (when images have changed)
  if (jsonPayload.images !== undefined) {
    updatedPayload.images = jsonPayload.images
  }

  const response = await api.put(`/products/product/${jsonPayload.id}`, updatedPayload)
  return response.data.data ?? response.data
}

//  Delete product
const deleteProductApi = async (id: string): Promise<void> => {
  await api.delete(`/products/product/${id}`)
}

// hooks

export function useProducts() {
  // Keep a backwards-compatible signature that fetches without params
  return useQuery({
    queryKey: ['products', { page: 1, limit: 10 }],
    queryFn: () => getProductsApi({ page: 1, limit: 10 }),
    staleTime: 1000 * 60 * 5,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

export function useProductsList(params: GetProductsParams) {
  const { page = 1, limit = 10, search = '', isPremium, isPopular } = params
  return useQuery({
    queryKey: ['products', { page, limit, search, isPremium, isPopular }],
    queryFn: () => getProductsApi({ page, limit, search, isPremium, isPopular }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

export function useProductById(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductByIdApi(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: createProductApi,
  })
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: updateProductApi,
  })
}

export function useDeleteProduct() {
  return useMutation<void, Error, string>({
    mutationFn: deleteProductApi,
  })
}
