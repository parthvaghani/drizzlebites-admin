import { ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';

export interface Testimonial {
  _id: string;
  name: string;
  location?: string;
  body: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  img?: string;
  visible?: boolean;
}

export const columns: ColumnDef<Testimonial>[] = [
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
    cell: ({ row }) => {
      const name = row.original.name;
      const img = row.original.img;
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      return (
        <div className='flex items-center gap-2'>
          <Avatar className='h-8 w-8'>
            {img ? <AvatarImage src={img} alt={name} /> : null}
            <AvatarFallback>{initials || 'U'}</AvatarFallback>
          </Avatar>
          <span className='font-medium'>{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'location',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Location' />
    ),
    cell: ({ getValue }) => {
      const value = (getValue() as string) || '—';
      return <span>{value}</span>;
    },
  },
  {
    accessorKey: 'body',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Testimonial' />
    ),
    cell: ({ getValue }) => {
      const value = (getValue() as string) || '';
      const max = 30;
      const truncated = value.length > max ? `${value.slice(0, max)}…` : value;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span title={value} className='text-sm text-muted-foreground'>
                {truncated || '—'}
              </span>
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
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date' />
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
    accessorKey: 'visible',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Visible' className='text-center' />
    ),
    cell: ({ getValue }) => {
      const visible = Boolean(getValue());
      return (
        <Badge variant={visible ? 'enable' : 'destructive'}>
          {visible ? 'Yes' : 'No'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Actions' className='text-center' />
    ),
    cell: ({ row }) => (
      <DataTableRowActions row={row as unknown as { original: Testimonial; }} />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]


