import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaginationState {
  page: number
  limit: number
  total?: number
}

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pagination?: PaginationState
  onChange?: (next: PaginationState) => void
}

export function DataTablePagination<TData>({ table, pagination, onChange }: DataTablePaginationProps<TData>) {
  const safePagination: PaginationState = pagination ?? {
    page: 1,
    limit: table.getState().pagination?.pageSize ?? 10,
    total: table.getFilteredRowModel().rows.length,
  }
  const currentPageIndex = Math.max(0, (safePagination.page ?? 1) - 1)
  const pageSize = safePagination.limit ?? 10
  const totalItems = safePagination.total ?? table.getFilteredRowModel().rows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  return (
    <div className='flex items-center justify-between overflow-clip px-2' style={{ overflowClipMargin: 1 }}>
      <div className='text-muted-foreground hidden flex-1 text-sm sm:block'>
        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className='flex items-center sm:space-x-6 lg:space-x-8'>
        <div className='flex items-center space-x-2'>
          <p className='hidden text-sm font-medium sm:block'>Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              const nextLimit = Number(value)
              onChange?.({ ...safePagination, limit: nextLimit })
            }}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((opt) => (
                <SelectItem key={opt} value={`${opt}`}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex w-[120px] items-center justify-center text-sm font-medium'>
          Page {currentPageIndex + 1} of {totalPages}
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            className='hidden h-8 w-8 p-0 lg:flex'
            onClick={() => onChange?.({ ...safePagination, page: 1 })}
            disabled={currentPageIndex <= 0}
          >
            <span className='sr-only'>Go to first page</span>
            <DoubleArrowLeftIcon className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => onChange?.({ ...safePagination, page: Math.max(1, safePagination.page - 1) })}
            disabled={currentPageIndex <= 0}
          >
            <span className='sr-only'>Go to previous page</span>
            <ChevronLeftIcon className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => onChange?.({ ...safePagination, page: Math.min(totalPages, safePagination.page + 1) })}
            disabled={currentPageIndex + 1 >= totalPages}
          >
            <span className='sr-only'>Go to next page</span>
            <ChevronRightIcon className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='hidden h-8 w-8 p-0 lg:flex'
            onClick={() => onChange?.({ ...safePagination, page: totalPages })}
            disabled={currentPageIndex + 1 >= totalPages}
          >
            <span className='sr-only'>Go to last page</span>
            <DoubleArrowRightIcon className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
