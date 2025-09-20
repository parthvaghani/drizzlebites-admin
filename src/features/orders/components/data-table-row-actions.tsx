import { Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow as UiTR } from '@/components/ui/table';
import { useIdByOrder, useUpdateOrderShippingCharge, type Order } from '@/hooks/use-orders';
import { ShoppingCart, CheckCircle2, Package, XCircle, Hourglass, PackageCheck, Edit2, Save, X } from 'lucide-react';
import { ContentLoader } from '@/components/content-loader';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export interface OrderRow {
  _id: string;
  userId: string | {
    _id?: string;
    id?: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
    user_details?: {
      name?: string;
      country?: string;
    };
  };
  phoneNumber: string;
  status: string;
  createdAt: string;
  totalAmount?: number;
  originalTotal?: number;
  shippingCharge?: number;
  images?: string[];
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  productsDetails?: Array<{
    productId?: {
      _id?: string;
      name?: string;
      images?: string[];
    };
    weightVariant?: string;
    weight?: string;
    pricePerUnit?: number;
    discount?: number;
    totalUnit?: number;
    _id?: string;
  }>;
  updatedAt?: string;
  cancelDetails?: { reason?: string | null; };
  paymentStatus: string;
}

type StatusHistoryEntry = {
  _id: string;
  status: string;
  note: string | null;
  updatedBy: 'user' | 'admin';
  date: string;
  trackingNumber?: number | null;
  trackingLink?: string | null;
  courierName?: string | null;
  customMessage?: string | null;
};

type NormalizedOrder = {
  _id: string;
  userId: OrderRow['userId'];
  phoneNumber: string;
  status: string;
  createdAt: string;
  cancelDetails?: { reason?: string | null; };
  address?: OrderRow['address'];
  productsDetails?: OrderRow['productsDetails'];
  totalAmount?: number;
  originalTotal?: number;
  shippingCharge?: number;
  statusHistory?: StatusHistoryEntry[];
};

const ORDER_STEPS = [
  { key: "placed", label: "Your order has been placed", text: "Order received in kitchen", icon: ShoppingCart },
  { key: "accepted", label: "Order confirmed and accepted", text: "Chef has accepted your order", icon: CheckCircle2 },
  { key: "inprogress", label: "Your order is being prepared", text: "We’re preparing your order with care", icon: Hourglass },
  { key: "completed", label: "Order is ready for delivery", text: "Your order is ready to go!", icon: Package },
  { key: "cancelled", label: "Order has been cancelled", text: "Oops! Order was cancelled", icon: XCircle },
  { key: "delivered", label: "Order has been delivered", text: "Order successfully delivered", icon: PackageCheck },
];

const STATUS_VARIANTS = {
  placed: 'placed',
  accepted: 'reviewed',
  inprogress: 'inprogress',
  completed: 'enable',
  cancelled: 'destructive',
  delivered: 'delivered',
} as const;

