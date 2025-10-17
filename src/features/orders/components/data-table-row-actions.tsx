import { Row } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow as UiTR } from '@/components/ui/table';
import { useIdByOrder, useUpdateOrderShippingCharge, useDownloadInvoice, type Order } from '@/hooks/use-orders';
import { ShoppingCart, CheckCircle2, Package, XCircle, Hourglass, PackageCheck, Edit2, Save, X, Download } from 'lucide-react';
import { ContentLoader } from '@/components/content-loader';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Types remain the same
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
  applyCoupon: { couponId: string; discountAmount: number; discountPercentage: string; };
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

// Constants moved outside component for better performance
const ORDER_STEPS = [
  { key: "placed", label: "Your order has been placed", text: "Order received in kitchen", icon: ShoppingCart },
  { key: "accepted", label: "Order confirmed and accepted", text: "Chef has accepted your order", icon: CheckCircle2 },
  { key: "inprogress", label: "Your order is being prepared", text: "We're preparing your order with care", icon: Hourglass },
  { key: "completed", label: "Order is ready for delivery", text: "Your order is ready to go!", icon: Package },
  { key: "cancelled", label: "Order has been cancelled", text: "Oops! Order was cancelled", icon: XCircle },
  { key: "delivered", label: "Order has been delivered", text: "Order successfully delivered", icon: PackageCheck },
] as const;

const STATUS_VARIANTS = {
  placed: 'placed',
  accepted: 'reviewed',
  inprogress: 'inprogress',
  completed: 'enable',
  cancelled: 'destructive',
  delivered: 'delivered',
} as const;

// Helper functions moved outside component
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

// Fixed normalizeOrderFromApi function - preserve actual values
const normalizeOrderFromApi = (o: Order): NormalizedOrder => ({
  _id: o._id,
  userId: o.userId as NormalizedOrder['userId'],
  phoneNumber: o.phoneNumber,
  status: o.status,
  createdAt: o.createdAt,
  cancelDetails: o.cancelDetails,
  address: o.address,
  productsDetails: o.productsDetails as NormalizedOrder['productsDetails'],
  totalAmount: o.totalAmount, // Keep the actual value instead of undefined
  originalTotal: o.originalTotal, // Keep the actual value instead of undefined
  shippingCharge: o.shippingCharge,
  statusHistory: (o as unknown as { statusHistory?: StatusHistoryEntry[]; }).statusHistory,
});

// Add helper function to calculate product-level discount from line items
const calculateProductDiscount = (productsDetails?: OrderRow['productsDetails']): number => {
  if (!productsDetails || productsDetails.length === 0) return 0;

  return productsDetails.reduce((totalDiscount, product) => {
    const discount = Number(product.discount || 0);
    const quantity = Number(product.totalUnit || 1);
    return totalDiscount + (discount * quantity);
  }, 0);
};

const getImageUrl = (images: unknown): string => {
  const base = import.meta.env.VITE_IMAGE_BASE_URL ?? '';
  const raw = images as unknown;
  const path = typeof raw === 'string'
    ? raw
    : (raw && typeof (raw as { url?: unknown; }).url === 'string'
      ? (raw as { url: string; }).url
      : '');
  return path ? `${base}${path}` : '';
};

const getUserDisplayName = (userId: NormalizedOrder['userId']): string => {
  if (typeof userId === 'object' && userId !== null) {
    return userId.user_details?.name ||
      userId.email ||
      userId._id ||
      userId.id ||
      '—';
  }
  return String(userId);
};

const getUserEmail = (userId: NormalizedOrder['userId']): string => {
  return (typeof userId === 'object' && userId?.email)
    ? userId.email
    : '—';
};

