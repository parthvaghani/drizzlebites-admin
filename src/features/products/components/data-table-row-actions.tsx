import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SquarePen, Trash, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useProductCategories } from '@/hooks/use-categories'
import { useUpdateProduct, useDeleteProduct } from '@/hooks/use-products'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface Variant {
  weight: string
  price: number
  discount?: number
}

interface Variants {
  gm?: Variant[]
  kg?: Variant[]
}

interface Category {
  _id?: string
  id?: string
  name?: string
}

interface Product {
  _id?: string
  id?: string
  category?: Category | string
  name?: string
  description?: string
  isPremium?: boolean
  isPopular?: boolean
  images?: string[]
  ingredients?: string[]
  benefits?: string[]
  variants?: Variants
}

export function DataTableRowActions({ row }: { row: { original: Product } }) {
  const queryClient = useQueryClient()
  const product = row.original

  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [formData, setFormData] = useState<Product>({
    ...product,
    category: product.category,
    images: product.images || [],
    ingredients: product.ingredients || [],
    benefits: product.benefits || [],
    variants: product.variants || { gm: [], kg: [] },
  })
  const { data: categories = [] } = useProductCategories()

  const [newImage, setNewImage] = useState('')
  const [newIngredient, setNewIngredient] = useState('')
  const [newBenefit, setNewBenefit] = useState('')
  const [newVariant, setNewVariant] = useState<{
    type: 'gm' | 'kg'
    weight: string
    price: string
    discount: string
  }>({
    type: 'gm',
    weight: '',
    price: '',
    discount: '',
  })

  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct()
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct()

  // ✅ Updated Edit Submit Handler
  const handleEditSubmit = () => {
    if (!formData.id && !formData._id) {
      toast.error('Product ID is missing!')
      return
    }

    // ✅ Ensure category is always an ID
    const categoryId =
      typeof formData.category === 'string'
        ? formData.category
        : formData.category?._id || formData.category?.id || ''

    // ✅ Build clean payload (remove _id fields)
    const payload = {
      id: formData.id || formData._id!,
      category: categoryId,
      name: formData.name || '',
      description: formData.description || '',
      isPremium: formData.isPremium ?? false,
      isPopular: formData.isPopular ?? false,
      images: formData.images || [],
      ingredients: formData.ingredients || [],
      benefits: formData.benefits || [],
      variants: {
        gm:
          formData.variants?.gm?.map(({ weight, price, discount }) => ({
            weight,
            price,
            discount: discount || 0,
          })) || [],
        kg:
          formData.variants?.kg?.map(({ weight, price, discount }) => ({
            weight,
            price,
            discount: discount || 0,
          })) || [],
      },
    }

    // console.log('Payload being sent:', payload)

    updateProduct(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] })
        toast.success('Product updated successfully!')
        setEditOpen(false)
      },
      onError: () => toast.error('Failed to update product'),
    })
  }

  // ✅ Delete Handler
  const handleDelete = () => {
    const productId = product.id || product._id
    if (!productId) {
      toast.error('Product ID is missing!')
      return
    }

    deleteProduct(productId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] })
        toast.success('Product deleted successfully!')
        setDeleteConfirm(false)
      },
      onError: () => toast.error('Failed to delete product'),
    })
  }

  return (
    <div className='flex items-center justify-center gap-2'>
      {/* Edit Button */}
      <Button
        variant='ghost'
        size='icon'
        onClick={() => {
          setFormData({
            ...product,
            category: product.category,
            images: product.images || [],
            ingredients: product.ingredients || [],
            benefits: product.benefits || [],
            variants: product.variants || { gm: [], kg: [] },
            isPremium: product.isPremium ?? false,
            isPopular: product.isPopular ?? false,
          })
          setEditOpen(true)
        }}
        className='h-8 w-8'
      >
        <SquarePen className='h-4 w-4 text-blue-600' />
      </Button>

      {/* Delete Button */}
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setDeleteConfirm(true)}
        className='h-8 w-8'
      >
        <Trash className='h-4 w-4 text-red-600' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setDetailsOpen(true)}
        className='h-8 w-8'
      >
        <Eye className='h-4 w-4' />
      </Button>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            {/* Category */}
            <div className='grid gap-2'>
              <Label htmlFor='category'>Category</Label>
              <Select
                value={
                  typeof formData.category === 'string'
                    ? formData.category
                    : formData.category?.id || formData.category?._id || ''
                }
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id='category' className='w-full'>
                  <SelectValue placeholder='Select a category' />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Name */}
            <div>
              <Label>Name</Label>
              <Input
                className='mt-2'
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Input
                className='mt-2'
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Images */}
            <div>
              <Label>Images</Label>
              <div className='mt-2 flex gap-2'>
                <Input
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder='Paste image URL'
                />
                <Button
                  type='button'
                  onClick={() => {
                    if (newImage.trim()) {
                      setFormData({
                        ...formData,
                        images: [...(formData.images || []), newImage.trim()],
                      })
                      setNewImage('')
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className='mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3'>
                {formData.images?.map((img, i) => (
                  <div
                    key={i}
                    className='relative overflow-hidden rounded border'
                  >
                    <img
                      src={img}
                      alt={`Image ${i + 1}`}
                      className='h-24 w-full object-cover'
                    />
                    <Button
                      variant='destructive'
                      size='sm'
                      className='absolute top-1 right-1 h-6 w-6 p-0 text-xs'
                      onClick={() =>
                        setFormData({
                          ...formData,
                          images: formData.images!.filter(
                            (_, idx) => idx !== i
                          ),
                        })
                      }
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <Label>Ingredients</Label>
              <div className='mt-2 flex gap-2'>
                <Input
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  placeholder='Add ingredient'
                />
                <Button
                  type='button'
                  onClick={() => {
                    if (newIngredient.trim()) {
                      setFormData({
                        ...formData,
                        ingredients: [
                          ...(formData.ingredients || []),
                          newIngredient.trim(),
                        ],
                      })
                      setNewIngredient('')
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className='mt-2 flex flex-wrap gap-2'>
                {formData.ingredients?.map((ing, i) => (
                  <span
                    key={i}
                    className='flex items-center gap-1 rounded bg-muted/50 px-2 py-1 text-sm'
                  >
                    {ing}
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          ingredients: formData.ingredients!.filter(
                            (_, idx) => idx !== i
                          ),
                        })
                      }
                      className='text-sm font-bold text-red-500 hover:text-red-700'
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <Label>Benefits</Label>
              <div className='mt-2 flex gap-2'>
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder='Add benefit'
                />
                <Button
                  type='button'
                  onClick={() => {
                    if (newBenefit.trim()) {
                      setFormData({
                        ...formData,
                        benefits: [
                          ...(formData.benefits || []),
                          newBenefit.trim(),
                        ],
                      })
                      setNewBenefit('')
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className='mt-2 flex flex-wrap gap-2'>
                {formData.benefits?.map((ben, i) => (
                  <span
                    key={i}
                    className='flex items-center gap-1 rounded bg-muted/50 px-2 py-1 text-sm'
                  >
                    {ben}
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          benefits: formData.benefits!.filter(
                            (_, idx) => idx !== i
                          ),
                        })
                      }
                      className='text-sm font-bold text-red-500 hover:text-red-700'
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Variants */}
            <div>
              <Label>Variants</Label>
              <div className='mt-2 flex gap-2'>
                <select
                  value={newVariant.type}
                  onChange={(e) =>
                    setNewVariant({
                      ...newVariant,
                      type: e.target.value as 'gm' | 'kg',
                    })
                  }
                  className='rounded border px-2'
                >
                  <option value='gm'>Gram</option>
                  <option value='kg'>Kilogram</option>
                </select>
                <Input
                  placeholder='Weight'
                  value={newVariant.weight}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, weight: e.target.value })
                  }
                />
                <Input
                  placeholder='Price'
                  type='number'
                  value={newVariant.price}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, price: e.target.value })
                  }
                />
                <Input
                  placeholder='Discount'
                  type='number'
                  value={newVariant.discount}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, discount: e.target.value })
                  }
                />
                <Button
                  onClick={() => {
                    if (newVariant.weight && newVariant.price) {
                      setFormData({
                        ...formData,
                        variants: {
                          ...formData.variants!,
                          [newVariant.type]: [
                            ...(formData.variants?.[newVariant.type] || []),
                            {
                              weight: newVariant.weight,
                              price: parseFloat(newVariant.price),
                              discount: parseFloat(newVariant.discount) || 0,
                            },
                          ],
                        },
                      })
                      setNewVariant({
                        type: 'gm',
                        weight: '',
                        price: '',
                        discount: '',
                      })
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className='mt-2'>
                {(['gm', 'kg'] as const).map((type) => (
                  <div key={type} className='mt-2'>
                    <p className='font-medium capitalize'>{type} Variants:</p>
                    {formData.variants?.[type]?.map((v, i) => (
                      <div
                        key={i}
                        className='mt-1 flex items-center justify-between rounded border bg-muted/50 p-2'
                      >
                        <div className='flex items-center gap-3 text-sm'>
                          <span className='font-medium'>
                            {v.weight}{type}
                          </span>
                          {v.discount ? (
                            <>
                              <span className='line-through text-muted-foreground'>₹{v.price}</span>
                              <span className='font-semibold'>₹{v.price - v.discount}</span>
                              <span className='rounded bg-red-600 px-2 pt-0.5 text-xs text-white'>₹{v.discount} OFF</span>
                            </>
                          ) : (
                            <span className='font-semibold'>₹{v.price}</span>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            setFormData({
                              ...formData,
                              variants: {
                                ...formData.variants!,
                                [type]: formData.variants?.[type]?.filter(
                                  (_, idx) => idx !== i
                                ),
                              },
                            })
                          }
                          className='text-sm font-bold text-red-500'
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Switches */}
            <div className='mt-2 flex items-center justify-between rounded-lg border px-3 py-1'>
              <div>
                <Label htmlFor='isPremium' className='text-sm font-medium'>
                  Premium Product
                </Label>
                <p className='text-muted-foreground text-xs'>
                  Mark this product as premium.
                </p>
              </div>
              <Switch
                id='isPremium'
                checked={formData.isPremium ?? false}
                onCheckedChange={(val) =>
                  setFormData({ ...formData, isPremium: val })
                }
              />
            </div>

            <div className='mt-2 flex items-center justify-between rounded-lg border px-3 py-1'>
              <div>
                <Label htmlFor='isPopular' className='text-sm font-medium'>
                  Popular Product
                </Label>
                <p className='text-muted-foreground text-xs'>
                  Mark this product as popular.
                </p>
              </div>
              <Switch
                id='isPopular'
                checked={formData.isPopular ?? false}
                onCheckedChange={(val) =>
                  setFormData({ ...formData, isPopular: val })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isUpdating}>
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
          <p>
            Are you sure you want to delete <strong>{product.name}</strong>?
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*detials dailog*/}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold'>
              {product.name}
            </DialogTitle>
            <p className='mt-1 text-sm text-gray-600'>
              {product.description || 'No description available'}
            </p>
            <div className='mt-2 flex gap-2'>
              {product.isPremium && (
                <span className='rounded bg-yellow-200 px-2 py-0.5 text-xs text-yellow-800'>
                  Premium
                </span>
              )}
              {product.isPopular && (
                <span className='rounded bg-green-200 px-2 py-0.5 text-xs text-green-800'>
                  Popular
                </span>
              )}
            </div>
          </DialogHeader>

          <div className='mt-4 space-y-6'>
            {/* Category */}
            <div>
              <h3 className='font-medium text-gray-800'>Category</h3>
              <p className='mt-1 rounded-md border p-2 text-sm'>
                {typeof product.category === 'string'
                  ? product.category
                  : product.category?.name}
              </p>
            </div>

            {/* Images */}
            {product.images && product.images.length > 0 && (
              <div>
                <h3 className='mb-2 font-medium text-gray-800'>Images</h3>
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                  {product.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Image ${i + 1}`}
                      className='h-28 w-full rounded border object-cover'
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div>
                <h3 className='mb-1 font-medium text-gray-800'>Ingredients</h3>
                <div className='flex flex-wrap gap-2'>
                  {product.ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className='rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700'
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {product.benefits && product.benefits.length > 0 && (
              <div>
                <h3 className='mb-1 font-medium text-gray-800'>Benefits</h3>
                <div className='flex flex-wrap gap-2'>
                  {product.benefits.map((ben, i) => (
                    <span
                      key={i}
                      className='rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700'
                    >
                      {ben}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Variants */}
            {product.variants && (
              <div>
                <h3 className='mb-1 font-medium text-gray-800'>Variants</h3>
                {(['gm', 'kg'] as const).map((type) =>
                  product.variants?.[type]?.length ? (
                    <div key={type} className='mt-2'>
                      <p className='mb-1 font-semibold capitalize'>{type}:</p>
                      <div className='space-y-2'>
                        {product.variants[type]?.map((v, i) => (
                          <div
                            key={i}
                            className='flex items-center justify-between rounded border p-2 text-sm'
                          >
                            <div className='flex items-center gap-3'>
                              <span className='font-medium'>{v.weight}{type}</span>
                              {v.discount ? (
                                <>
                                  <span className='line-through text-muted-foreground'>₹{v.price}</span>
                                  <span className='font-semibold'>₹{v.price - v.discount}</span>
                                  <span className='rounded bg-green-100 px-2 py-0.5 text-xs text-green-700'>₹{v.discount} off</span>
                                </>
                              ) : (
                                <span className='font-semibold'>₹{v.price}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
