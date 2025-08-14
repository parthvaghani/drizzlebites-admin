import { useProductCategoriesList } from '@/hooks/use-categories';
import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { TasksDialogs } from './components/tasks-dialogs';
import { TasksPrimaryButtons } from './components/tasks-primary-buttons';
import TasksProvider from './context/tasks-context';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


export default function Categories() {
  const [pricingEnabled, setPricingEnabled] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');

  const { data, isLoading, isError, error, isFetching } = useProductCategoriesList({ page, limit, search, pricingEnabled });



  return (
    <TasksProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Categories</h2>
            <p className='text-muted-foreground'>
              Manage and view all product categories in one place!
            </p>
          </div>
          <div className='flex items-center gap-6'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2'>
                <Label htmlFor='filter-premium'>Pricing Enabled</Label>
                <Switch
                  id='filter-premium'
                  checked={pricingEnabled  ?? false}
                  onCheckedChange={(val) => setPricingEnabled(val ? true : undefined)}
                />
              </div>

            </div>
            <TasksPrimaryButtons />
          </div>
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          {isLoading || isFetching ? (
            <p>Loading categories...</p>
          ) : isError ? (
            <p className='text-red-500'>Error: {(error as Error).message}</p>
          ) : (
            <DataTable
              data={(() => {
                const payload = data ?? { results: [] };
                const rawData = Array.isArray(payload) ? payload : payload.results ?? [];
                return rawData.map((category: {
                  _id?: string;
                  id?: string;
                  category?: string;
                  name?: string;
                  description?: string;
                  pricingEnabled?: boolean;
                }, index: number) => ({
                  id: category._id || category.id || `category-${index}`,
                  category: category.category || 'Unknown Category',
                  name: category.name || 'Unnamed',
                  description: category.description || '',
                  pricingEnabled: category.pricingEnabled ?? false,
                }));
              })()}
              columns={columns}
              search={search}
              onSearchChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              pagination={{ page, limit, total: data?.total ?? undefined }}
              onPaginationChange={({ page: nextPage, limit: nextLimit }) => {
                setPage(nextPage);
                setLimit(nextLimit);
              }}
            />
          )}
        </div>
      </Main>

      <TasksDialogs />
    </TasksProvider>
  );
}