export function DataTableRowActions({ row }: { row: Row<OrderRow>; }) {
  const order = row.original;
  const [open, setOpen] = useState(false);
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [shippingChargeValue, setShippingChargeValue] = useState<number>(0);
  const { data: fetchedOrder, isLoading: isLoadingOrder, refetch } = useIdByOrder(open ? order._id : undefined);
  const updateShippingChargeMutation = useUpdateOrderShippingCharge();

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const normalizeOrderFromApi = (o: Order): NormalizedOrder => ({
    _id: o._id,
    userId: o.userId as NormalizedOrder['userId'],
    phoneNumber: o.phoneNumber,
    status: o.status,
    createdAt: o.createdAt,
    cancelDetails: o.cancelDetails,
    address: o.address,
    productsDetails: o.productsDetails as NormalizedOrder['productsDetails'],
    totalAmount: undefined,
    originalTotal: undefined,
    shippingCharge: o.shippingCharge,
    statusHistory: (o as unknown as { statusHistory?: StatusHistoryEntry[]; }).statusHistory,
  });

  const detail: NormalizedOrder = fetchedOrder ? normalizeOrderFromApi(fetchedOrder) : order;

  useEffect(() => {
    if (detail?.shippingCharge !== undefined) {
      setShippingChargeValue(detail.shippingCharge);
    }
  }, [detail?.shippingCharge]);

  const handleShippingChargeEdit = () => {
    setIsEditingShipping(true);
  };

  const handleShippingChargeSave = async () => {
    try {
      await updateShippingChargeMutation.mutateAsync({
        id: detail._id,
        shippingCharge: shippingChargeValue,
      });
      setIsEditingShipping(false);
      toast.success('Shipping charge updated successfully');
      refetch();
    } catch (_error) {
      toast.error('Failed to update shipping charge');
    }
  };

  const handleShippingChargeCancel = () => {
    setShippingChargeValue(detail?.shippingCharge ?? 0);
    setIsEditingShipping(false);
  };

  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const currentStatus = String(detail.status ?? order.status);
  const status = STATUS_VARIANTS[currentStatus as keyof typeof STATUS_VARIANTS] || 'default';
  const getUserDisplayName = () => {
    if (typeof detail?.userId === 'object' && detail?.userId !== null) {
      return detail?.userId.user_details?.name ||
        detail?.userId.email ||
        detail?.userId._id ||
        detail?.userId.id ||
        '—';
    }
    return String(detail?.userId);
  };

  const getUserEmail = () => {
    return (typeof detail?.userId === 'object' && detail?.userId?.email)
      ? detail?.userId.email
      : '—';
  };

  const getFilteredSteps = () => {
    const current = currentStatus.toLowerCase();
    if (current === "delivered") {
      return ORDER_STEPS.filter((s) => s.key !== "cancelled");
    }
    if (current === "cancelled") {
      return ORDER_STEPS.filter((s) => s.key !== "delivered");
    }
    return ORDER_STEPS.filter((s) => s.key !== "cancelled");
  };

  const TrackingStep = ({
    step,
    index,
    isLast,
    stepIndex,
    isCancelled,
    historyEntry,
  }: {
    step: typeof ORDER_STEPS[0];
    index: number;
    isLast: boolean;
    currentStatus: string;
    stepIndex: number;
    isCancelled: boolean;
    historyEntry?: StatusHistoryEntry;
    totalSteps: number;
  }) => {
    const isCompleted = !isCancelled && index < stepIndex;
    const isActive = !isCancelled && index === stepIndex;
    const Icon = step.icon;

    const getStepClasses = () => {
      if (isCancelled && index === stepIndex) {
        return {
          circle: "bg-destructive border-destructive text-destructive-foreground",
          connector: "bg-destructive",
          label: "text-destructive"
        };
      }
      if (isCompleted) {
        return {
          circle: "bg-muted border-muted text-primary",
          connector: "bg-foreground",
          label: "text-foreground"
        };
      }
      if (isActive) {
        return {
          circle: "border-primary text-primary-foreground bg-primary",
          connector: "bg-primary",
          label: "text-foreground"
        };
      }
      return {
        circle: "bg-white border-border text-muted",
        connector: "bg-border",
        label: "text-muted"
      };
    };

    const classes = getStepClasses();

    // Check if this step has tracking details (for any status)
    const hasTrackingDetails = historyEntry && (
      historyEntry?.trackingNumber ||
      historyEntry?.trackingLink ||
      historyEntry?.courierName
    );

    return (
      <div className="flex flex-col items-center text-center relative min-h-[120px] justify-start flex-1">
        {/* Step circle with icon */}
        <div className={`
          relative z-10 h-12 w-12 rounded-full border-2
          flex items-center justify-center mb-3
          ${classes.circle}
        `}>
          <Icon className={`h-5 w-5 ${isActive && step.key === "inprogress" ? "" : ""}`} />
        </div>

        {/* Step content */}
        <div className="flex flex-col items-center space-y-1 max-w-[140px]">
          <span className={`text-xs font-semibold leading-tight ${classes.label}`}>
            {step.label}
          </span>

          {historyEntry?.date && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(historyEntry.date).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}

          {historyEntry?.note && (
            <span className="text-[10px] text-muted-foreground italic leading-tight">
              {historyEntry.note}
            </span>
          )}

          {/* Tracking Details - Show for any status with tracking info */}
          {hasTrackingDetails && (
            <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
              {historyEntry?.trackingNumber && (
                <div className="font-medium text-foreground">
                  Tracking: {historyEntry.trackingNumber}
                </div>
              )}
              {historyEntry?.courierName && (
                <div>
                  Courier: {historyEntry.courierName}
                </div>
              )}
              {historyEntry?.trackingLink && (
                <div>
                  <a
                    href={historyEntry.trackingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Track Order
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Connector line to next step */}
        {!isLast && (
          <div className={`
            absolute top-6 left-1/2 h-0.5 z-0
            ${classes.connector}
          `}
            style={{
              width: 'calc(100% - 24px)',
              transform: 'translateX(12px)'
            }} />
        )}
      </div>
    );
  };

  const allSteps = getFilteredSteps();
  const current = currentStatus.toLowerCase();
  const stepIndex = allSteps.findIndex((s) => s.key === current);
  const isCancelled = current === "cancelled";
  // const currentStep = ORDER_STEPS.find((s) => s.key === current);
  // const CurrentStatusIcon = currentStep?.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">View</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoadingOrder ? (
          <div className="relative min-h-[200px]">
            <ContentLoader active />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>Order Details</span>
                <Badge variant={order.paymentStatus === 'paid' ? 'enable' : 'destructive'} className='shadow-xl/15'>{order.paymentStatus}</Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 text-sm">
              {/* Order Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Order Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID</span>
                      <span className="font-medium truncate max-w-[280px]">{detail?._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User</span>
                      <span className="font-medium truncate max-w-[280px]">{getUserDisplayName()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{getUserEmail()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{detail?.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">
                        {detail?.createdAt ? new Date(detail.createdAt).toLocaleString('en-IN') : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Shipping Charge</span>
                      <div className="flex items-center gap-2">
                        {isEditingShipping ? (
                          <>
                            <Input
                              type="number"
                              value={shippingChargeValue}
                              onChange={(e) => setShippingChargeValue(Number(e.target.value))}
                              className="w-20 h-8 text-sm"
                              min="0"
                              step="0.01"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleShippingChargeSave}
                              disabled={updateShippingChargeMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleShippingChargeCancel}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="font-medium">{formatINR(detail?.shippingCharge ?? 0)}</span>
                            {currentStatus !== 'delivered' && currentStatus !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleShippingChargeEdit}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {detail?.cancelDetails?.reason && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cancel Reason</span>
                        <span className="font-medium text-red-600">{detail.cancelDetails.reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking Details Section */}
                {(() => {
                  const trackingEntry = detail.statusHistory?.find(h =>
                    h.trackingNumber || h.trackingLink || h.courierName || h.customMessage
                  );

                  if (!trackingEntry) return null;

                  return (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base">Tracking Information</h3>
                      <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20">
                        <div className="space-y-2">
                          {trackingEntry.trackingNumber && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tracking Number</span>
                              <span className="font-medium">{trackingEntry.trackingNumber}</span>
                            </div>
                          )}
                          {trackingEntry.courierName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Courier</span>
                              <span className="font-medium">{trackingEntry.courierName}</span>
                            </div>
                          )}
                          {trackingEntry.trackingLink && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tracking Link</span>
                              <a
                                href={trackingEntry.trackingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline font-medium"
                              >
                                Track Order
                              </a>
                            </div>
                          )}
                          {trackingEntry.customMessage && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Custom Message</span>
                              <span className="font-medium">{trackingEntry.customMessage}</span>
                            </div>
                          )}
                          {trackingEntry.date && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Updated</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(trackingEntry.date).toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Shipping Address */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Shipping Address</h3>
                  <div className="rounded-lg border p-4 bg-muted/20 break-words whitespace-pre-wrap">
                    {detail?.address ? (
                      <>
                        <div>{detail.address.addressLine1},</div>
                        {detail.address.addressLine2 && <div>{detail.address.addressLine2},</div>}
                        <div>
                          {[detail.address.city, detail.address.state, detail.address.zip]
                            .filter(Boolean)
                            .join(', ')},
                        </div>
                        <div>{detail.address.country}.</div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">No address provided</div>
                    )}
                  </div>
                </div>

              </div>

              <Separator />

              {/* Items Table */}
              <div>
                <h3 className="font-semibold text-base mb-4">Items</h3>

                {/* Desktop Table View */}
                <div className="hidden lg:block rounded-lg border overflow-hidden">
                  <div className="max-h-60 overflow-auto">
                    <Table>
                      <TableHeader>
                        <UiTR>
                          <TableHead>Product</TableHead>
                          <TableHead className="w-[100px]">Weight</TableHead>
                          <TableHead className="w-[120px] text-right">Unit Price</TableHead>
                          <TableHead className="w-[110px] text-right">Discount</TableHead>
                          <TableHead className="w-[80px] text-right">Qty</TableHead>
                          <TableHead className="w-[120px] text-right">Line Total</TableHead>
                        </UiTR>
                      </TableHeader>
                      <TableBody>
                        {(detail.productsDetails || []).map((p) => {
                          const unit = Number(p.pricePerUnit || 0);
                          const off = Number(p.discount || 0);
                          const qty = Number(p.totalUnit || 1);
                          const line = (unit - off) * qty;
                          const base = import.meta.env.VITE_IMAGE_BASE_URL ?? '';
                          const raw = (p.productId?.images?.[0] ?? '') as unknown;
                          const path = typeof raw === 'string' ? raw : (raw && typeof (raw as { url?: unknown; }).url === 'string' ? (raw as { url: string; }).url : '');
                          const thumb = path ? `${base}${path}` : '';

                          return (
                            <UiTR key={String(p._id || p.productId?._id || Math.random())}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {thumb && (
                                    <img
                                      src={thumb}
                                      alt={p.productId?.name || 'Product'}
                                      className="h-10 w-10 rounded object-cover border flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium truncate">{p.productId?.name || '—'}</span>
                                    <span className="text-xs text-muted-foreground truncate">{p.productId?._id || ''}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{p.weight ? `${p.weight}${p.weightVariant || ''}` : '—'}</TableCell>
                              <TableCell className="text-right">{formatINR(unit)}</TableCell>
                              <TableCell className="text-right text-red-600">
                                {off ? `- ${formatINR(off)}` : `- ${formatINR(0)}`}
                              </TableCell>
                              <TableCell className="text-right">{qty}</TableCell>
                              <TableCell className="text-right font-medium">{formatINR(line)}</TableCell>
                            </UiTR>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Tablet View (Medium screens) */}
                <div className="hidden md:block lg:hidden rounded-lg border overflow-hidden">
                  <div className="max-h-60 overflow-auto">
                    <Table>
                      <TableHeader>
                        <UiTR>
                          <TableHead>Product</TableHead>
                          <TableHead className="w-[80px] text-center">Qty</TableHead>
                          <TableHead className="w-[100px] text-right">Unit</TableHead>
                          <TableHead className="w-[100px] text-right">Total</TableHead>
                        </UiTR>
                      </TableHeader>
                      <TableBody>
                        {(detail.productsDetails || []).map((p) => {
                          const unit = Number(p.pricePerUnit || 0);
                          const off = Number(p.discount || 0);
                          const qty = Number(p.totalUnit || 1);
                          const line = (unit - off) * qty;
                          const base = import.meta.env.VITE_IMAGE_BASE_URL ?? '';
                          const raw = (p.productId?.images?.[0] ?? '') as unknown;
                          const path = typeof raw === 'string' ? raw : (raw && typeof (raw as { url?: unknown; }).url === 'string' ? (raw as { url: string; }).url : '');
                          const thumb = path ? `${base}${path}` : '';

                          return (
                            <UiTR key={String(p._id || p.productId?._id || Math.random())}>
                              <TableCell>
                                <div className="flex items-start gap-3">
                                  {thumb && (
                                    <img
                                      src={thumb}
                                      alt={p.productId?.name || 'Product'}
                                      className="h-12 w-12 rounded object-cover border flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium text-sm leading-tight">{p.productId?.name || '—'}</span>
                                    <span className="text-xs text-muted-foreground">{p.weight ? `${p.weight}${p.weightVariant || ''}` : ''}</span>
                                    {off > 0 && (
                                      <span className="text-xs text-red-600">-{formatINR(off)} discount</span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-medium">{qty}</TableCell>
                              <TableCell className="text-right text-sm">{formatINR(unit)}</TableCell>
                              <TableCell className="text-right font-medium">{formatINR(line)}</TableCell>
                            </UiTR>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3">
                  <div className="max-h-60 overflow-auto">
                    {(detail.productsDetails || []).map((p) => {
                      const unit = Number(p.pricePerUnit || 0);
                      const off = Number(p.discount || 0);
                      const qty = Number(p.totalUnit || 1);
                      const line = (unit - off) * qty;
                      const base = import.meta.env.VITE_IMAGE_BASE_URL ?? '';
                      const raw = (p.productId?.images?.[0] ?? '') as unknown;
                      const path = typeof raw === 'string' ? raw : (raw && typeof (raw as { url?: unknown; }).url === 'string' ? (raw as { url: string; }).url : '');
                      const thumb = path ? `${base}${path}` : '';

                      return (
                        <div key={String(p._id || p.productId?._id || Math.random())} className="border rounded-lg p-3 bg-background">
                          <div className="flex gap-3">
                            {thumb && (
                              <img
                                src={thumb}
                                alt={p.productId?.name || 'Product'}
                                className="h-14 w-14 rounded object-cover border flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm leading-tight mb-1">{p.productId?.name || '—'}</h4>
                              <p className="text-xs text-muted-foreground mb-2">{p.productId?._id || ''}</p>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Weight:</span>
                                  <span>{p.weight ? `${p.weight}${p.weightVariant || ''}` : '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Qty:</span>
                                  <span className="font-medium">{qty}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Unit Price:</span>
                                  <span>{formatINR(unit)}</span>
                                </div>
                                {off > 0 && (
                                  <div className="flex justify-between text-red-600">
                                    <span>Discount:</span>
                                    <span>-{formatINR(off)}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                <span className="text-sm font-medium">Total:</span>
                                <span className="text-sm font-bold">{formatINR(line)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary - Responsive */}
                <div className="flex justify-end mt-4">
                  <div className="border rounded-lg p-4 w-full sm:max-w-sm bg-muted/20">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Subtotal:</span>
                        <span>{formatINR(order.originalTotal ?? order.totalAmount ?? 0)}</span>
                      </div>
                      <div className="flex justify-between text-red-600 text-sm sm:text-base">
                        <span>Discount:</span>
                        <span>- {formatINR((order.originalTotal ?? 0) - (detail.totalAmount ?? 0))}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Shipping:</span>
                        <span>{formatINR(detail?.shippingCharge ?? 0)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base sm:text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatINR((order.totalAmount ?? 0) + (detail?.shippingCharge ?? 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Optimized Tracking Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base">Order Tracking</h3>
                  <Badge variant={status} className='shadow-xl/15' >{currentStatus}</Badge>
                </div>
                <div className="flex flex-col justify-center items-center bg-muted/20 dark:bg-accent/15 rounded-lg p-6">
                  <div className="flex items-start justify-between relative w-full">
                    {allSteps.map((step, index) => {
                      const historyEntry = detail.statusHistory?.find(
                        (h) => h.status.toLowerCase() === step.key.toLowerCase()
                      );

                      return (
                        <TrackingStep
                          key={step.key}
                          step={step}
                          index={index}
                          isLast={index === allSteps.length - 1}
                          currentStatus={current}
                          stepIndex={stepIndex}
                          isCancelled={isCancelled}
                          historyEntry={historyEntry}
                          totalSteps={allSteps.length}
                        />
                      );
                    })}
                  </div>
                  {/* <div className="mt-8 text-center">
                    <Badge variant={currentStatus !== 'cancelled' ? 'trackDelivered' : 'trackCancelled'} className='shadow-xl/25' >
                      <span className="flex items-center justify-center gap-1">
                        {CurrentStatusIcon ? (
                          <CurrentStatusIcon className="h-5 w-h-5 animate-bounce" />
                        ) : null}
                        {currentStep?.text || ''}
                      </span>
                    </Badge>
                  </div> */}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}