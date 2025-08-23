import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface OrderProductDetail {
  productId: {
    _id: string;
    name: string;
    images: string[];
  };
  weightVariant: string;
  weight: string;
  pricePerUnit: number;
  discount: number;
  totalUnit: number;
  _id: string;
}

export interface Order {
  _id: string;
  userId: string | {
    _id: string;
    id: string;
    email: string;
    phoneNumber: string;
    role: string;
    user_details: {
      name: string;
      country: string;
    };
  };
  phoneNumber: string;
  status: string;
  paymentStatus?: string;
  shippingCharge?: number;
  createdAt: string;
  updatedAt?: string;
  cancelDetails?: { reason?: string | null; };
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  statusHistory: {
    _id: string;
    status: string;
    note: string | null;
    updatedBy: "user" | "admin";
    date: string; // ISO timestamp
  }[];
  productsDetails: OrderProductDetail[];
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string; // e.g. 'createdAt:desc'
}

interface OrdersResponse {
  results: Order[];
  total?: number;
  page?: number;
  limit?: number;
}

const getOrdersApi = async (params: GetOrdersParams = {}): Promise<OrdersResponse> => {
  const { page, limit, search, status, sortBy } = params;
  const response = await api.get('/orders/all', {
    params: {
      page,
      limit,
      search,
      status,
      sortBy,
    },
  });

  const payload = response?.data?.data ?? response?.data ?? {};
  const results: Order[] = Array.isArray(payload)
    ? (payload as Order[])
    : (payload?.results ?? []);

  const total: number | undefined =
    payload?.total ?? payload?.count ?? payload?.totalResults ?? (Array.isArray(payload) ? results.length : undefined);
  const currentPage: number | undefined = payload?.page ?? payload?.currentPage;
  const currentLimit: number | undefined = payload?.limit ?? payload?.pageSize;

  return {
    results,
    total,
    page: currentPage,
    limit: currentLimit,
  };
};

// Get single order by ID
const getOrderByIdApi = async (id: string): Promise<Order> => {
  const response = await api.get(`/orders/${id}`);
  const payload = response?.data?.data ?? response?.data ?? {};
  const order: Order = (payload?.order ?? payload) as Order;
  return order;
};

// Update order status
export interface UpdateOrderStatusPayload {
  id: string;
  status?: string;
  note?: string;
  paymentStatus?: string;
}

const updateOrderStatusApi = async ({ id, status, paymentStatus, note }: UpdateOrderStatusPayload) => {
  const response = await api.patch(`/orders/${id}/status`, { status, paymentStatus, note });
  return response.data;
};

// Update order shipping charge
export interface UpdateOrderShippingChargePayload {
  id: string;
  shippingCharge: number;
}

const updateOrderShippingChargeApi = async ({ id, shippingCharge }: UpdateOrderShippingChargePayload) => {
  const response = await api.put(`/orders/${id}`, { shippingCharge });
  return response.data;
};

export function useOrdersList(params: GetOrdersParams) {
  const { page = 1, limit = 10, search = '', status, sortBy } = params;
  return useQuery({
    queryKey: ['orders', { page, limit, search, status, sortBy }],
    queryFn: () => getOrdersApi({ page, limit, search, status, sortBy }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  });
}

// Query hook to fetch a single order by ID
export function useIdByOrder(id?: string) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => getOrderByIdApi(id as string),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  });
}

// Mutation hook to update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOrderStatusApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Mutation hook to update order shipping charge
export function useUpdateOrderShippingCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOrderShippingChargeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}


