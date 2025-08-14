import { useState, useMemo } from 'react';
import { useProductsList } from '@/hooks/use-products';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { ProductsPrimaryButtons } from './components/products-primary-buttons';
import TasksProvider from './context/tasks-context';
import type { Product } from './data/schema';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
// import { ColumnDef } from '@tanstack/react-table'


export default function Products() {
  const [isPremium, setIsPremium] = useState<boolean | undefined>(undefined);
  const [isPopular, setIsPopular] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');

  const { data, isLoading, isError, error, isFetching } = useProductsList({
    page,
    limit,
    search,
    isPremium,
    isPopular,
  });

  const products: Product[] = useMemo(() => {
    const raw = data?.results ?? [];
    return Array.isArray(raw) ? (raw as Product[]) : [];
  }, [data]);
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
            <h2 className='text-2xl font-bold tracking-tight'>Products</h2>
            <p className='text-muted-foreground'>
              Manage and view all products in one place!
            </p>
          </div>
          <div className='flex items-center gap-6'>
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-2'>
                <Label htmlFor='filter-premium'>Premium</Label>
                <Switch
                  id='filter-premium'
                  checked={isPremium ?? false}
                  onCheckedChange={(val) => {
                    setIsPremium(val ? true : undefined)
                    setPage(1)
                  }}
                />
              </div>
              <div className='flex items-center gap-2'>
                <Label htmlFor='filter-popular'>Popular</Label>
                <Switch
                  id='filter-popular'
                  checked={isPopular ?? false}
                  onCheckedChange={(val) => {
                    setIsPopular(val ? true : undefined)
                    setPage(1)
                  }}
                />
              </div>
            </div>
            <ProductsPrimaryButtons />
          </div>
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          {isLoading || isFetching ? (
            <p>Loading Products...</p>
          ) : isError ? (
            <p className='text-red-500'>Error: {(error as Error).message}</p>
          ) : (
            <DataTable
              data={(() => {
                const rawData: Product[] = products;
                return rawData.map((product) => ({
                  _id: product._id, // or String(product._id)
                  id: product._id,  // or String(product._id)
                  category:
                    typeof product.category === 'object' && product.category !== null
                      ? product.category
                      : String(product.category || 'Unknown Category'),
                  name: product.name || 'Unnamed',
                  description: product.description || '',
                  isPremium: Boolean(product.isPremium ?? false),
                  isPopular: Boolean(product.isPopular ?? false),
                  variants: product.variants || {},
                  images: Array.isArray(product.images) ? product.images : [],
                  ingredients: Array.isArray(product.ingredients) ? product.ingredients : [],
                  benefits: Array.isArray(product.benefits) ? product.benefits : [],
                }));
              })() as {
                _id: string;
                id: string;
                category: string;
                name: string;
                description?: string;
                isPremium?: boolean;
                isPopular?: boolean;
                variants?: Record<string, unknown>;
                images?: string[];
                ingredients?: string[];
                benefits?: string[];
              }[]
              }
              columns={columns as import('@tanstack/react-table').ColumnDef<{
                _id: string;
                id: string;
                category: string;
                name: string;
                description?: string;
                isPremium?: boolean;
                isPopular?: boolean;
                variants?: Record<string, unknown>;
                images?: string[];
                ingredients?: string[];
                benefits?: string[];
              }, unknown>[]}
              search={search}
              onSearchChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              pagination={{ page, limit, total: data?.total ?? products.length }}
              onPaginationChange={({ page: nextPage, limit: nextLimit }) => {
                setPage(nextPage);
                setLimit(nextLimit);
              }}
            />
          )}
        </div>
      </Main>

      {/* <ProductDialogs /> */}
    </TasksProvider>
  );
}
