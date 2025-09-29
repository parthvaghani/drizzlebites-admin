import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { TopNav } from '@/components/layout/top-nav';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
// import { ThemeSwitch } from '@/components/theme-switch'
import { Overview } from './components/overview';
// import { RecentSales } from './components/recent-sales';
import { useMemo, useState } from 'react';
import type { Order } from '@/hooks/use-orders';
import DateRangePicker from '@/components/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { useOrdersList } from '@/hooks/use-orders';
import { ClockArrowDown, HandCoins, IndianRupee, PackageOpen, PackageCheck, XCircle } from 'lucide-react';
import { RecentSales } from './components/recent-sales';

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { data: placedOrdersData, isLoading: isPlacedLoading } = useOrdersList({ page: 1, limit: 1, status: 'placed' });
  const { data: deliveredOrdersData, isLoading: isDeliveredLoading } = useOrdersList({ page: 1, limit: 1, status: 'delivered' });
  const { data: cancelledOrdersData, isLoading: isCancelledLoading } = useOrdersList({ page: 1, limit: 1, status: 'cancelled' });
  const { data: allOrdersData, isLoading: isAllOrdersLoading } = useOrdersList({ page: 1, limit: 1000000, sortBy: 'createdAt:desc' });
  const placedOrdersCount = placedOrdersData?.total ?? 0;
  const deliveredOrdersCount = deliveredOrdersData?.total ?? 0;
  const cancelledOrdersCount = cancelledOrdersData?.total ?? 0;

  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const revenueBreakdown = useMemo(() => {
    const orders = (allOrdersData?.results ?? []) as Order[];
    const from = dateRange?.from ? new Date(dateRange.from).getTime() : undefined;
    const to = dateRange?.to ? new Date(dateRange.to).getTime() : undefined;

    const inRange = (iso?: string) => {
      if (!from && !to) return true;
      if (!iso) return false;
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return false;
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    };

    const computeDiscountedTotal = (o: Order) => {
      const lines = (o.productsDetails ?? []).map((p) => {
        const unit = Number(p.pricePerUnit || 0);
        const off = Number(p.discount || 0);
        const qty = Number(p.totalUnit || 1);
        return (unit - off) * qty;
      });
      return lines.reduce((sum, v) => sum + v, 0);
    };

    const filtered = orders.filter((o) => inRange(o.createdAt));
    const nonCancelled = filtered
      .filter((o) => String(o.status).toLowerCase() !== 'cancelled')
      .reduce((sum, o) => {
        const discounted = computeDiscountedTotal(o);
        const shipping = Number(o.shippingCharge || 0);
        return sum + discounted + shipping;
      }, 0);
    const cancelled = filtered
      .filter((o) => String(o.status).toLowerCase() === 'cancelled')
      .reduce((sum, o) => {
        const discounted = computeDiscountedTotal(o);
        const shipping = Number(o.shippingCharge || 0);
        return sum + discounted + shipping;
      }, 0);
    return { nonCancelled, cancelled, total: nonCancelled + cancelled };
  }, [allOrdersData?.results, dateRange?.from, dateRange?.to]);

  const paidBreakdown = useMemo(() => {
    const orders = (allOrdersData?.results ?? []) as Order[];
    const from = dateRange?.from ? new Date(dateRange.from).getTime() : undefined;
    const to = dateRange?.to ? new Date(dateRange.to).getTime() : undefined;

    const inRange = (iso?: string) => {
      if (!from && !to) return true;
      if (!iso) return false;
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return false;
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    };

    const computeDiscountedTotal = (o: Order) => {
      const lines = (o.productsDetails ?? []).map((p) => {
        const unit = Number(p.pricePerUnit || 0);
        const off = Number(p.discount || 0);
        const qty = Number(p.totalUnit || 1);
        return (unit - off) * qty;
      });
      return lines.reduce((sum, v) => sum + v, 0);
    };

    const paidOrders = orders
      .filter((o) => String(o.paymentStatus || '').toLowerCase() === 'paid')
      .filter((o) => inRange(o.createdAt));

    const cancelledPaid = paidOrders
      .filter((o) => String(o.status).toLowerCase() === 'cancelled')
      .reduce((sum, o) => sum + computeDiscountedTotal(o) + Number(o.shippingCharge || 0), 0);

    const nonCancelledPaid = paidOrders
      .filter((o) => String(o.status).toLowerCase() !== 'cancelled')
      .reduce((sum, o) => sum + computeDiscountedTotal(o) + Number(o.shippingCharge || 0), 0);

    return {
      cancelledPaid,
      nonCancelledPaid,
      totalPaid: cancelledPaid + nonCancelledPaid,
    };
  }, [allOrdersData?.results, dateRange?.from, dateRange?.to]);

  const unpaidBreakdown = useMemo(() => {
    const orders = (allOrdersData?.results ?? []) as Order[];
    const from = dateRange?.from ? new Date(dateRange.from).getTime() : undefined;
    const to = dateRange?.to ? new Date(dateRange.to).getTime() : undefined;

    const inRange = (iso?: string) => {
      if (!from && !to) return true;
      if (!iso) return false;
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return false;
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    };

    const computeDiscountedTotal = (o: Order) => {
      const lines = (o.productsDetails ?? []).map((p) => {
        const unit = Number(p.pricePerUnit || 0);
        const off = Number(p.discount || 0);
        const qty = Number(p.totalUnit || 1);
        return (unit - off) * qty;
      });
      return lines.reduce((sum, v) => sum + v, 0);
    };

    const unpaidOrders = orders
      .filter((o) => String(o.paymentStatus || '').toLowerCase() !== 'paid')
      .filter((o) => inRange(o.createdAt));

    const cancelledUnpaid = unpaidOrders
      .filter((o) => String(o.status).toLowerCase() === 'cancelled')
      .reduce((sum, o) => sum + computeDiscountedTotal(o) + Number(o.shippingCharge || 0), 0);

    const nonCancelledUnpaid = unpaidOrders
      .filter((o) => String(o.status).toLowerCase() !== 'cancelled')
      .reduce((sum, o) => sum + computeDiscountedTotal(o) + Number(o.shippingCharge || 0), 0);

    return {
      cancelledUnpaid,
      nonCancelledUnpaid,
      totalUnpaid: cancelledUnpaid + nonCancelledUnpaid,
    };
  }, [allOrdersData?.results, dateRange?.from, dateRange?.to]);

  const overviewSeries = useMemo(() => {
    const orders = (allOrdersData?.results ?? []) as Order[];
    const from = dateRange?.from ? new Date(dateRange.from) : undefined;
    const to = dateRange?.to ? new Date(dateRange.to) : undefined;

    const inRange = (iso?: string) => {
      if (!from && !to) return true;
      if (!iso) return false;
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return false;
      if (from && t < from.getTime()) return false;
      if (to && t > to.getTime()) return false;
      return true;
    };

    const computeDiscountedTotal = (o: Order) => {
      const lines = (o.productsDetails ?? []).map((p) => {
        const unit = Number(p.pricePerUnit || 0);
        const off = Number(p.discount || 0);
        const qty = Number(p.totalUnit || 1);
        return (unit - off) * qty;
      });
      return lines.reduce((sum, v) => sum + v, 0) + Number(o.shippingCharge || 0);
    };

    // choose bucket: daily if explicit range chosen and range <= 92 days, else monthly
    const useDaily = Boolean(from && to && (to.getTime() - from.getTime()) <= 1000 * 60 * 60 * 24 * 92);
    const keyFor = (d: Date) => {
      if (useDaily) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
      }
      // month label like Jan '25
      return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    };

    // Aggregate totals per bucket (total, paid/unpaid, cancelled/non-cancelled)
    type Bucket = {
      total: number;
      nonCancelled: number;
      cancelled: number;
      paid: number;
      unpaid: number;
      nonCancelledPaid: number;
      nonCancelledUnpaid: number;
      cancelledPaid: number;
      cancelledUnpaid: number;
    };
    const empty: Bucket = { total: 0, nonCancelled: 0, cancelled: 0, paid: 0, unpaid: 0, nonCancelledPaid: 0, nonCancelledUnpaid: 0, cancelledPaid: 0, cancelledUnpaid: 0 };
    const map = new Map<string, Bucket>();
    for (const o of orders) {
      if (!inRange(o.createdAt)) continue;
      const d = new Date(o.createdAt);
      const k = keyFor(d);
      const prev = map.get(k) ?? { ...empty };
      const amount = computeDiscountedTotal(o);
      const isCancelled = String(o.status).toLowerCase() === 'cancelled';
      const isPaid = String(o.paymentStatus || '').toLowerCase() === 'paid';

      prev.total += amount;
      if (isCancelled) {
        prev.cancelled += amount;
        if (isPaid) prev.cancelledPaid += amount; else prev.cancelledUnpaid += amount;
      } else {
        prev.nonCancelled += amount;
        if (isPaid) prev.nonCancelledPaid += amount; else prev.nonCancelledUnpaid += amount;
      }
      if (isPaid) prev.paid += amount; else prev.unpaid += amount;

      map.set(k, prev);
    }

    // If using daily and a full range is provided, ensure all days exist in the series
    if (useDaily && from && to) {
      const cur = new Date(from);
      while (cur.getTime() <= to.getTime()) {
        const k = keyFor(cur);
        if (!map.has(k)) map.set(k, { ...empty });
        cur.setDate(cur.getDate() + 1);
      }
    }

    // If using monthly, fill month gaps over a sensible window
    if (!useDaily) {
      // Decide window: if from/to provided, use their month span, else last 12 months
      let start = from ? new Date(from.getFullYear(), from.getMonth(), 1) : new Date();
      if (!from) start = new Date(start.getFullYear(), start.getMonth() - 11, 1);
      let end = to ? new Date(to.getFullYear(), to.getMonth(), 1) : new Date();
      // Ensure start <= end
      if (start.getTime() > end.getTime()) {
        const tmp = start; start = end; end = tmp;
      }
      const cur = new Date(start);
      while (cur.getTime() <= end.getTime()) {
        const k = keyFor(cur);
        if (!map.has(k)) map.set(k, { ...empty });
        cur.setMonth(cur.getMonth() + 1);
      }
    }

    // Sort chronologically
    const parseKey = (k: string) => {
      if (useDaily) {
        const [dd, mm, yy] = k.split('/');
        return new Date(Number(`20${yy}`), Number(mm) - 1, Number(dd)).getTime();
      }
      const [mon, y] = k.split(' '); // e.g., "Jan 25"
      const monthIndex = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(mon);
      return new Date(Number(`20${y}`), monthIndex, 1).getTime();
    };

    const series = Array.from(map.entries())
      .sort((a, b) => parseKey(a[0]) - parseKey(b[0]))
      .map(([name, bucket]) => ({ name, ...bucket }));

    return series;
  }, [allOrdersData?.results, dateRange?.from, dateRange?.to]);


  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          {/* <ThemeSwitch /> */}
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <div className='flex flex-col'>
            <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
            <span className='text-muted-foreground text-xs'>
              {dateRange?.from && dateRange?.to
                ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
                : ''}
            </span>
          </div>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            {/* <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='analytics' disabled>
                Analytics
              </TabsTrigger>
              <TabsTrigger value='reports' disabled>
                Reports
              </TabsTrigger>
              <TabsTrigger value='notifications' disabled>
                Notifications
              </TabsTrigger>
            </TabsList> */}
          </div>
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-start space-y-0 pb-2'>
                  <PackageOpen />
                  <CardTitle className='text-md font-semibold'>
                    New Orders Received
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {isPlacedLoading ? '...' : placedOrdersCount}
                  </div>
                  <p className='text-muted-foreground text-xs mb-3'>
                    Number of orders recently placed by customers
                  </p>
                  <div className='space-y-1 pt-2 border-t'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-muted-foreground flex items-center gap-1'>
                        <PackageCheck className='h-3.5 w-3.5' /> Delivered Orders
                      </span>
                      <span className='font-semibold text-sm'>{isDeliveredLoading ? '...' : deliveredOrdersCount}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-muted-foreground flex items-center gap-1'>
                        <XCircle className='h-3.5 w-3.5' /> Cancelled Orders
                      </span>
                      <span className='font-semibold text-sm'>{isCancelledLoading ? '...' : cancelledOrdersCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-start space-y-0 pb-2'>
                  <IndianRupee />
                  <CardTitle className='text-md font-semibold'>
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isAllOrdersLoading ? (
                    <div className='text-2xl font-bold'>...</div>
                  ) : (
                    <div className='space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground'>Non-cancelled Orders</span>
                        <span className='font-semibold'>{formatINR(revenueBreakdown.nonCancelled)}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground'>Cancelled Orders</span>
                        <span className='font-semibold'>{formatINR(revenueBreakdown.cancelled)}</span>
                      </div>
                      <div className='flex items-center justify-between pt-1 border-t mt-2'>
                        <span className='text-sm font-medium'>Total</span>
                        <span className='text-lg font-bold'>{formatINR(revenueBreakdown.total)}</span>
                      </div>
                      <p className='text-muted-foreground text-[10px]'>
                        Computed from item totals + shipping{dateRange?.from && dateRange?.to ? ' in selected range' : ''}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-start space-y-0 pb-2'>
                  <HandCoins />
                  <CardTitle className='text-md font-semibold'>Received Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {isAllOrdersLoading ? (
                    <div className='text-2xl font-bold'>...</div>
                  ) : (
                    <div className='space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground'>Non-cancelled Orders (paid)</span>
                        <span className='font-semibold'>{formatINR(paidBreakdown.nonCancelledPaid)}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground'>Cancelled Orders (paid)</span>
                        <span className='font-semibold'>{formatINR(paidBreakdown.cancelledPaid)}</span>
                      </div>
                      <div className='flex items-center justify-between pt-1 border-t mt-2'>
                        <span className='text-sm font-medium'>Total (paid)</span>
                        <span className='text-lg font-bold'>{formatINR(paidBreakdown.totalPaid)}</span>
                      </div>
                      <p className='text-muted-foreground text-[10px]'>
                        Paid amount split by cancelled status{dateRange?.from && dateRange?.to ? ' in selected range' : ''}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-start space-y-0 pb-2'>
                  <ClockArrowDown />
                  <CardTitle className='text-md font-semibold'>
                    Outstanding Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isAllOrdersLoading ? (
                    <div className='text-2xl font-bold'>...</div>
                  ) : (
                    <div className='space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground'>Non-cancelled Orders (unpaid)</span>
                        <span className='font-semibold'>{formatINR(unpaidBreakdown.nonCancelledUnpaid)}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground'>Cancelled Orders (unpaid)</span>
                        <span className='font-semibold'>{formatINR(unpaidBreakdown.cancelledUnpaid)}</span>
                      </div>
                      <div className='flex items-center justify-between pt-1 border-t mt-2'>
                        <span className='text-sm font-medium'>Total (unpaid)</span>
                        <span className='text-lg font-bold'>{formatINR(unpaidBreakdown.totalUnpaid)}</span>
                      </div>
                      <p className='text-muted-foreground text-[10px]'>
                        Unpaid amount split by cancelled status{dateRange?.from && dateRange?.to ? ' in selected range' : ''}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
              <Card className='col-span-1 lg:col-span-7'>
                <CardHeader>
                  <CardTitle>Total Sale</CardTitle>
                </CardHeader>
                <CardContent className='pl-2'>
                  <Overview data={overviewSeries} />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-5'>
                <CardHeader>
                  <CardTitle>Recent Order</CardTitle>
                  <CardDescription>
                    Latest customer orders with quick access to details and status.
                  </CardDescription>
                </CardHeader>
                <CardContent className='max-h-96 overflow-auto px-6'>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}

const topNav = [
  // {
  //   title: 'Overview',
  //   href: 'dashboard/overview',
  //   isActive: true,
  //   disabled: false,
  // },
  {
    title: 'Customers',
    href: 'users',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Products',
    href: 'products',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Orders',
    href: 'orders',
    isActive: true,
    disabled: false,
  },
];
