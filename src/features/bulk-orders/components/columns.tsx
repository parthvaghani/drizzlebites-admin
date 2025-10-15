import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useDeleteBulkOrder } from '@/hooks/use-bulk-orders';
import { toast } from 'sonner';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface BulkOrderRow {
    _id: string;
    fullName: string;
    emailAddress: string;
    phoneNumber?: string;
    deliveryAddress?: string;
    products: Array<{
        _id: string;
        name: string;
        description: string;
        images: Array<{
            url: string;
            _id: string;
        }>;
        variants: {
            gm?: Array<{
                weight: string;
                price: number;
                discount: number;
                _id: string;
            }>;
            kg?: Array<{
                weight: string;
                price: number;
                discount: number;
                _id: string;
            }>;
        };
    }>;
    createdAt?: string;
    updatedAt?: string;
}

function OrderDetailsDialog({ order }: { order: BulkOrderRow; }) {
    const [open, setOpen] = useState(false);
    const base = import.meta.env.VITE_IMAGE_BASE_URL ?? '';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">View order details</span>
                    <Eye className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-auto sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] max-h-[80vh] overflow-y-auto" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                    <DialogDescription>
                        Complete details for order from {order.fullName}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                                    <p className="text-sm">{order.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <p className="text-sm">{order.emailAddress}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                                    <p className="text-sm">{order.phoneNumber || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                                    <p className="text-sm">
                                        {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm') : 'Not available'}
                                    </p>
                                </div>
                            </div>
                            {order.deliveryAddress && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Delivery Address</p>
                                    <p className="text-sm">{order.deliveryAddress}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Products */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Products ({order.products.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.products.map((product) => (
                                    <div key={product._id} className="flex items-center space-x-3 sm:space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                        {product.images && product.images.length > 0 && (
                                            <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden shadow-sm">
                                                <img
                                                    src={`${base}${product.images[0].url}`}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm truncate">{product.name}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export const columns: ColumnDef<BulkOrderRow>[] = [
    {
        accessorKey: 'fullName',
        header: 'Customer Name',
        cell: ({ row }) => {
            const fullName = row.getValue('fullName') as string;
            return <div className="font-medium">{fullName}</div>;
        },
    },
    {
        accessorKey: 'emailAddress',
        header: 'Email',
        cell: ({ row }) => {
            const email = row.getValue('emailAddress') as string;
            return <div className="text-sm text-muted-foreground">{email}</div>;
        },
    },
    {
        accessorKey: 'phoneNumber',
        header: 'Phone',
        cell: ({ row }) => {
            const phoneNumber = row.getValue('phoneNumber') as string;
            return <div className="text-sm">{phoneNumber || '-'}</div>;
        },
    },
    {
        accessorKey: 'products',
        header: 'Products',
        cell: ({ row }) => {
            const products = row.getValue('products') as BulkOrderRow['products'];
            return (
                <div className="text-sm">
                    <Badge variant="secondary">{products.length} items</Badge>
                </div>
            );
        },
    },
    {
        accessorKey: 'deliveryAddress',
        header: 'Delivery Address',
        cell: ({ row }) => {
            const address = row.getValue('deliveryAddress') as string;
            return (
                <div className="text-sm max-w-[200px] truncate" title={address}>
                    {address || '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'createdAt',
        header: 'Order Date',
        cell: ({ row }) => {
            const createdAt = row.getValue('createdAt') as string;
            return <div className="text-sm">{createdAt ? format(new Date(createdAt), 'MMM dd, yyyy') : '-'}</div>;
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const bulkOrder = row.original;
            const deleteBulkOrder = useDeleteBulkOrder();

            const handleDelete = async () => {
                try {
                    await deleteBulkOrder.mutateAsync(bulkOrder._id);
                    toast.success('Bulk order deleted successfully');
                } catch (error) {
                    toast.error('Failed to delete bulk order');
                }
            };

            return (
                <div className="flex items-center space-x-2">
                    <OrderDetailsDialog order={bulkOrder} />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleteBulkOrder.isPending}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <span className="sr-only">Delete bulk order</span>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            );
        },
    },
];
