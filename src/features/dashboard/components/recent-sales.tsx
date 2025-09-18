import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useOrdersList } from '@/hooks/use-orders';
import { getInitials } from '@/lib/utils';
import { useState } from 'react';

function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

// Resolve a country input to ISO alpha-2 code
function getCountryCode(countryInput: string | undefined | null): string | null {
  if (!countryInput) return null;
  const input = countryInput.trim();
  const nameToCode: Record<string, string> = {
    india: 'IN',
    'united states': 'US',
    usa: 'US',
    'united kingdom': 'GB',
    uk: 'GB',
    canada: 'CA',
    australia: 'AU',
    germany: 'DE',
    france: 'FR',
    spain: 'ES',
    italy: 'IT',
    china: 'CN',
    japan: 'JP',
    brazil: 'BR',
    mexico: 'MX',
    singapore: 'SG',
    uae: 'AE',
    'united arab emirates': 'AE',
  };
  const tentativeCode = input.length === 2 ? input.toUpperCase() : nameToCode[input.toLowerCase()];
  if (!tentativeCode || tentativeCode.length !== 2) return null;
  return tentativeCode;
}

// Build a circular SVG flag URL from ISO code using circle-flags
function getCountryFlagUrl(isoAlpha2: string | null): string | null {
  if (!isoAlpha2) return null;
  // Circle flags SVGs
  return `https://hatscripts.github.io/circle-flags/flags/${isoAlpha2.toLowerCase()}.svg`;
}

// Emoji fallback if images are blocked
function getEmojiFlagFromCode(isoAlpha2: string | null): string {
  if (!isoAlpha2) return '';
  const code = isoAlpha2.toUpperCase();
  const A = 0x41;
  const regionalIndicatorOffset = 0x1f1e6;
  const first = code.charCodeAt(0) - A + regionalIndicatorOffset;
  const second = code.charCodeAt(1) - A + regionalIndicatorOffset;
  return String.fromCodePoint(first, second);
}

