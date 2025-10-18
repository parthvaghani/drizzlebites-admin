import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { TasksDialogs } from './components/tasks-dialogs';
import { CouponsPrimaryButtons } from './components/tasks-primary-buttons';
import TasksProvider from './context/tasks-context';
import { Coupon, useCoupons } from '@/hooks/use-coupons';

export default function Coupons() {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');

  const { data, isLoading, isError, error, isFetching } = useCoupons({
    page,
    limit,
    search,
  });

  // ✅ UseMemo to avoid re-mapping on every render
  const tableData = useMemo(() => {
    const rawData = Array.isArray(data)
      ? data
      : data?.results ?? [];

    return rawData.map((coupon: Coupon, index: number) => ({
      _id: coupon._id || `coupon-${index}`,
      couponCode: coupon.couponCode || 'N/A',
      description: coupon.description || '',
      termsAndConditions: coupon.termsAndConditions || '',
      level: coupon.level || 'N/A',
      minCartValue: coupon.minCartValue ?? 0,
      maxDiscountValue: coupon.maxDiscountValue ?? 0,
      minOrderQuantity: coupon.minOrderQuantity ?? 0,
      type: coupon.type === 'unique' ? 'unique' : 'generic',
      userType: coupon.userType,
      maxUsage: coupon.maxUsage,
      usageCount: coupon.usageCount,
      maxUsagePerUser: coupon.maxUsagePerUser,
      firstOrderOnly: coupon.firstOrderOnly,
      isActive: coupon.isActive ?? false,
      startDate: coupon.startDate || '-',
      createdAt: coupon.createdAt
        ? new Date(coupon.createdAt).toLocaleDateString()
        : '-',
      expiryDate: coupon.expiryDate
        ? new Date(coupon.expiryDate).toLocaleDateString()
        : '-',
      couponType: coupon.couponType || 'normal',
    }));
  }, [data]);

  return (
    <TasksProvider>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Coupons</h2>
            <p className="text-muted-foreground">
              Manage and view all coupons in one place!
            </p>
          </div>
          <CouponsPrimaryButtons />
        </div>

        <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
          {isLoading || isFetching ? (
            <p>Loading coupons...</p>
          ) : isError ? (
            <p className="text-red-500">
              Error: {(error as Error)?.message}
            </p>
          ) : (
            <DataTable
              data={tableData}
              columns={columns}
              search={search}
              onSearchChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              pagination={{
                page,
                limit,
                total: data?.total ?? 0,
              }}
              onPaginationChange={({ page: nextPage, limit: nextLimit }) => {
                setPage(nextPage);
                setLimit(nextLimit);
              }}
            />
          )}
        </div>
      </Main>

      <TasksDialogs />
    </TasksProvider>
  );
}
