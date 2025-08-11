import { ArrowDownIcon, ArrowUpIcon } from '@radix-ui/react-icons'
import { Column } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn('font-medium text-sm', className)}>{title}</div>
  }

  return (
    <div
      className={cn('flex items-center space-x-1 cursor-pointer select-none', className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      <span>{title}</span>
      {column.getIsSorted() === 'desc' ? (
        <ArrowDownIcon className='h-4 w-4 text-muted-foreground' />
      ) : column.getIsSorted() === 'asc' ? (
        <ArrowUpIcon className='h-4 w-4 text-muted-foreground' />
      ) : null}
    </div>
  )
}
