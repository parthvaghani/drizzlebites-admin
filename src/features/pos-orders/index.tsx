import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
// import { ThemeSwitch } from '@/components/theme-switch';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { useOrdersList, type Order } from '@/hooks/use-orders';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function POSOrders() {
    const navigate = useNavigate();
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [search, setSearch] = useState<string>('');
    const [status, setStatus] = useState<string | undefined>(undefined);
    const [sortBy] = useState<string>('createdAt:desc');

    const { data, isLoading, isError, error, isFetching } = useOrdersList({
        page,
        limit,
        search,
        status,
        sortBy,
        posOrder: true,
    });

    const orders: Order[] = useMemo(() => {
        const raw = data?.results ?? [];
        return Array.isArray(raw) ? (raw as Order[]) : [];
    }, [data]);

    const tableRows = useMemo(() => {
        return orders.map((o) => {
            const userId = o.userId;
            const derivedPhone = typeof userId === 'object' && userId?.phoneNumber ? userId.phoneNumber : o.phoneNumber;
            const originalTotal = (o.productsDetails || []).reduce((sum, p) => {
                const price = Number(p.pricePerUnit) || 0;
                const qty = Number(p.totalUnit) || 0;
                return sum + (price * qty);
            }, 0);
            const discountedTotal = (o.productsDetails || []).reduce((sum, p) => {
                const price = Number(p.pricePerUnit) || 0;
                const discount = Number(p.discount) || 0;
                const qty = Number(p.totalUnit) || 0;
                return sum + ((price - discount) * qty);
            }, 0);
            const base = import.meta.env.VITE_IMAGE_BASE_URL ?? '';
            const images: string[] = (o.productsDetails || []).flatMap((p) => {
                const imgs = (p?.productId && Array.isArray(p.productId.images)) ? p.productId.images : [];
                return imgs
                    .map((i: string | { url?: string; }) => {
                        if (typeof i === 'string') return `${base}${i}`;
                        if (i && typeof i.url === 'string') return `${base}${i.url}`;
                        return '';
                    })
                    .filter(Boolean) as string[];
            });
            const normalizedProductsDetails = (o.productsDetails || []).map((p) => {
                const imgs = (p?.productId && Array.isArray(p.productId.images)) ? p.productId.images : [];
                const normImages: string[] = imgs
                    .map((i: string | { url?: string; }) => {
                        if (typeof i === 'string') return `${base}${i}`;
                        if (i && typeof i.url === 'string') return `${base}${i.url}`;
                        return '';
                    })
                    .filter(Boolean) as string[];
                return {
                    productId: p.productId ? { _id: p.productId._id, name: p.productId.name, images: normImages } : undefined,
                    weightVariant: p.weightVariant,
                    weight: p.weight,
                    pricePerUnit: p.pricePerUnit,
                    discount: p.discount,
                    totalUnit: p.totalUnit,
                    _id: p._id,
                };
            });
            return {
                _id: o._id,
                userId,
                phoneNumber: derivedPhone,
                status: o.status,
                paymentStatus: o.paymentStatus ?? 'unpaid',
                createdAt: o.createdAt,
                images,
                totalAmount: discountedTotal,
                originalTotal,
                shippingCharge: o.shippingCharge,
                address: o.address,
                productsDetails: normalizedProductsDetails,
                updatedAt: o.updatedAt ?? '',
                cancelDetails: o.cancelDetails,
                applyCoupon: o.applyCoupon
            };
        });
    }, [orders]);

    return (
        <>
            <Header fixed>
                <Search />
                <div className='ml-auto flex items-center space-x-4'>
                    <Button variant="outline" size="sm" onClick={() => navigate({ to: '/pos' })} className="hidden sm:flex">
                        <ArrowLeft className="w-4 h-4" />
                        Back to POS
                    </Button>
                    {/* <ThemeSwitch /> */}
                    <ProfileDropdown />
                </div>
            </Header>

            <Main>
                <div className='mb-4 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4'>
                    <div className='flex-1'>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/pos' })} className="sm:hidden">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div>
                                <h2 className='text-xl sm:text-2xl font-bold tracking-tight'>POS Orders</h2>
                                <p className='text-xs sm:text-sm text-muted-foreground'>Manage and view POS customer orders.</p>
                            </div>
                        </div>
                    </div>
                    <div className='flex items-center gap-3 sm:gap-6'>
                        <div className='flex items-center gap-2'>
                            <span className='text-xs sm:text-sm font-medium'>Status</span>
                            <Select
                                value={status ?? 'all'}
                                onValueChange={(val) => {
                                    const next = val === 'all' ? undefined : val;
                                    setStatus(next);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className='h-8 sm:h-9 w-[110px] sm:w-[140px] text-xs sm:text-sm'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent side='top'>
                                    {['all', 'placed', 'accepted', 'inprogress', 'completed', 'cancelled', 'delivered'].map((opt) => (
                                        <SelectItem key={opt} value={opt} className='text-xs sm:text-sm'>
                                            {opt.replace(/^\w/, (c) => c.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className='-mx-4 flex-1 overflow-auto px-2 sm:px-4 py-1'>
                    {isLoading || isFetching ? (
                        <div className='flex items-center justify-center py-12'>
                            <p className='text-sm sm:text-base text-muted-foreground'>Loading Orders...</p>
                        </div>
                    ) : isError ? (
                        <div className='flex items-center justify-center py-12'>
                            <p className='text-xs sm:text-sm text-red-500'>Error: {(error as Error)?.message ?? 'Failed to load orders'}</p>
                        </div>
                    ) : (
                        <DataTable
                            data={tableRows}
                            columns={columns}
                            search={search}
                            onSearchChange={(val) => {
                                setSearch(val);
                                setPage(1);
                            }}
                            pagination={{ page, limit, total: data?.total ?? orders.length }}
                            onPaginationChange={({ page: nextPage, limit: nextLimit }) => {
                                setPage(nextPage);
                                setLimit(nextLimit);
                            }}
                        />
                    )}
                </div>
            </Main>
        </>
    );
}


