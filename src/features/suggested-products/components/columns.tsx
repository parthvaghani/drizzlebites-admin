import { ColumnDef } from '@tanstack/react-table';
import { Badge, badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import { DataTableColumnHeader } from '@/features/categories/components/data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';

export interface SuggestedProduct {
  _id: string;
  name: string;
  ingredients: string[];
  description: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const columns: ColumnDef<SuggestedProduct>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ getValue }) => <span className='font-medium'>{String(getValue() ?? '')}</span>,
  },
  {
    accessorKey: 'ingredients',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Ingredients' />
    ),
    cell: ({ getValue }) => {
      const arr = (getValue() as string[]) || [];
      const value = arr.join(', ');
      const max = 50;
      const truncated = value.length > max ? `${value.slice(0, max)}…` : value;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span title={value} className='text-sm text-muted-foreground'>{truncated || '—'}</span>
            </TooltipTrigger>
            {value.length > 0 && (
              <TooltipContent className="max-w-xs">
                <p>{value}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description' />
    ),
    cell: ({ getValue }) => {
      const value = String(getValue() ?? '');
      const max = 50;
      const truncated = value.length > max ? `${value.slice(0, max)}…` : value;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span title={value} className='text-sm text-muted-foreground'>{truncated || '—'}</span>
            </TooltipTrigger>
            {value.length > 0 && (
              <TooltipContent className="max-w-xs">
                <p>{value}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ getValue }) => {
      const status = (getValue() ?? 'pending') as SuggestedProduct['status'];
      let variant: VariantProps<typeof badgeVariants>['variant'] = 'default';
      switch (status) {
        case 'pending':
          variant = 'pending';
          break;
        case 'reviewed':
          variant = 'reviewed';
          break;
        case 'approved':
          variant = 'enable';
          break;
        case 'rejected':
          variant = 'destructive';
          break;
        default:
          variant = 'default';
      }
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created' className='text-center' />
    ),
    cell: ({ getValue }) => {
      const raw = getValue() as string | Date | undefined;
      if (!raw) return <span>—</span>;
      const date = typeof raw === 'string' ? new Date(raw) : raw;
      const formatted = new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(date);
      return <span>{formatted}</span>;
    },
  },
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Actions' className='text-center' />
    ),
    cell: ({ row }) => (
      <DataTableRowActions row={row as unknown as { original: SuggestedProduct; }} />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]


