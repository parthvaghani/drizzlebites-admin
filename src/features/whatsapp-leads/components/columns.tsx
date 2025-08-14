import { ColumnDef } from '@tanstack/react-table'
import { Badge, badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'
import { DataTableColumnHeader } from '@/features/categories/components/data-table-column-header'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTableRowActions } from './data-table-row-actions'
import { Checkbox } from '@/components/ui/checkbox';

export interface WhatsappLeadMetadata {
  productId?: string
  productName?: string
  variant?: string
  discountApplied?: boolean
}

export interface WhatsappLead {
  _id: string
  page: string
  button: string
  message: string
  phoneNumber: string
  status: string
  sourceUrl?: string
  userAgent?: string
  ipAddress?: string
  metadata?: WhatsappLeadMetadata
  whatsappIntent?: boolean
  whatsappSent?: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
  __v?: number
}

export const columns: ColumnDef<WhatsappLead>[] = [
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
    accessorKey: 'page',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Page' />
    ),
    cell: ({ getValue }) => <span className='font-medium'>{String(getValue() ?? '')}</span>,
  },
  {
    accessorKey: 'button',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Button' />
    ),
    cell: ({ getValue }) => <span>{String(getValue() ?? '')}</span>,
  },
  {
    accessorKey: 'message',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Message' />
    ),
    cell: ({ getValue }) => {
      const value = String(getValue() ?? '')
      const max = 60
      const truncated = value.length > max ? `${value.slice(0, max)}…` : value
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span title={value} className='text-sm text-muted-foreground'>
                {truncated || '—'}
              </span>
            </TooltipTrigger>
            {value.length > 0 && (
              <TooltipContent className='max-w-xs'>
                <p>{value}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    accessorKey: 'phoneNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone' />
    ),
    cell: ({ getValue }) => <span className='font-medium'>{String(getValue() ?? '')}</span>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ getValue }) => {
      const status = String(getValue() ?? 'new').toLowerCase()
      let variant: VariantProps<typeof badgeVariants>['variant'] = 'default'
      switch (status) {
        case 'new':
          variant = 'pending'
          break
        case 'contacted':
          variant = 'reviewed'
          break
        case 'closed':
          variant = 'enable'
          break
        case 'spam':
          variant = 'destructive'
          break
        default:
          variant = 'default'
      }
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: 'whatsappIntent',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Intent' className='text-center' />
    ),
    cell: ({ getValue }) => {
      const val = Boolean(getValue())
      return <Badge variant={val ? 'enable' : 'destructive'}>{val ? 'Yes' : 'No'}</Badge>
    },
  },
  {
    accessorKey: 'whatsappSent',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Sent' className='text-center' />
    ),
    cell: ({ getValue }) => {
      const val = Boolean(getValue())
      return <Badge variant={val ? 'enable' : 'destructive'}>{val ? 'Yes' : 'No'}</Badge>
    },
  },
  {
    accessorKey: 'sourceUrl',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Source' />
    ),
    cell: ({ getValue }) => {
      const href = String(getValue() ?? '')
      if (!href) return <span>—</span>
      return (
        <a href={href} target='_blank' rel='noreferrer' className='text-primary underline underline-offset-4'>
          Open
        </a>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created' className='text-center' />
    ),
    cell: ({ getValue }) => {
      const raw = getValue() as string | Date | undefined
      if (!raw) return <span>—</span>
      const date = typeof raw === 'string' ? new Date(raw) : raw
      const formatted = new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
      return <span>{formatted}</span>
    },
  },
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Actions' className='text-center' />
    ),
    cell: ({ row }) => (
      <DataTableRowActions row={row as unknown as { original: { _id?: string } }} />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]


