// import { IconDownload } from '@tabler/icons-react'
import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import { useCreateProductCategory } from '@/hooks/use-categories' // ✅ Import mutation hook
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function TasksPrimaryButtons() {
  const [openSheet, setOpenSheet] = useState(false)
  const queryClient = useQueryClient()

  const [categoryData, setCategoryData] = useState({
    category: '',
    name: '',
    description: '',
    pricingEnabled: false,
  })

 
  const { mutate: createCategory, isPending } = useCreateProductCategory()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryData({ ...categoryData, [e.target.name]: e.target.value })
  }

  const handleSubmit = () => {
    createCategory(categoryData, {
      onSuccess: () => {
        toast.success('Category created successfully!')
        queryClient.invalidateQueries({ queryKey: ['product-categories'] }) 
        setCategoryData({ category: '', name: '', description: '', pricingEnabled: false }) // Reset form
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to create category')
      },
    })
  }

  return (
    <div className="flex gap-2">
      {/* Import Button */}
      {/* <Button variant="outline" className="space-x-1">
        <span>Import</span> <IconDownload size={18} />
      </Button> */}

      {/* Create Category Button */}
      <Button className="space-x-1" onClick={() => setOpenSheet(true)}>
        <span>Create Category</span> <IconPlus size={18} />
      </Button>

      {/* Sheet for Creating Category */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold">Create New Category</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Fill out the details below to add a new product category.
            </p>
          </SheetHeader>

          <div className="space-y-5 mt-6 mx-2">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-red-500">*</span>
              </Label>
              <Input
                id="category"
                name="category"
                value={categoryData.category}
                onChange={handleChange}
                placeholder="e.g. electronics"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={categoryData.name}
                onChange={handleChange}
                placeholder="e.g. Electronics & Gadgets"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Input
                id="description"
                name="description"
                value={categoryData.description}
                onChange={handleChange}
                placeholder="Short description about this category"
              />
            </div>

            {/* Pricing Enabled Switch */}
            <div className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <Label htmlFor="pricingEnabled" className="text-sm font-medium">Pricing Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Enable pricing options for products in this category.
                </p>
              </div>
              <Switch
                id="pricingEnabled"
                checked={categoryData.pricingEnabled}
                onCheckedChange={(val) =>
                  setCategoryData({ ...categoryData, pricingEnabled: val })
                }
              />
            </div>
          </div>

          <SheetFooter className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setOpenSheet(false)} className="w-full">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="w-full">
              {isPending ? 'Saving...' : 'Save Category'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
