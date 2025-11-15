import { Button } from '@/components/ui/button'
import { SquarePen, Trash, Eye  } from 'lucide-react'
import { useState } from 'react'
import { useUpdateProductCategory, useDeleteProductCategory } from '@/hooks/use-categories'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface Category {
  id: string
  category: string
  name: string
  description?: string
  pricingEnabled: boolean
}

export function DataTableRowActions({ row }: { row: { original: Category } }) {
  const queryClient = useQueryClient()
  const category = row.original

  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [formData, setFormData] = useState<Category>(category)
  const [errors, setErrors] = useState<{ category?: string; name?: string; description?: string }>({})

  const { mutate: updateCategory, isPending: isUpdating } = useUpdateProductCategory()
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteProductCategory()

  const validateForm = (data: Category) => {
    const nextErrors: { category?: string; name?: string; description?: string } = {}
    const categoryValue = (data.category || '').trim()
    const nameValue = (data.name || '').trim()
    const descriptionValue = (data.description || '').trim()

    if (!categoryValue) nextErrors.category = 'Category is required'
    if (!nameValue) nextErrors.name = 'Name is required'
    if (!descriptionValue) nextErrors.description = 'Description is required'
    if (descriptionValue.length > 200) nextErrors.description = 'Description must be 200 characters or fewer'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleEditSubmit = () => {
    const trimmed: Category = {
      ...formData,
      category: (formData.category || '').trim(),
      name: (formData.name || '').trim(),
      description: (formData.description || '').trim(),
    }

    if (!validateForm(trimmed)) return

    updateCategory(
      {
        id: trimmed.id,
        category: trimmed.category,
        name: trimmed.name,
        description: trimmed.description || '',
        pricingEnabled: trimmed.pricingEnabled, // ✅ included pricingEnabled
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['product-categories'] })
          toast.success('Category updated successfully!')
          setEditOpen(false)
        },
        onError: () => toast.error('Failed to update category'),
      }
    )
  }

  const handleDelete = () => {
    deleteCategory(category.id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['product-categories'] })
        toast.success('Category deleted successfully!')
        setDeleteConfirm(false)
      },
      onError: () => toast.error('Failed to delete category'),
    })
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Edit Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setFormData(category) // ✅ Always load latest category data when editing
          setEditOpen(true)
        }}
        className="h-8 w-8"
      >
        <SquarePen className="h-4 w-4 text-blue-600" />
      </Button>

      {/* Delete Button */}
      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(true)} className="h-8 w-8">
        <Trash className="h-4 w-4 text-red-600" />
      </Button>

      <Button variant="ghost" size="icon" onClick={() => setDetailsOpen(true)} className="h-8 w-8">
        <Eye className="h-4 w-4" />
      </Button>
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Input
                required
                aria-invalid={Boolean(errors.category) || undefined}
                className={`mt-2 ${errors.category ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                value={formData.category}
                onChange={(e) => {
                  const next = { ...formData, category: e.target.value }
                  setFormData(next)
                  if (errors.category) validateForm(next)
                }}
                onBlur={() => validateForm({ ...formData, category: formData.category })}
                placeholder="Enter category"
              />
              {errors.category && (
                <p className="mt-1 text-xs text-destructive">{errors.category}</p>
              )}
            </div>
            <div>
              <Label>Name</Label>
              <Input
                required
                aria-invalid={Boolean(errors.name) || undefined}
                className={`mt-2 ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                value={formData.name}
                onChange={(e) => {
                  const next = { ...formData, name: e.target.value }
                  setFormData(next)
                  if (errors.name) validateForm(next)
                }}
                onBlur={() => validateForm({ ...formData, name: formData.name })}
                placeholder="Enter name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Input
                required
                aria-invalid={Boolean(errors.description) || undefined}
                className={`mt-2 ${errors.description ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                value={formData.description || ''}
                onChange={(e) => {
                  const next = { ...formData, description: e.target.value }
                  setFormData(next)
                  if (errors.description) validateForm(next)
                }}
                onBlur={() => validateForm({ ...formData, description: formData.description || '' })}
                placeholder="Enter description (max 200 chars)"
                maxLength={200}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-destructive">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Pricing Enabled Switch */}
          <div className="flex items-center justify-between border rounded-lg px-3 py-1 mt-2">
            <div>
              <Label htmlFor="pricingEnabled" className="text-sm font-medium">
                Pricing Enabled
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable pricing options for products in this category.
              </p>
            </div>
            <Switch
              id="pricingEnabled"
              checked={formData.pricingEnabled}
              onCheckedChange={(val) => setFormData({ ...formData, pricingEnabled: val })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={
              isUpdating ||
              !formData.category?.trim() ||
              !formData.name?.trim() ||
              !(formData.description ?? '').trim()
            }>
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete <strong>{category.name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
   {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
  <DialogContent className="max-w-md rounded-lg shadow-lg border">
    <DialogHeader>
      <DialogTitle className="text-2xl font-semibold border-b pb-3">{category.name}</DialogTitle>
    </DialogHeader>

    <div className="space-y-6 mt-4">
      {/* Category Section */}
      <div>
        <p className="text-xs uppercase text-gray-400 tracking-wider">Category</p>
        <p className="text-base font-medium text-gray-800 mt-1">{category.category}</p>
      </div>

      {/* Description Section */}
      {category.description && (
        <div>
          <p className="text-xs uppercase text-gray-400 tracking-wider">Description</p>
          <p className="text-sm text-gray-700 mt-1 leading-relaxed">{category.description}</p>
        </div>
      )}

      {/* Pricing Enabled Section */}
      <div>
        <p className="text-xs uppercase text-gray-400 tracking-wider mb-2">Pricing Status</p>
        <span
          className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${
            category.pricingEnabled
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}
        >
          {category.pricingEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}