// Sub-components for better organization
const ShippingChargeEditor = memo(({
  isEditing,
  value,
  onValueChange,
  onSave,
  onCancel,
  onEdit,
  isLoading,
  currentStatus
}: {
  isEditing: boolean;
  value: number;
  onValueChange: (value: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
  isLoading: boolean;
  currentStatus: string;
}) => {
  if (isEditing) {
    return (
      <>
        <Input
          type="number"
          value={value}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className="w-20 h-8 text-sm"
          min="0"
          step="0.01"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={onSave}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </>
    );
  }

  return (
    <>
      <span className="font-medium">{formatINR(value)}</span>
      {currentStatus !== 'delivered' && currentStatus !== 'cancelled' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="h-8 w-8 p-0"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
    </>
  );
});

ShippingChargeEditor.displayName = 'ShippingChargeEditor';

const TrackingStep = memo(({
  step,
  index,
  isLast,
  stepIndex,
  isCancelled,
  historyEntry,
}: {
  step: typeof ORDER_STEPS[number];
  index: number;
  isLast: boolean;
  stepIndex: number;
  isCancelled: boolean;
  historyEntry?: StatusHistoryEntry;
}) => {
  const isCompleted = !isCancelled && index < stepIndex;
  const isActive = !isCancelled && index === stepIndex;
  const Icon = step.icon;

  const classes = useMemo(() => {
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
  }, [isCancelled, isCompleted, isActive, index, stepIndex]);

  const hasTrackingDetails = historyEntry && (
    historyEntry?.trackingNumber ||
    historyEntry?.trackingLink ||
    historyEntry?.courierName
  );

  return (
    <div className="flex flex-col items-center text-center relative min-h-[120px] justify-start flex-1">
      <div className={`relative z-10 h-12 w-12 rounded-full border-2 flex items-center justify-center mb-3 ${classes.circle}`}>
        <Icon className="h-5 w-5" />
      </div>

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

        {hasTrackingDetails && (
          <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
            {historyEntry?.trackingNumber && (
              <div className="font-medium text-foreground">
                Tracking: {historyEntry.trackingNumber}
              </div>
            )}
            {historyEntry?.courierName && (
              <div>Courier: {historyEntry.courierName}</div>
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

      {!isLast && (
        <div
          className={`absolute top-6 left-1/2 h-0.5 z-0 ${classes.connector}`}
          style={{
            width: 'calc(100% - 24px)',
            transform: 'translateX(12px)'
          }}
        />
      )}
    </div>
  );
});

TrackingStep.displayName = 'TrackingStep';

const ProductTableRow = memo(({ product }: { product: NonNullable<OrderRow['productsDetails']>[number]; }) => {
  const unit = Number(product.pricePerUnit || 0);
  const off = Number(product.discount || 0);
  const qty = Number(product.totalUnit || 1);
  const line = (unit - off) * qty;
  const thumb = useMemo(() => getImageUrl(product.productId?.images?.[0]), [product.productId?.images]);

  return (
    <UiTR>
      <TableCell>
        <div className="flex items-center gap-3">
          {thumb && (
            <img
              src={thumb}
              alt={product.productId?.name || 'Product'}
              className="h-10 w-10 rounded object-cover border flex-shrink-0"
            />
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">{product.productId?.name || '—'}</span>
            <span className="text-xs text-muted-foreground truncate">{product.productId?._id || ''}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>{product.weight ? `${product.weight}${product.weightVariant || ''}` : '—'}</TableCell>
      <TableCell className="text-right">{formatINR(unit)}</TableCell>
      <TableCell className="text-right text-red-600">
        {off ? `- ${formatINR(off)}` : `- ${formatINR(0)}`}
      </TableCell>
      <TableCell className="text-right">{qty}</TableCell>
      <TableCell className="text-right font-medium">{formatINR(line)}</TableCell>
    </UiTR>
  );
});

ProductTableRow.displayName = 'ProductTableRow';

// Main component
export function DataTableRowActions({ row }: { row: Row<OrderRow>; }) {
  const order = row.original;
  const [open, setOpen] = useState(false);
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [shippingChargeValue, setShippingChargeValue] = useState<number>(0);

  const { data: fetchedOrder, isLoading: isLoadingOrder, refetch } = useIdByOrder(open ? order._id : undefined);
  const updateShippingChargeMutation = useUpdateOrderShippingCharge();
  const downloadInvoiceMutation = useDownloadInvoice();

  // Fixed: Removed duplicate useEffect
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const detail: NormalizedOrder = useMemo(
    () => fetchedOrder ? normalizeOrderFromApi(fetchedOrder) : order,
    [fetchedOrder, order]
  );

  useEffect(() => {
    if (detail?.shippingCharge !== undefined) {
      setShippingChargeValue(detail.shippingCharge);
    }
  }, [detail?.shippingCharge]);

  // Memoized computed values
  const currentStatus = useMemo(() => String(detail.status ?? order.status), [detail.status, order.status]);
  const status = useMemo(() => STATUS_VARIANTS[currentStatus as keyof typeof STATUS_VARIANTS] || 'default', [currentStatus]);

  const displayName = useMemo(() => getUserDisplayName(detail?.userId), [detail?.userId]);
  const email = useMemo(() => getUserEmail(detail?.userId), [detail?.userId]);

  const filteredSteps = useMemo(() => {
    const current = currentStatus.toLowerCase();
    if (current === "delivered") {
      return ORDER_STEPS.filter((s) => s.key !== "cancelled");
    }
    if (current === "cancelled") {
      return ORDER_STEPS.filter((s) => s.key !== "delivered");
    }
    return ORDER_STEPS.filter((s) => s.key !== "cancelled");
  }, [currentStatus]);

  const trackingInfo = useMemo(() => {
    return detail.statusHistory?.find(h =>
      h.trackingNumber || h.trackingLink || h.courierName || h.customMessage
    );
  }, [detail.statusHistory]);

  const stepIndex = useMemo(() => {
    const current = currentStatus.toLowerCase();
    return filteredSteps.findIndex((s) => s.key === current);
  }, [currentStatus, filteredSteps]);

  const isCancelled = useMemo(() => currentStatus.toLowerCase() === "cancelled", [currentStatus]);

  // Inside the main component, update orderTotals calculation
  const orderTotals = useMemo(() => {
    // Calculate product-level discount from line items
    const productDiscount = calculateProductDiscount(detail.productsDetails);

    // Get subtotal (original price before any discounts)
    const subtotal = order.originalTotal ?? order.totalAmount ?? 0;

    // Coupon discount
    const couponDiscount = order.applyCoupon?.discountAmount ?? 0;

    // Total after product discount
    const afterProductDiscount = (detail.totalAmount ?? order.totalAmount ?? 0);

    // Total savings
    const totalSavings = productDiscount + couponDiscount;

    // Final total including shipping
    const finalTotal = afterProductDiscount + (detail?.shippingCharge ?? 0) - couponDiscount;

    return {
      subtotal,
      productDiscount,
      couponDiscount,
      totalSavings,
      afterProductDiscount,
      finalTotal
    };
  }, [order.originalTotal, order.totalAmount, detail.totalAmount, detail.productsDetails, detail.shippingCharge, order.applyCoupon]);
  // useCallback for event handlers
  const handleShippingChargeEdit = useCallback(() => {
    setIsEditingShipping(true);
  }, []);

  const handleShippingChargeSave = useCallback(async () => {
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
  }, [detail._id, shippingChargeValue, updateShippingChargeMutation, refetch]);

  const handleShippingChargeCancel = useCallback(() => {
    setShippingChargeValue(detail?.shippingCharge ?? 0);
    setIsEditingShipping(false);
  }, [detail?.shippingCharge]);

  const handleDownloadInvoice = useCallback(async () => {
    if (!detail._id) return;
    try {
      const blob = await downloadInvoiceMutation.mutateAsync(detail._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${fetchedOrder?.invoiceNumber || detail._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch {
      toast.error('Failed to download invoice');
    }
  }, [detail._id, downloadInvoiceMutation, fetchedOrder]);

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
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <span>Order Details</span>
                  <Badge variant={order.paymentStatus === 'paid' ? 'enable' : 'destructive'} className='shadow-xl/15'>
                    {order.paymentStatus}
                  </Badge>
                </DialogTitle>
                {fetchedOrder?.invoiceNumber && (
                  <Button variant="outline" size="sm" onClick={handleDownloadInvoice} disabled={downloadInvoiceMutation.isPending} className="gap-2 mr-2">
                    <Download className="h-4 w-4" />
                    {downloadInvoiceMutation.isPending ? 'Downloading...' : 'Download Invoice'}
                  </Button>
                )}
              </div>
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
                      <span className="font-medium truncate max-w-[280px]">{displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{email}</span>
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
                        <ShippingChargeEditor
                          isEditing={isEditingShipping}
                          value={shippingChargeValue}
                          onValueChange={setShippingChargeValue}
                          onSave={handleShippingChargeSave}
                          onCancel={handleShippingChargeCancel}
                          onEdit={handleShippingChargeEdit}
                          isLoading={updateShippingChargeMutation.isPending}
                          currentStatus={currentStatus}
                        />
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
                {trackingInfo && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base">Tracking Information</h3>
                    <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20">
                      <div className="space-y-2">
                        {trackingInfo.trackingNumber && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tracking Number</span>
                            <span className="font-medium">{trackingInfo.trackingNumber}</span>
                          </div>
                        )}
                        {trackingInfo.courierName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Courier</span>
                            <span className="font-medium">{trackingInfo.courierName}</span>
                          </div>
                        )}
                        {trackingInfo.trackingLink && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tracking Link</span>
                            <a
                              href={trackingInfo.trackingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline font-medium"
                            >
                              Track Order
                            </a>
                          </div>
                        )}
                        {trackingInfo.customMessage && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Custom Message</span>
                            <span className="font-medium">{trackingInfo.customMessage}</span>
                          </div>
                        )}
                        {trackingInfo.date && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Updated</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(trackingInfo.date).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                        {(detail.productsDetails || []).map((p) => (
                          <ProductTableRow
                            key={String(p._id || p.productId?._id || Math.random())}
                            product={p}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Tablet and Mobile views remain similar but should also be extracted to separate components */}

                {/* Order Summary */}
                <div className="flex justify-end mt-4">
                  <div className="border rounded-lg p-4 w-full sm:max-w-sm bg-muted/20">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Subtotal:</span>
                        <span>{formatINR(orderTotals.subtotal)}</span>
                      </div>

                      {/* Product-level Discount - Fixed */}
                      {orderTotals.productDiscount > 0 && (
                        <div className="flex justify-between text-orange-600 text-sm sm:text-base">
                          <span>Product Discount:</span>
                          <span>- {formatINR(orderTotals.productDiscount)}</span>
                        </div>
                      )}

                      {/* Coupon Discount */}
                      {orderTotals.couponDiscount > 0 && (
                        <div className="flex justify-between text-green-600 text-sm sm:text-base">
                          <span>Coupon Discount</span>
                          <span>- {formatINR(orderTotals.couponDiscount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Shipping:</span>
                        <span>{formatINR(detail?.shippingCharge ?? 0)}</span>
                      </div>

                      <Separator />

                      <div className="flex justify-between text-base sm:text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatINR(orderTotals.finalTotal)}</span>
                      </div>

                      {/* Total Savings Summary */}
                      {orderTotals.totalSavings > 0 && (
                        <div className="pt-2 border-t border-dashed">
                          <div className="flex justify-between text-sm text-green-600 font-semibold">
                            <span>Total Savings:</span>
                            <span>{formatINR(orderTotals.totalSavings)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Tracking */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base">Order Tracking</h3>
                  <Badge variant={status} className='shadow-xl/15'>{currentStatus}</Badge>
                </div>
                <div className="flex flex-col justify-center items-center bg-muted/20 dark:bg-accent/15 rounded-lg p-6">
                  <div className="flex items-start justify-between relative w-full">
                    {filteredSteps.map((step, index) => {
                      const historyEntry = detail.statusHistory?.find(
                        (h) => h.status.toLowerCase() === step.key.toLowerCase()
                      );

                      return (
                        <TrackingStep
                          key={step.key}
                          step={step}
                          index={index}
                          isLast={index === filteredSteps.length - 1}
                          stepIndex={stepIndex}
                          isCancelled={isCancelled}
                          historyEntry={historyEntry}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
