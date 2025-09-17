import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { IconPlus } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { useCreateTestimonial } from '@/hooks/use-testimonials'

export function TestimonialsPrimaryButtons() {
  const [openSheet, setOpenSheet] = useState(false)
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: '',
    body: '',
    img: '',
    location: '',
    visible: true,
  })

  const [errors, setErrors] = useState({
    name: '',
    body: '',
    img: '',
    location: '',
  })

  const isValidUrl = (value: string) => {
    try {
      const url = new URL(value)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const { mutate: createTestimonial, isPending } = useCreateTestimonial()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing valid content
    if (value.trim()) {
      if (name === 'img') {
        if (isValidUrl(value.trim())) {
          setErrors((prev) => ({ ...prev, img: '' }))
        }
      } else {
        setErrors((prev) => ({ ...prev, [name]: '' }))
      }
    }
  }

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    if (!value.trim()) {
      const fieldLabels: Record<string, string> = {
        name: 'Name is required',
        body: 'Testimonial is required',
        location: 'Location is required',
        img: 'Image URL is required',
      }
      setErrors((prev) => ({ ...prev, [name]: fieldLabels[name] || 'This field is required' }))
    } else if (name === 'img' && !isValidUrl(value.trim())) {
      setErrors((prev) => ({ ...prev, img: '"image" must be a valid uri' }))
    }
  }

  const validateFields = () => {
    const newErrors = {
      name: formData.name.trim() ? '' : 'Name is required',
      body: formData.body.trim() ? '' : 'Testimonial is required',
      location: formData.location.trim() ? '' : 'Location is required',
      img: !formData.img.trim()
        ? 'Image URL is required'
        : isValidUrl(formData.img.trim())
        ? ''
        : '"img" must be a valid uri',
    }
    setErrors(newErrors)
    return Object.values(newErrors).every((msg) => !msg)
  }

  const handleSubmit = () => {
    const isValid = validateFields()
    if (!isValid) {
      toast.error('Please fill all details before saving.')
      return
    }

    createTestimonial(
      {
        name: formData.name.trim(),
        body: formData.body.trim(),
        img: formData.img.trim(),
        location: formData.location.trim(),
        visible: formData.visible,
      },
      {
        onSuccess: () => {
          toast.success('Testimonial created successfully!')
          queryClient.invalidateQueries({ queryKey: ['testimonials'] })
          setFormData({ name: '', body: '', img: '', location: '', visible: true })
          setErrors({ name: '', body: '', img: '', location: '' })
          setOpenSheet(false)
        },
        onError: (error: Error) => {
          toast.error(error?.message || 'Failed to create testimonial')
        },
      }
    )
  }

  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpenSheet(true)}>
        <span>Create Testimonial</span> <IconPlus size={18} />
      </Button>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className='p-0 sm:max-w-lg'>
          <div className='max-h-[calc(100vh-100px)] overflow-y-auto p-6'>
            <SheetHeader>
              <SheetTitle className='text-xl font-semibold'>
                Create New Testimonial
              </SheetTitle>
              <p className='text-muted-foreground text-sm'>
                Fill the details below to add a customer testimonial.
              </p>
            </SheetHeader>

            <div className='mt-6 space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='t-name'>Name <span className="text-red-500">*</span></Label>
                <Input
                  id='t-name'
                  name='name'
                  aria-invalid={!!errors.name}
                  className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.name ? (
                  <p className='text-red-500 text-xs'>{errors.name}</p>
                ) : null}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='t-location'>Location <span className="text-red-500">*</span></Label>
                <Input
                  id='t-location'
                  name='location'
                  required
                  aria-invalid={!!errors.location}
                  className={errors.location ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  value={formData.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.location ? (
                  <p className='text-red-500 text-xs'>{errors.location}</p>
                ) : null}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='t-img'>Image URL <span className="text-red-500">*</span></Label>
                <Input
                  id='t-img'
                  name='img'
                  placeholder='https://...'
                  required
                  aria-invalid={!!errors.img}
                  className={errors.img ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  value={formData.img}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.img ? (
                  <p className='text-red-500 text-xs'>{errors.img}</p>
                ) : null}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='t-body'>Testimonial <span className="text-red-500">*</span></Label>
                <Textarea
                  id='t-body'
                  name='body'
                  aria-invalid={!!errors.body}
                  className={errors.body ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  value={formData.body}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows={6}
                />
                {errors.body ? (
                  <p className='text-red-500 text-xs'>{errors.body}</p>
                ) : null}
              </div>

              <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
                <div>
                  <Label htmlFor='t-visible' className='text-sm font-medium'>
                    Visible
                  </Label>
                  <p className='text-muted-foreground text-xs'>
                    Show this testimonial publicly.
                  </p>
                </div>
                <Switch
                  id='t-visible'
                  checked={formData.visible}
                  onCheckedChange={(val) =>
                    setFormData((prev) => ({ ...prev, visible: val }))
                  }
                />
              </div>
            </div>

            <SheetFooter className='mt-6 flex gap-2'>
              <Button
                variant='outline'
                onClick={() => setOpenSheet(false)}
                className='w-full'
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending} className='w-full'>
                {isPending ? 'Saving...' : 'Save Testimonial'}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}


