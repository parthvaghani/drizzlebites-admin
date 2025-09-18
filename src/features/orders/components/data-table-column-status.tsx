import { Badge } from '@/components/ui/badge';
import { OrderRow } from './data-table-row-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useUpdateOrderStatus } from '@/hooks/use-orders';
import { toast } from 'sonner';
import { useState } from "react";
import { Input } from "@/components/ui/input";

const statusVariantMap: Record<string, 'enable' | 'reviewed' | 'placed' | 'inprogress' | 'destructive' | 'delivered' | 'default'> = {
    placed: 'placed',
    accepted: 'reviewed',
    inprogress: 'inprogress',
    completed: 'enable',
    cancelled: 'destructive',
    delivered: 'delivered',
};

const STATUS_OPTIONS = [
    { value: 'placed', label: 'Placed' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'inprogress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'delivered', label: 'Delivered' },
] as const;

const paymentStatusVariantMap: Record<string, "default" | "enable" | "destructive"> = {
    paid: "enable",
    unpaid: "destructive",
};

const PAYMENT_STATUS_OPTIONS = [
    { value: "paid", label: "Paid" },
    { value: "unpaid", label: "Unpaid" },
] as const;

export function StatusCell({ order }: { order: OrderRow; }) {
    const current = order.status?.toLowerCase();
    const variant = statusVariantMap[current] || "default";
    const { mutate: updateStatus, isPending } = useUpdateOrderStatus();

    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [trackingLink, setTrackingLink] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [courierName, setCourierName] = useState("");
    const [customMessage, setCustomMessage] = useState("");

    const onSelect = (next: string) => {
        if (next === order.status) return;

        if (next === "cancelled") {
            setShowCancelDialog(true); // open dialog instead of direct update
            return;
        }

        if (next === "completed") {
            setShowCompleteDialog(true);
            return;
        }

        updateStatus(
            { id: order._id, status: next },
            {
                onSuccess: () => toast.success("Order status updated"),
                onError: (err: unknown) => {
                    const message =
                        err instanceof Error ? err.message : "Failed to update status";
                    toast.error(message);
                },
            }
        );
    };

    // Disable rules based on your flow
    const isDisabled = (status: string) => {
        switch (current) {
            case "placed":
                return ["placed", "inprogress", "completed", "delivered"].includes(status);
            case "accepted":
                return ["placed", "accepted", "completed", "delivered"].includes(status);
            case "inprogress":
                return ["placed", "accepted", "inprogress", "cancelled", "delivered"].includes(status);
            case "completed":
                return ["placed", "accepted", "inprogress", "completed", "cancelled"].includes(status);
            case "cancelled":
                return true;
            case "delivered":
                return true;
            default:
                return false;
        }
    };

    const confirmCancel = () => {
        if (!cancelReason.trim()) {
            toast.error("Please enter a cancellation reason");
            return;
        }

        updateStatus(
            { id: order._id, status: "cancelled", note: cancelReason },
            {
                onSuccess: () => {
                    toast.success("Order cancelled");
                    setCancelReason("");
                    setShowCancelDialog(false);
                },
                onError: (err: unknown) => {
                    const message =
                        err instanceof Error ? err.message : "Failed to cancel order";
                    toast.error(message);
                },
            }
        );
    };

    const confirmComplete = () => {
        updateStatus(
            {
                id: order._id,
                status: "completed",
                trackingLink: trackingLink || undefined,
                trackingNumber: trackingNumber || undefined,
                courierName: courierName || undefined,
                customMessage: customMessage || undefined,
            },
            {
                onSuccess: () => {
                    toast.success("Order marked as completed");
                    setShowCompleteDialog(false);
                    setTrackingLink("");
                    setTrackingNumber("");
                    setCourierName("");
                    setCustomMessage("");
                },
                onError: (err: unknown) => {
                    const message =
                        err instanceof Error ? err.message : "Failed to complete order";
                    toast.error(message);
                },
            }
        );
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto"
                        disabled={isPending}
                    >
                        <Badge variant={variant} className="cursor-pointer select-none">
                            {order.status}
                        </Badge>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {STATUS_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                            key={opt.value}
                            disabled={isPending || isDisabled(opt.value)}
                            onSelect={() => onSelect(opt.value)}
                        >
                            <Badge
                                variant={statusVariantMap[opt.value]}
                                className={`cursor-pointer select-none ${isDisabled(opt.value) ? "opacity-50" : ""
                                    }`}
                            >
                                {opt.label}
                            </Badge>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Cancel reason dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Order</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Reason for cancellation</label>
                        <Input
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter reason..."
                        />
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCancelDialog(false);
                                setCancelReason("");
                            }}
                        >
                            Close
                        </Button>
                        <Button onClick={confirmCancel} disabled={isPending}>
                            Confirm Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complete order dialog */}
            <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Order</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Tracking link (optional)</label>
                            <Input
                                value={trackingLink}
                                onChange={(e) => setTrackingLink(e.target.value)}
                                placeholder="https://tracking.example.com/track/ABC123"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Tracking number (optional)</label>
                            <Input
                                value={trackingNumber}
                                type='number'
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking number"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Courier name (optional)</label>
                            <Input
                                value={courierName}
                                onChange={(e) => setCourierName(e.target.value)}
                                placeholder="e.g., DHL, FedEx, UPS"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Custom Message (optional)</label>
                            <Input
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="e.g., Thank you for your order"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCompleteDialog(false);
                                setTrackingLink("");
                                setTrackingNumber("");
                                setCourierName("");
                                setCustomMessage("");
                            }}
                        >
                            Close
                        </Button>
                        <Button onClick={confirmComplete} disabled={isPending}>
                            Confirm Complete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function PaymentStatusCell({ order }: { order: OrderRow; }) {
    const current = order.paymentStatus?.toLowerCase();
    const variant = paymentStatusVariantMap[current] || "default";
    const { mutate: updatePaymentStatus, isPending } = useUpdateOrderStatus();

    const onSelect = (next: string) => {
        if (next === order.paymentStatus) return;

        updatePaymentStatus(
            { id: order._id, paymentStatus: next },
            {
                onSuccess: () => toast.success("Payment status updated"),
                onError: (err: unknown) => {
                    const message =
                        err instanceof Error ? err.message : "Failed to update payment status";
                    toast.error(message);
                },
            }
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto"
                    disabled={isPending}
                >
                    <Badge variant={variant} className="cursor-pointer select-none">
                        {order.paymentStatus}
                    </Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                        key={opt.value}
                        disabled={isPending || opt.value === current}
                        onSelect={() => onSelect(opt.value)}
                    >
                        <Badge
                            variant={paymentStatusVariantMap[opt.value]}
                            className="cursor-pointer select-none"
                        >
                            {opt.label}
                        </Badge>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
