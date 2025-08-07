import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { Button } from '@/components/ui/button'
import { Eye, IndianRupee  } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


// Product Interface (based on your schema)
export interface Product {
  _id: string
  id: string;
  category: { id: string; name: string }
  name: string
  description?: string
  images?: string[]
  ingredients?: string[]
  benefits?: string[]
  isPremium: boolean
  isPopular: boolean
  variants: {
    gm: { weight: string; price: number; discount: number }[]
    kg: { weight: string; price: number; discount: number }[]
  }
}

export const columns: ColumnDef<Product>[] = [
  // ✅ Select Checkbox
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // ✅ Product ID
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product ID" />,
    cell: ({ row }) => <div className="w-[210px] truncate">{row.getValue('id')}</div>,
    enableSorting: false,
    enableHiding: false,
  },

  // ✅ Category
  {
    accessorKey: 'category',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    cell: ({ row }) => {
  
      return <span className="font-medium">{row.original.category?.name || '—'}</span>;
    },
  },

  // ✅ Product Name
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-semibold">{row.getValue('name')}</span>,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },

  // ✅ Description
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      const maxLength = 25 // reduced length to prevent scroll
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
  
  // ✅ Ingredients
  {
    accessorKey: 'ingredients',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ingredients" />,
    cell: ({ row }) => {
      const ingredients = row.original.ingredients || []
      const content = ingredients.length > 0 ? ingredients.join(', ') : '—'
      const maxLength = 25
      const truncated = content.length > maxLength ? `${content.slice(0, maxLength)}...` : content
  
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate block max-w-[200px] text-sm text-muted-foreground cursor-help">
                {truncated}
              </span>
            </TooltipTrigger>
            {ingredients.length > 0 && (
              <TooltipContent className="max-w-xs">
                <p>{content}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  
  // ✅ Benefits
  {
    accessorKey: 'benefits',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Benefits" />,
    cell: ({ row }) => {
      const benefits = row.original.benefits || []
      const content = benefits.length > 0 ? benefits.join(', ') : '—'
      const maxLength = 25
      const truncated = content.length > maxLength ? `${content.slice(0, maxLength)}...` : content
  
      return (
        <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate block max-w-[200px] text-sm text-muted-foreground cursor-help">
                  {truncated}
                </span>
              </TooltipTrigger>
              {benefits.length > 0 && (
                <TooltipContent className="max-w-xs">
                  <p>{content}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
      )
    },
  },  
  // ✅ Image (Eye Button Preview)
  {
    id: 'images',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Images" />,
    cell: ({ row }) => {
      const images = row.original.images || []
      if (images.length === 0) return <span>—</span>
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Eye className="h-4 w-4 !bg-transparent" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Product Images</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Product Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded border"
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )
    },
  },

  // ✅ Premium Badge
  {
    accessorKey: 'isPremium',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Premium" />,
    cell: ({ row }) => {
      const isPremium = row.getValue('isPremium') as boolean
      return (
        <Badge variant={isPremium ? 'enable' : 'destructive'}>
          {isPremium ? 'Yes' : 'No'}
        </Badge>
      )
    },
    enableSorting: true,
  },

  // ✅ Popular Badge
  {
    accessorKey: 'isPopular',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Popular" />,
    cell: ({ row }) => {
      const isPopular = row.getValue('isPopular') as boolean
      return (
        <Badge variant={isPopular ? 'enable' : 'destructive'}>
          {isPopular ? 'Yes' : 'No'}
        </Badge>
      )
    },
    enableSorting: true,
  },

  // ✅ Variants
  {
    id: "variants",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Variants" />,
    cell: ({ row }) => {
      const variants = row.original.variants;
      const gmVariants = variants?.gm || [];
      const kgVariants = variants?.kg || [];
  
      // ✅ Helper to clean weight suffix (avoids duplicate "g" or "kg")
      const formatWeight = (weight: string, unit: string) =>
        weight.toLowerCase().endsWith(unit) ? weight : `${weight}${unit}`;
  
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <IndianRupee className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-52">
            {/* Gram Variants */}
            {gmVariants.length > 0 && (
              <>
                <p className="px-2 py-1 text-xs text-gray-500">Gram Variants</p>
                {gmVariants.map((v, i) => (
                  <DropdownMenuItem key={`gm-${i}`} className="flex justify-between text-sm">
                    <span>{formatWeight(v.weight, "g")}</span>
                    <span>
                      ₹{v.price}{" "}
                      {v.discount > 0 && <span className="text-red-500 text-xs ml-1">-{v.discount}%</span>}
                    </span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
  
            {/* Kilogram Variants */}
            {kgVariants.length > 0 && (
              <>
                <p className="px-2 py-1 text-xs text-gray-500 border-t mt-1 pt-1">Kilogram Variants</p>
                {kgVariants.map((v, i) => (
                  <DropdownMenuItem key={`kg-${i}`} className="flex justify-between text-sm">
                    <span>{formatWeight(v.weight, "kg")}</span>
                    <span>
                      ₹{v.price}{" "}
                      {v.discount > 0 && <span className="text-red-500 text-xs ml-1">-{v.discount}%</span>}
                    </span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
  
            {/* No Variants */}
            {!gmVariants.length && !kgVariants.length && (
              <p className="px-2 py-2 text-sm text-gray-500 text-center">No variants available</p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  

  // ✅ Actions
  {
    id: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Actions" />,
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
]