export function RecentSales() {
  const { data, isLoading } = useOrdersList({ page: 1, limit: 5, status: 'placed', sortBy: 'createdAt:desc' });
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);

  if (isLoading) {
    return <div className='space-y-2 text-sm text-muted-foreground'>Loading recent sales…</div>;
  }

  const orders = data?.results ?? [];

  if (!orders.length) {
    return <div className='text-sm text-muted-foreground'>No recent placed orders.</div>;
  }


  return (
    <div className='space-y-8'>
      {orders.map((order) => {
        const name =
          typeof order.userId === 'object' && order.userId !== null
            ? (order.userId.user_details?.name || order.userId.email || order.phoneNumber || 'Customer')
            : (order.phoneNumber || 'Customer');
        const email =
          typeof order.userId === 'object' && order.userId !== null
            ? (order.userId.email || '')
            : '';

        const products = order.productsDetails || [];
        const base = import.meta.env.VITE_IMAGE_BASE_URL ?? '';
        const firstImage = products[0]?.productId?.images?.[0] as unknown as string | { url: string } | undefined;
        const avatarImageUrlRaw = typeof firstImage === 'string' ? firstImage : firstImage?.url || '';
        const avatarImageUrl = /^https?:\/\//i.test(avatarImageUrlRaw) || !base ? avatarImageUrlRaw : `${base}${avatarImageUrlRaw}`;

        const total = products.reduce((sum, item) => {
          const effectiveUnitPrice = typeof item.discount === 'number' ? (item.pricePerUnit - item.discount) : item.pricePerUnit;
          const lineTotal = Math.max(0, effectiveUnitPrice) * (item.totalUnit ?? 1);
          return sum + lineTotal;
        }, 0);

        let createdAt = order.createdAt;
        try {
          createdAt = new Date(order.createdAt).toLocaleString();
        } catch {
          createdAt = order.createdAt;
        }

        const addressLine = [
          order.address?.city,
          order.address?.state,
          order.address?.zip,
        ].filter(Boolean).join(', ');
        const country = order.address?.country;
        const countryCode = getCountryCode(country);
        const countryFlagUrl = getCountryFlagUrl(countryCode);
        const countryFlagEmoji = getEmojiFlagFromCode(countryCode);

        return (
          <Popover key={order._id} open={hoveredOrderId === order._id}>
            <PopoverTrigger asChild>
              <div
                className='flex items-center gap-4 rounded-md transition-colors hover:bg-muted p-2 mb-1 bg-muted/40'
                onMouseEnter={() => setHoveredOrderId(order._id)}
                onMouseLeave={() => setHoveredOrderId((prev) => (prev === order._id ? null : prev))}
              >
                <Avatar className='h-9 w-9'>
                  <AvatarImage src={avatarImageUrl} alt='Product image' />
                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className='flex flex-1 flex-wrap items-center justify-between'>
                  <div className='space-y-1'>
                    <p className='text-sm leading-none font-medium'>{name}</p>
                    {email ? (
                      <p className='text-muted-foreground text-sm'>{email}</p>
                    ) : null}
                    {(addressLine || country) ? (
                      <p className='text-muted-foreground text-xs flex items-center gap-1'>
                        {addressLine}
                        {country ? (
                          <span className='inline-flex items-center gap-1'>
                            {addressLine ? '•' : null}
                            {countryFlagUrl ? (
                              <img src={countryFlagUrl} alt={countryCode || country} className='h-4 w-4 rounded-full object-cover' />
                            ) : (
                              <span>{countryFlagEmoji || '🌐'}</span>
                            )}
                            {/* <span>{country}</span> */}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                  <div className='font-medium'>+{formatCurrency(total)}</div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent align='end' sideOffset={8} className='w-96 p-3'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium'>Order #{order._id.slice(-6)}</p>
                  <p className='text-xs text-muted-foreground'>{createdAt}</p>
                </div>
                <div className='max-h-60 space-y-2 overflow-auto pr-1'>
                  {products.map((p) => {
                    const effectiveUnitPrice = typeof p.discount === 'number' ? (p.pricePerUnit - p.discount) : p.pricePerUnit;
                    const lineTotal = Math.max(0, effectiveUnitPrice) * (p.totalUnit ?? 1);
                    const raw = p.productId?.images?.[0] as unknown as string | { url: string } | undefined;
                    const img = typeof raw === 'string' ? raw : raw?.url || '';
                    const imageUrl = /^https?:\/\//i.test(img) || !base ? img : `${base}${img}`;
                    return (
                      <div key={p._id} className='flex items-start justify-between gap-3'>
                        <div className='flex min-w-0 items-start gap-2'>
                          <Avatar className='h-8 w-8 rounded-md'>
                            <AvatarImage src={imageUrl} alt={p.productId?.name || 'Product'} />
                            <AvatarFallback className='text-[10px]'>Img</AvatarFallback>
                          </Avatar>
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-medium'>{p.productId?.name ?? 'Product'}</p>
                            <p className='text-xs text-muted-foreground'>Qty: {p.totalUnit ?? 1} • Unit: {formatCurrency(effectiveUnitPrice)}</p>
                          </div>
                        </div>
                        <p className='shrink-0 text-sm font-medium'>{formatCurrency(lineTotal)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className='border-t pt-2'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>Subtotal</p>
                    <p className='text-sm font-medium'>{formatCurrency(total)}</p>
                  </div>
                  {order.shippingCharge ? (
                    <div className='flex items-center justify-between'>
                      <p className='text-sm text-muted-foreground'>Shipping</p>
                      <p className='text-sm font-medium'>{formatCurrency(order.shippingCharge)}</p>
                    </div>
                  ) : null}
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-semibold'>Total</p>
                    <p className='text-sm font-semibold'>
                      {formatCurrency(total + (order.shippingCharge ?? 0))}
                    </p>
                  </div>
                </div>
                {order.address ? (
                  <div className='border-t pt-2'>
                    <p className='text-xs text-muted-foreground'>
                      {[
                        order.address.addressLine1,
                        order.address.addressLine2,
                        order.address.city,
                        order.address.state,
                        order.address.zip,
                        order.address.country,
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
