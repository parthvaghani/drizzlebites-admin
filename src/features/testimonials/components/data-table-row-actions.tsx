import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SquarePen, Trash, Eye } from 'lucide-react'
import { toast } from 'sonner'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  useDeleteTestimonial,
  useTestimonialById,
  useUpdateTestimonial,
} from '@/hooks/use-testimonials'

interface TestimonialRow {
  _id?: string
  id?: string
  name?: string
  body?: string
  img?: string
  location?: string
  visible?: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
}

export function DataTableRowActions({ row }: { row: { original: TestimonialRow } }) {
  const queryClient = useQueryClient()
  const testimonial = row.original

  const testimonialId = testimonial._id || testimonial.id || ''
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const [formData, setFormData] = useState<TestimonialRow>({ ...testimonial })
  const [errors, setErrors] = useState<{
    name?: string
    location?: string
    img?: string
    body?: string
  }>({})

  useEffect(() => {
    setFormData({ ...testimonial })
  }, [testimonial])

  const { data: fetched, isLoading: isFetchingDetails } = useTestimonialById(testimonialId)

  const { mutate: updateTestimonial, isPending: isUpdating } = useUpdateTestimonial()
  const { mutate: deleteTestimonial, isPending: isDeleting } = useDeleteTestimonial()

  const validate = () => {
    const nextErrors: {
      name?: string
      location?: string
      img?: string
      body?: string
    } = {}

    if (!formData.name || !formData.name.trim()) nextErrors.name = 'Name is required.'
    if (!formData.location || !formData.location.trim()) nextErrors.location = 'Location is required.'
    if (!formData.img || !formData.img.trim()) {
      nextErrors.img = 'Image URL is required.'
    } else {
      const candidate = (formData.img || '').trim()
      try {
        const url = new URL(candidate)
        if (!['http:', 'https:'].includes(url.protocol)) {
          nextErrors.img = 'Image URL must start with http or https.'
        }
      } catch {
        nextErrors.img = 'Image URL must be a valid URL.'
      }
    }
    if (!formData.body || !formData.body.trim()) nextErrors.body = 'Testimonial is required.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleEditSubmit = () => {
    if (!testimonialId) {
      toast.error('Testimonial ID is missing!')
      return
    }

    if (!validate()) {
      toast.error('Please fill all details before saving.')
      return
    }

    const payload = {
      id: testimonialId,
      name: (formData.name || '').trim(),
      body: (formData.body || '').trim(),
      img: (formData.img || '').trim(),
      location: (formData.location || '').trim(),
      visible: Boolean(formData.visible),
    }

    updateTestimonial(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['testimonials'] })
        toast.success('Testimonial updated successfully!')
        setEditOpen(false)
      },
      onError: () => toast.error('Failed to update testimonial'),
    })
  }

  const handleDelete = () => {
    if (!testimonialId) {
      toast.error('Testimonial ID is missing!')
      return
    }

    deleteTestimonial(testimonialId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['testimonials'] })
        toast.success('Testimonial deleted successfully!')
        setDeleteConfirm(false)
      },
      onError: () => toast.error('Failed to delete testimonial'),
    })
  }

  return (
    <div className='flex items-center justify-center gap-2'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setEditOpen(true)}
        className='h-8 w-8'
      >
        <SquarePen className='h-4 w-4 text-blue-600' />
      </Button>

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
            <DialogTitle>Edit Testimonial</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='t-name'>Name</Label>
              <Input
                id='t-name'
                className={`mt-2 ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                value={formData.name || ''}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                aria-invalid={Boolean(errors.name)}
                required
              />
              {errors.name ? (
                <p className='mt-1 text-xs text-destructive'>{errors.name}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor='t-location'>Location</Label>
              <Input
                id='t-location'
                className={`mt-2 ${errors.location ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                value={formData.location || ''}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value })
                  if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }))
                }}
                aria-invalid={Boolean(errors.location)}
                required
              />
              {errors.location ? (
                <p className='mt-1 text-xs text-destructive'>{errors.location}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor='t-img'>Image URL</Label>
                <Input
                id='t-img'
                className={`mt-2 ${errors.img ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                value={formData.img || ''}
                onChange={(e) => {
                  setFormData({ ...formData, img: e.target.value })
                  if (errors.img) setErrors((prev) => ({ ...prev, img: undefined }))
                }}
                placeholder='https://...'
                aria-invalid={Boolean(errors.img)}
                required
              />
              {errors.img ? (
                <p className='mt-1 text-xs text-destructive'>{errors.img}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor='t-body'>Testimonial</Label>
              <Textarea
                id='t-body'
                className={`mt-2 ${errors.body ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                value={formData.body || ''}
                onChange={(e) => {
                  setFormData({ ...formData, body: e.target.value })
                  if (errors.body) setErrors((prev) => ({ ...prev, body: undefined }))
                }}
                rows={5}
                aria-invalid={Boolean(errors.body)}
                required
              />
              {errors.body ? (
                <p className='mt-1 text-xs text-destructive'>{errors.body}</p>
              ) : null}
            </div>
            <div className='mt-2 flex items-center justify-between rounded-lg border px-3 py-1'>
              <div>
                <Label htmlFor='t-visible' className='text-sm font-medium'>
                  Visible
                </Label>
                <p className='text-muted-foreground text-xs'>Show on website/app.</p>
              </div>
              <Switch
                id='t-visible'
                checked={Boolean(formData.visible)}
                onCheckedChange={(val) => setFormData({ ...formData, visible: val })}
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
            Are you sure you want to delete <strong>{testimonial.name}</strong>?
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details (Single GET) */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className='max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold'>
              {fetched?.name || testimonial.name}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <Label className='text-xs text-muted-foreground'>Location</Label>
              <div>{fetched?.location ?? testimonial.location ?? '—'}</div>
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Visible</Label>
              <div>{(fetched?.visible ?? testimonial.visible) ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Image</Label>
              {fetched?.img || testimonial.img ? (
                <img
                  src={(fetched?.img || testimonial.img) as string}
                  alt={fetched?.name || testimonial.name}
                  className='mt-1 h-24 w-24 rounded border object-cover'
                />
              ) : (
                <div>—</div>
              )}
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Testimonial</Label>
              <p className='mt-1 text-sm text-muted-foreground'>
                {fetched?.body ?? testimonial.body ?? '—'}
              </p>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label className='text-xs text-muted-foreground'>Created</Label>
              <div>
                  {(() => {
                    const raw = (fetched?.createdAt ?? testimonial.createdAt) as string | Date | undefined
                    if (!raw) return '—'
                    const d = typeof raw === 'string' ? new Date(raw) : raw
                    return new Intl.DateTimeFormat('en-IN', {
                      year: 'numeric', month: 'short', day: '2-digit',
                    }).format(d)
                  })()}
                </div>
              </div>
              <div>
                <Label className='text-xs text-muted-foreground'>Updated</Label>
              <div>
                  {(() => {
                    const raw = (fetched?.updatedAt ?? testimonial.updatedAt) as string | Date | undefined
                    if (!raw) return '—'
                    const d = typeof raw === 'string' ? new Date(raw) : raw
                    return new Intl.DateTimeFormat('en-IN', {
                      year: 'numeric', month: 'short', day: '2-digit',
                    }).format(d)
                  })()}
                      </div>
                    </div>
              </div>
            {isFetchingDetails ? <p className='text-xs text-muted-foreground'>Fetching latest…</p> : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
