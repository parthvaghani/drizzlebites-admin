import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '../components/data-table-view-options'
import { useState, useEffect } from 'react'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const [search, setSearch] = useState('')
  const isFiltered = !!table.getState().globalFilter

  // ✅ Debounce search (500ms)
  useEffect(() => {
    const delay = setTimeout(() => {
      table.setGlobalFilter(search) // ✅ apply search globally
    }, 500)
    return () => clearTimeout(delay)
  }, [search, table])

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        {/* 🔍 Global Search Input */}
        <Input
          placeholder='Search...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='h-8 w-[200px] lg:w-[300px]'
        />

        {/* 🔄 Reset Button */}
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              setSearch('')
              table.setGlobalFilter('') // ✅ Clear filter
            }}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>

      {/* 👁️ View Options */}
      <DataTableViewOptions table={table} />
    </div>
  )
}
