import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DataTable } from './components/data-table'
import { columns, type SuggestedProduct } from './components/columns'
import { useState, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSuggestedProductsList } from '@/hooks/use-suggested-products'

export default function SuggestedProducts() {
  const [status, setStatus] = useState<'all' | 'pending' | 'reviewed' | 'approved' | 'rejected'>('all')
  const statusParam = useMemo(() => (status === 'all' ? undefined : status), [status])
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, error, isFetching } = useSuggestedProductsList({
    page: 1,
    limit: 100,
    search,
    status: statusParam,
  })

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Suggested Products</h2>
            <p className='text-muted-foreground'>Manage user suggested products.</p>
          </div>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              <Select value={status} onValueChange={(val: 'all' | 'pending' | 'reviewed' | 'approved' | 'rejected') => setStatus(val)}>
                <SelectTrigger id='status-filter' className='h-8 w-[160px]'>
                  <SelectValue placeholder='All' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='reviewed'>Reviewed</SelectItem>
                  <SelectItem value='approved'>Approved</SelectItem>
                  <SelectItem value='rejected'>Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          {isLoading || isFetching ? (
            <p>Loading Suggested Products...</p>
          ) : isError ? (
            <p className='text-red-500'>Error: {(error as Error).message}</p>
          ) : (
            <DataTable
              data={(data?.results as SuggestedProduct[]) ?? []}
              columns={columns}
              onSearchChange={setSearch}
            />
          )}
        </div>
      </Main>
    </>
  )
}


