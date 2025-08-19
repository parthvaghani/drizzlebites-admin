import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions, type OrderRow } from './data-table-row-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


function isUserObject(v: OrderRow['userId']): v is Exclude<OrderRow['userId'], string> {
    return typeof v === 'object' && v !== null
}

export const columns: ColumnDef<OrderRow>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label='Select all'
                className='translate-y-[2px]'
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label='Select row'
                className='translate-y-[2px]'
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: '_id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Order ID' />,
        cell: ({ row }) => <span className='font-medium'>{row.original._id}</span>,
    },
    {
        accessorKey: 'userId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='User' />,
        cell: ({ row }) => {
            const v = row.original.userId
            let label: string
            if (isUserObject(v)) {
                label = v.user_details?.name || v.email || v._id || v.id || '—'
            } else {
                label = String(v ?? '—')
            }
            return <span className='truncate max-w-[220px] block'>{label}</span>
        },
    },
    {
        accessorKey: 'phoneNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Phone' />,
        cell: ({ row }) => <span>{row.original.phoneNumber}</span>,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => {
            const status = row.original.status?.toLowerCase();
            const statusVariantMap: Record<string, 'enable' | 'reviewed' | 'placed' | 'inprogress' | 'destructive' | 'delivered' | 'default'> = {
                placed: 'placed',
                accepted: 'reviewed',
                inprogress: 'inprogress',
                completed: 'enable',
                cancelled: 'destructive',
                delivered: 'delivered',
            };
            const variant = statusVariantMap[status] || 'default';
            return (
                <Badge variant={variant}>
                    {row.original.status}
                </Badge>
            );
        },
    },
    {
        id: 'amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Amount' />,
        cell: ({ row }) => {
            const orig = row.original.originalTotal ?? row.original.totalAmount ?? 0
            const total = row.original.totalAmount ?? 0
            const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
            const hasDiscount = (row.original.originalTotal ?? 0) > (row.original.totalAmount ?? 0)
            return (
                <div className='flex items-center gap-2'>
                    {hasDiscount && <span className='line-through text-muted-foreground'>{fmt(orig)}</span>}
                    <span className='font-semibold'>{fmt(total)}</span>
                </div>
            )
        },
    },
    {
        id: 'images',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Images' />,
        cell: ({ row }) => {
            const images = row.original.images || []
            if (!images.length) return <span>—</span>
            const first = images[0]
            return (
                <Dialog>
                    <DialogTrigger asChild>
                        <img src={first} alt='Preview' className='h-10 w-10 rounded object-cover border cursor-pointer' />
                    </DialogTrigger>
                    <DialogContent className='sm:max-w-[600px]'>
                        <DialogHeader>
                            <DialogTitle>Order Product Images</DialogTitle>
                        </DialogHeader>
                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4'>
                            {images.map((img, index) => (
                                <img key={index} src={img} alt={`Image ${index + 1}`} className='w-full h-32 object-cover rounded border' />
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            )
        },
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Created' />,
        cell: ({ row }) => {
            const d = new Date(row.original.createdAt);
            return <span>{isNaN(d.getTime()) ? '—' : d.toLocaleString()}</span>;
        },
    },
    {
        id: 'actions',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' className='text-center' />,
        cell: ({ row }) => {
            return (
                <div className='flex justify-center'>
                    <DataTableRowActions row={row as unknown as import('@tanstack/react-table').Row<OrderRow>} />
                </div>
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
];


