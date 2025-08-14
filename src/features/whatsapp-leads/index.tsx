import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DataTable } from './components/data-table'
import { columns } from './components/columns'
import { useMemo, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWhatsappLeadsList } from '@/hooks/use-whatsapp-leads'

export default function WhatsappLeads() {
  const [status, setStatus] = useState<'all' | 'new' | 'contacted' | 'closed' | 'spam'>('all')
  const statusParam = useMemo(() => (status === 'all' ? undefined : status), [status])
  const [search, setSearch] = useState<string | null>(null)
  const [intent, setIntent] = useState<'all' | 'true' | 'false'>('all')
  const [sent, setSent] = useState<'all' | 'true' | 'false'>('all')
  const intentParam = useMemo(() => (intent === 'all' ? undefined : intent === 'true'), [intent])
  const sentParam = useMemo(() => (sent === 'all' ? undefined : sent === 'true'), [sent])

  const { data, isLoading, isError, error, isFetching } = useWhatsappLeadsList({
    page: 1,
    limit: 100,
    search,
    status: statusParam,
    whatsappIntent: intentParam,
    whatsappSent: sentParam,
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
            <h2 className='text-2xl font-bold tracking-tight'>Whatsapp Leads</h2>
            <p className='text-muted-foreground'>Track WhatsApp inquiries from your store.</p>
          </div>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              <Select value={status} onValueChange={(val: 'all' | 'new' | 'contacted' | 'closed' | 'spam') => setStatus(val)}>
                <SelectTrigger id='status-filter' className='h-8 w-[160px]'>
                  <SelectValue placeholder='All' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='new'>New</SelectItem>
                  <SelectItem value='contacted'>Contacted</SelectItem>
                  <SelectItem value='closed'>Closed</SelectItem>
                  <SelectItem value='spam'>Spam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-2'>
              <Select value={intent} onValueChange={(val: 'all' | 'true' | 'false') => setIntent(val)}>
                <SelectTrigger id='intent-filter' className='h-8 w-[140px]'>
                  <SelectValue placeholder='All' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Intent: All</SelectItem>
                  <SelectItem value='true'>Intent: Yes</SelectItem>
                  <SelectItem value='false'>Intent: No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-2'>
              <Select value={sent} onValueChange={(val: 'all' | 'true' | 'false') => setSent(val)}>
                <SelectTrigger id='sent-filter' className='h-8 w-[140px]'>
                  <SelectValue placeholder='All' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Sent: All</SelectItem>
                  <SelectItem value='true'>Sent: Yes</SelectItem>
                  <SelectItem value='false'>Sent: No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          {isLoading || isFetching ? (
            <p>Loading Whatsapp Leads...</p>
          ) : isError ? (
            <p className='text-red-500'>Error: {(error as Error).message}</p>
          ) : (
            <DataTable
              data={(data?.results ?? []) as import('@/hooks/use-whatsapp-leads').WhatsappLead[]}
              columns={columns as import('@tanstack/react-table').ColumnDef<import('@/hooks/use-whatsapp-leads').WhatsappLead, unknown>[]}
              onSearchChange={(val) => setSearch(val || null)}
            />
          )}
        </div>
      </Main>
    </>
  )
}


