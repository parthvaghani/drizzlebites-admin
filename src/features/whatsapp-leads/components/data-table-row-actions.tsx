import { useState } from 'react'
import { Eye, Phone, MessageSquare, Calendar, Globe, User, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useWhatsappLeadById } from '@/hooks/use-whatsapp-leads'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { VariantProps } from 'class-variance-authority'

interface WhatsappLeadRow {
  _id?: string
}

export function DataTableRowActions({ row }: { row: { original: WhatsappLeadRow } }) {
  const [open, setOpen] = useState(false)
  const id = row.original._id || ''
  const { data } = useWhatsappLeadById(id)

  const lead = data

  return (
    <div className='flex items-center justify-center gap-2'>
      <Button variant='ghost' size='icon' onClick={() => setOpen(true)} className='h-8 w-8'>
        <Eye className='h-4 w-4' />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <MessageSquare className='h-5 w-5' />
              WhatsApp Lead Details
            </DialogTitle>
          </DialogHeader>
          {!lead ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground'>Loading...</div>
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Lead Information */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                  <MessageSquare className='h-4 w-4' />
                  Lead Information
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-xs text-muted-foreground'>Page</Label>
                    <div className='font-medium text-sm mt-1'>{lead.page}</div>
                  </div>
                  <div>
                    <Label className='text-xs text-muted-foreground'>Button</Label>
                    <div className='text-sm mt-1'>{lead.button}</div>
                  </div>
                </div>

                <div>
                  <Label className='text-xs text-muted-foreground'>Message</Label>
                  <div className='text-sm mt-1 p-3 bg-muted/50 rounded-md border'>
                    {lead.message}
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-xs text-muted-foreground flex items-center gap-1'>
                      <Phone className='h-3 w-3' />
                      Phone Number
                    </Label>
                    <div className='text-sm mt-1 font-mono'>{lead.phoneNumber}</div>
                  </div>
                  <div>
                    <Label className='text-xs text-muted-foreground'>Status</Label>
                    <div className='mt-1'>
                      {(() => {
                        const status = String(lead.status ?? 'new').toLowerCase()
                        let variant: VariantProps<typeof badgeVariants>['variant'] = 'default'
                        switch (status) {
                          case 'new':
                            variant = 'pending'
                            break
                          case 'contacted':
                            variant = 'reviewed'
                            break
                          case 'closed':
                            variant = 'enable'
                            break
                          case 'spam':
                            variant = 'destructive'
                            break
                          default:
                            variant = 'default'
                        }
                        return <Badge variant={variant}>{status}</Badge>
                      })()}
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-xs text-muted-foreground'>WhatsApp Intent</Label>
                    <div className='mt-1'>
                      <Badge variant={lead.whatsappIntent ? 'enable' : 'destructive'}>
                        {lead.whatsappIntent ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className='text-xs text-muted-foreground'>WhatsApp Sent</Label>
                    <div className='mt-1'>
                      <Badge variant={lead.whatsappSent ? 'enable' : 'destructive'}>
                        {lead.whatsappSent ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Product Information */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                  <Globe className='h-4 w-4' />
                  Product Information
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-xs text-muted-foreground'>Product ID</Label>
                    <div className='text-sm mt-1 font-mono text-xs'>{lead.metadata?.productId || '—'}</div>
                  </div>
                  <div>
                    <Label className='text-xs text-muted-foreground'>Product Name</Label>
                    <div className='text-sm mt-1 font-medium'>{lead.metadata?.productName || '—'}</div>
                  </div>
                </div>
                {lead.metadata?.variant && (
                  <div>
                    <Label className='text-xs text-muted-foreground'>Variant</Label>
                    <div className='text-sm mt-1'>{lead.metadata.variant}</div>
                  </div>
                )}
                {lead.metadata?.discountApplied !== undefined && (
                  <div>
                    <Label className='text-xs text-muted-foreground'>Discount Applied</Label>
                    <div className='text-sm mt-1'>
                      <Badge variant={lead.metadata.discountApplied ? 'enable' : 'destructive'}>
                        {lead.metadata.discountApplied ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Source Information */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                  <Globe className='h-4 w-4' />
                  Source Information
                </div>

                <div>
                  <Label className='text-xs text-muted-foreground'>Source URL</Label>
                  {lead.sourceUrl ? (
                    <a
                      href={lead.sourceUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-sm mt-1 text-primary underline underline-offset-4 hover:text-primary/80 block truncate'
                    >
                      {lead.sourceUrl}
                    </a>
                  ) : (
                    <div className='text-sm mt-1 text-muted-foreground'>—</div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Technical Information */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                  <Monitor className='h-4 w-4' />
                  Technical Information
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-xs text-muted-foreground flex items-center gap-1'>
                      <User className='h-3 w-3' />
                      IP Address
                    </Label>
                    <div className='text-sm mt-1 font-mono'>{lead.ipAddress || '—'}</div>
                  </div>
                  <div>
                    <Label className='text-xs text-muted-foreground flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      Created
                    </Label>
                    <div className='text-sm mt-1'>
                      {lead.createdAt ? new Intl.DateTimeFormat('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(new Date(lead.createdAt)) : '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className='text-xs text-muted-foreground'>Updated</Label>
                  <div className='text-sm mt-1'>
                    {lead.updatedAt ? new Intl.DateTimeFormat('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).format(new Date(lead.updatedAt)) : '—'}
                  </div>
                </div>

                {lead.userAgent && (
                  <div>
                    <Label className='text-xs text-muted-foreground'>User Agent</Label>
                    <div className='text-xs mt-1 text-muted-foreground font-mono bg-muted/50 p-2 rounded border'>
                      {lead.userAgent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


