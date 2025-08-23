import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
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

export default function Orders() {
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
    });

    const orders: Order[] = useMemo(() => {
        const raw = data?.results ?? [];
        return Array.isArray(raw) ? (raw as Order[]) : [];
    }, [data]);

    const tableRows = useMemo(() => {
        return orders.map((o) => {
            const userId = o.userId
            const derivedPhone = typeof userId === 'object' && userId?.phoneNumber ? userId.phoneNumber : o.phoneNumber
            const originalTotal = (o.productsDetails || []).reduce((sum, p) => sum + (p.pricePerUnit) * (p.totalUnit || 1), 0)
            const discountedTotal = (o.productsDetails || []).reduce((sum, p) => sum + (p.pricePerUnit - (p.discount || 0)) * (p.totalUnit || 1), 0)
            return {
                _id: o._id,
                userId,
                phoneNumber: derivedPhone,
                status: o.status,
                paymentStatus: o.paymentStatus ?? 'unpaid',
                createdAt: o.createdAt,
                images: (o.productsDetails || []).flatMap((p) => (p?.productId && Array.isArray(p.productId.images)) ? p.productId.images : []),
                totalAmount: discountedTotal,
                originalTotal,
                shippingCharge: o.shippingCharge,
                address: o.address,
                productsDetails: o.productsDetails,
                updatedAt: o.updatedAt ?? '',
                cancelDetails: o.cancelDetails,
            }
        });
    }, [orders]);

    return (
        <>
            <Header fixed>
                <Search />
                <div className='ml-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main>
                <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
                    <div>
                        <h2 className='text-2xl font-bold tracking-tight'>Orders</h2>
                        <p className='text-muted-foreground'>Manage and view customer orders.</p>
                    </div>
                    <div className='flex items-center gap-6'>
                        <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium'>Status</span>
                            <Select
                                value={status ?? 'all'}
                                onValueChange={(val) => {
                                    const next = val === 'all' ? undefined : val;
                                    setStatus(next);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className='h-8 w-[140px]'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent side='top'>
                                    {['all', 'placed', 'accepted', 'inprogress', 'completed', 'cancelled', 'delivered'].map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                            {opt.replace(/^\w/, (c) => c.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
                    {isLoading || isFetching ? (
                        <p>Loading Orders...</p>
                    ) : isError ? (
                        <p className='text-red-500'>Error: {(error as Error)?.message ?? 'Failed to load orders'}</p>
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


