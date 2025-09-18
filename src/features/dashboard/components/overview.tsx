import { CheckCircle, IndianRupee, TrendingUp, XCircle, TrendingDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type OverviewDatum = {
  name: string;
  total: number;
  nonCancelled?: number;
  cancelled?: number;
  paid?: number;
  unpaid?: number;
  nonCancelledPaid?: number;
  nonCancelledUnpaid?: number;
  cancelledPaid?: number;
  cancelledUnpaid?: number;
};

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function Overview({ data }: { data: OverviewDatum[]; }) {
  return (
    <>
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
          <CartesianGrid stroke='#f1f1f3' vertical={false} />
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
            tickFormatter={(value) => `${formatINR(Number(value))}`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const p = payload[0];
              const d = (p && p.payload ? (p.payload as OverviewDatum) : undefined) as OverviewDatum | undefined;
              if (!d) return null;
              return (
                <div className="rounded-xl border bg-card/95 backdrop-blur-sm p-4 shadow-lg text-sm min-w-[280px] max-w-[320px]">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                    <div className="w-2 h-2 rounded-full bg-chart-1"></div>
                    <div className="font-semibold text-card-foreground">{label}</div>
                  </div>

                  {/* Main metrics */}
                  <div className="space-y-3 mb-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800/50">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">Paid</span>
                        </div>
                        <div className="font-bold text-green-800 dark:text-green-200">{formatINR(d.paid || 0)}</div>
                      </div>

                      <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 border border-orange-200 dark:border-orange-800/50">
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Unpaid</span>
                        </div>
                        <div className="font-bold text-orange-800 dark:text-orange-200">{formatINR(d.unpaid || 0)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed breakdown */}
                  <div className="space-y-2 mb-3">
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Active Orders
                    </div>
                    <div className="pl-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{formatINR(d.nonCancelledPaid || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Unpaid</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          {formatINR(d.nonCancelledUnpaid || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Cancelled Orders
                    </div>
                    <div className="pl-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="font-medium text-red-600 dark:text-red-400">{formatINR(d.cancelledPaid || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Unpaid</span>
                        <span className="font-medium text-red-600 dark:text-red-400">{formatINR(d.cancelledUnpaid || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary totals */}
                  <div className="border-t border-border/50 pt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Active Total</span>
                      <span className="font-medium">{formatINR(d.nonCancelled || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Cancelled Total</span>
                      <span className="font-medium">{formatINR(d.cancelled || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-border/30">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4 text-primary" />
                        <span className="font-bold text-primary">Grand Total</span>
                      </div>
                      <span className="font-bold text-lg text-primary">{formatINR(d.total || 0)}</span>
                    </div>
                  </div>
                </div>
              );
            }}
        />
        <Bar
          dataKey='total'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
    </>
  );
}
