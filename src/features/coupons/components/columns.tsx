import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Coupon } from '@/hooks/use-coupons';

export const columns: ColumnDef<Coupon>[] = [
  // Coupon Code
  {
    accessorKey: 'couponCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Coupon Code' className='text-center' />
    ),
    cell: ({ row }) => (
      <div className='flex space-x-2'>
        <span className='font-semibold text-primary truncate'>
          {row.getValue('couponCode')}
        </span>
      </div>
    ),
  },

  // Description with Tooltip
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description' className='text-center' />
    ),
    cell: ({ row }) => {
      const description = row.getValue('description') as string;
      const maxLength = 50;
      const truncated =
        description?.length > maxLength
          ? `${description.slice(0, maxLength)}...`
          : description || '—';

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='truncate block max-w-[200px] text-sm text-muted-foreground cursor-help'>
                {truncated}
              </span>
            </TooltipTrigger>
            {description && (
              <TooltipContent className='max-w-xs'>
                <p>{description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    },
  },

  // Level
  {
    accessorKey: 'level',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Level' className='text-center' />
    ),
    cell: ({ row }) => <span className='capitalize'>{row.getValue('level')}</span>,
  },

  // Min Cart Value
  {
    accessorKey: 'minCartValue',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Min Cart Value' className='text-center' />
    ),
    cell: ({ row }) => <span>₹{row.getValue('minCartValue')}</span>,
  },

  // Max Discount %
  {
    accessorKey: 'maxDiscountValue',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Max Discount (%)' className='text-center' />
    ),
    cell: ({ row }) => <span>{row.getValue('maxDiscountValue')}%</span>,
  },

  // Coupon Type with color and optional user info
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' className='text-center' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const user = row.original?.userType;

      const variant = type === 'unique' ? 'inprogress' : 'default';

      return (
        <div className='flex flex-col'>
          <Badge variant={variant} className='capitalize w-fit'>
            {type}
          </Badge>
          {type === 'unique' && user && (
            <div className='mt-1 text-xs text-muted-foreground'>
              <div>{user.user_details.name}</div>
              <div className='text-[11px] text-gray-500'>{user.email}</div>
            </div>
          )}
        </div>
      );
    },
  },

  // Status Active / Inactive
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' className='text-center' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean;
      return (
        <Badge variant={isActive ? 'enable' : 'destructive'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      );
    },
  },

  // Start Date
  {
    accessorKey: 'startDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Start Date' className='text-center' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('startDate') as string);
      return <span>{date.toLocaleDateString()}</span>;
    },
  },

  // Expiry Date
  {
    accessorKey: 'expiryDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Expiry Date' className='text-center' />
    ),
    cell: ({ row }) => {
      const dateString = row.getValue('expiryDate') as string;
      // const date = parseDate(dateString);

      if (!dateString) {
        return <span className='text-muted-foreground'>Invalid Date</span>;
      }

      return <span>{dateString}</span>;
    },
  },

  // Actions
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Actions' className='text-center' />
    ),
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
];
