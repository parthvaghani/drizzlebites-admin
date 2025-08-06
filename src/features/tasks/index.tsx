import { useProductCategories } from '@/hooks/use-categories'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import TasksProvider from './context/tasks-context'


export default function Tasks() {
  const { data, isLoading, isError, error } = useProductCategories()
  


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
          <TasksPrimaryButtons />
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
  {isLoading ? (
    <p>Loading categories...</p>
  ) : isError ? (
    <p className='text-red-500'>Error: {(error as Error).message}</p>
  ) : (
    <DataTable
      data={(() => {
        const rawData = data || [];
        // console.log('rawData :>> ', data);
        if (!Array.isArray(rawData)) {
          // console.warn('Data is not an array:', rawData);
          return [];
        }
        
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
    />
  )}
</div>
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}
