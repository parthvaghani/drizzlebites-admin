import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define a proper Category type for strong typing
export interface Category {
  id: string
  category: string
  name: string
  description?: string
  pricingEnabled: boolean
}

export const columns: ColumnDef<Category>[] = [
  // ✅ Select Checkbox Column
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

  // ✅ ID Column
  // {
  //   accessorKey: 'id',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title='Category ID'  />
  //   ),
  //   cell: ({ row }) => <div className='w-[210px] truncate'>{row.getValue('id')}</div>,
  //   enableSorting: false,
  //   enableHiding: false,
  // },

  // ✅ Category Column (Slug or Identifier)
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' className='text-center' />
    ),
    cell: ({ row }) => (
      <div className='flex space-x-2'>
        <span className='max-w-32 truncate font-medium sm:max-w-72 md:max-w-[31rem]'>
          {row.getValue('category')}
        </span>
      </div>
    ),
  },

  // ✅ Name Column
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' className='text-center' />
    ),
    cell: ({ row }) => (
      <div className='flex w-[150px] items-center'>
        <span>{row.getValue('name')}</span>
      </div>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },

  // ✅ Description Column
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" className='text-center' />,
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      const maxLength = 50 // reduced length to prevent scroll
      const truncated = description?.length > maxLength ? `${description.slice(0, maxLength)}...` : description || '—'

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate block max-w-[200px] text-sm text-muted-foreground cursor-help">
                {truncated}
              </span>
            </TooltipTrigger>
            {description && (
              <TooltipContent className="max-w-xs">
                <p>{description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )
    },
  },

  // ✅ Pricing Enabled Column (Status Badge)
  {
    accessorKey: 'pricingEnabled',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Pricing Enabled' className='text-center' />
    ),
    cell: ({ row }) => {
      const isEnabled = row.getValue('pricingEnabled') as boolean
      return (
        <Badge variant={isEnabled ? 'enable' : 'destructive'}>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      )
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      const isEnabled = row.getValue(id) as boolean
      const status = isEnabled ? 'enabled' : 'disabled'
      return (value as string[]).includes(status)
    },
  },

  // ✅ Actions Column (Edit/Delete)
  {
    id: 'actions',
    header: ({column}) => ( <DataTableColumnHeader column={column} title='Actions' className='text-center' />
  ),
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
    enableHiding: false,
  }
]
