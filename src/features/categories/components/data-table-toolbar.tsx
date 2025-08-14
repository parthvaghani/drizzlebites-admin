import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '../components/data-table-view-options'
import { useState, useEffect } from 'react'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  search: string
  onSearchChange: (value: string) => void
}

export function DataTableToolbar<TData>({ table, search, onSearchChange }: DataTableToolbarProps<TData>) {
  // Local state for debounce UX
  const [localSearch, setLocalSearch] = useState(search)

  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  // Debounce server-side search
  useEffect(() => {
    const delay = setTimeout(() => {
      // Only trigger change if value actually differs to avoid unintended resets
      if (localSearch !== search) {
        onSearchChange(localSearch)
      }
    }, 500)
    return () => clearTimeout(delay)
  }, [localSearch, search, onSearchChange])

  const isFiltered = !!localSearch

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Search...'
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className='h-8 w-[200px] lg:w-[300px]'
        />

        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              setLocalSearch('')
              onSearchChange('')
            }}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>

      <DataTableViewOptions table={table} />
    </div>
  )
}
