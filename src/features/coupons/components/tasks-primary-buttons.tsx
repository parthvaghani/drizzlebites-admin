import { IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { useCreateCoupon } from '@/hooks/use-coupons';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserDropdown } from './user-dropDown';

export function CouponsPrimaryButtons() {
  const [openSheet, setOpenSheet] = useState(false);
  const queryClient = useQueryClient();

  const [couponData, setCouponData] = useState({
    couponCode: '',
    description: '',
    termsAndConditions: '',
    startDate: '',
    expiryDate: '',
    level: 'order', // order/product
    minOrderQuantity: 1,
    minCartValue: 0,
    maxDiscountValue: 0,
    type: 'generic', // unique/generic
    userType: '',
    maxUsage: 1,
    maxUsagePerUser: 1,           // Add this
    firstOrderOnly: false,         // Add this
    isActive: true,
    isPOSOnly: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string; }>({});
  const { mutate: createCoupon, isPending } = useCreateCoupon();

  const validate = () => {
    const e: { [key: string]: string; } = {};
    const {
      couponCode,
      description,
      termsAndConditions,
      startDate,
      expiryDate,
      minOrderQuantity,
      minCartValue,
      maxDiscountValue,
      type,
      userType,
      maxUsage,
      maxUsagePerUser,              // Add this
    } = couponData;

    if (!couponCode.trim()) e.couponCode = 'Coupon code is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!termsAndConditions.trim()) e.termsAndConditions = 'Terms & Conditions are required';
    if (!startDate) e.startDate = 'Start date is required';
    if (!expiryDate) e.expiryDate = 'Expiry date is required';
    if (minOrderQuantity <= 0) e.minOrderQuantity = 'Minimum order quantity must be greater than 0';
    if (minCartValue < 0) e.minCartValue = 'Minimum cart value cannot be negative';
    if (maxDiscountValue <= 0) e.maxDiscountValue = 'Enter a valid discount percentage';
    if (!maxUsage || maxUsage <= 0) e.maxUsage = 'Max usage must be greater than 0';
    if (!maxUsagePerUser || maxUsagePerUser <= 0) e.maxUsagePerUser = 'Max usage per user must be greater than 0';  // Add this
    if (type === 'unique' && !userType.trim()) e.userType = 'User Type is required for unique coupons';

    return e;
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCouponData({ ...couponData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error('Please correct all errors before saving.');
      return;
    }

    createCoupon({
      ...couponData,
      userType:
        couponData.type === 'unique'
          ? couponData.userType : undefined,
      minCartValue: Number(couponData.minCartValue),
      maxDiscountValue: Number(couponData.maxDiscountValue),
      minOrderQuantity: Number(couponData.minOrderQuantity),
      maxUsage: Number(couponData.maxUsage),
      couponType: couponData.isPOSOnly ? "pos" : "normal",
    },
      {
        onSuccess: () => {
          toast.success('Coupon created successfully!');
          queryClient.invalidateQueries({ queryKey: ['coupons'] });
          setCouponData({
            couponCode: '',
            description: '',
            termsAndConditions: '',
            startDate: '',
            expiryDate: '',
            level: 'order',
            minOrderQuantity: 1,
            minCartValue: 0,
            maxDiscountValue: 0,
            type: 'generic',
            userType: '',
            maxUsage: 1,
            maxUsagePerUser: 1,           // Add this
            firstOrderOnly: false,         // Add this
            isActive: true,
            isPOSOnly: false,
          });
          setOpenSheet(false);
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to create coupon'),
      }
    );
  };

  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpenSheet(true)}>
        <span>Create Coupon</span> <IconPlus size={18} />
      </Button>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-lg px-4 max-h-screen overflow-y-auto">
          <SheetHeader className='px-0'>
            <SheetTitle className="text-xl font-semibold">Create New Coupon</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Fill out the details below to add a new coupon.
            </p>
          </SheetHeader>

          <div className="space-y-5  mx-2">
            {/* Coupon Code */}
            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon Code</Label>
              <Input
                id="couponCode"
                name="couponCode"
                value={couponData.couponCode}
                onChange={handleChange}
                placeholder="e.g. SAVE20"
                required
                aria-invalid={!!errors.couponCode}
              />
              {errors.couponCode && <p className="text-xs text-red-500">{errors.couponCode}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={couponData.description}
                onChange={handleChange}
                placeholder="Short description of the coupon"
                required
                aria-invalid={!!errors.description}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
              <Input
                id="termsAndConditions"
                name="termsAndConditions"
                value={couponData.termsAndConditions}
                onChange={handleChange}
                placeholder="e.g. Applicable on first order only"
                required
                aria-invalid={!!errors.termsAndConditions}
              />
              {errors.termsAndConditions && <p className="text-xs text-red-500">{errors.termsAndConditions}</p>}
            </div>

            {/* Start & Expiry Dates */}
            <div className="space-y-2 flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={couponData.startDate}
                  onChange={handleChange}
                  aria-invalid={!!errors.startDate}
                />
                {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={couponData.expiryDate}
                  onChange={handleChange}
                  aria-invalid={!!errors.expiryDate}
                />
                {errors.expiryDate && <p className="text-xs text-red-500">{errors.expiryDate}</p>}
              </div>
            </div>

            <div className="space-y-2 flex gap-2">
              {/* Min Order Quantity */}
              <div className="space-y-2">
                <Label htmlFor="minOrderQuantity">Minimum Order Quantity</Label>
                <Input
                  type="number"
                  id="minOrderQuantity"
                  name="minOrderQuantity"
                  value={couponData.minOrderQuantity}
                  onChange={handleChange}
                  required
                  aria-invalid={!!errors.minOrderQuantity}
                />
                {errors.minOrderQuantity && <p className="text-xs text-red-500">{errors.minOrderQuantity}</p>}
              </div>

              {/* Min Cart Value */}
              <div className="space-y-2">
                <Label htmlFor="minCartValue">Minimum Cart Value</Label>
                <Input
                  id="minCartValue"
                  name="minCartValue"
                  type="number"
                  value={couponData.minCartValue}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2 flex gap-2">
              {/* Max Discount Value (Percentage) */}
              <div className="space-y-2">
                <Label htmlFor="maxDiscountValue">Discount Percentage</Label>
                <Input
                  id="maxDiscountValue"
                  name="maxDiscountValue"
                  type="number"
                  value={couponData.maxDiscountValue}
                  onChange={handleChange}
                />
              </div>

              {/* Max Usage */}
              <div className="space-y-2">
                <Label htmlFor="maxUsage">Max Usage</Label>
                <Input
                  type="number"
                  id="maxUsage"
                  name="maxUsage"
                  value={couponData.maxUsage}
                  onChange={handleChange}
                  required
                  aria-invalid={!!errors.maxUsage}
                />
                {errors.maxUsage && <p className="text-xs text-red-500">{errors.maxUsage}</p>}
              </div>
            </div>

            <div className="space-y-2 flex gap-2">
              {/* Type Dropdown */}
              <div className="flex-1 space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={couponData.type}
                  onValueChange={(value) => setCouponData({ ...couponData, type: value, level: 'order' })}
                >
                  <SelectTrigger id="type" className='w-full'>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Generic</SelectItem>
                    <SelectItem value="unique">Unique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Level Dropdown (dependent on type) */}
              <div className="flex-1 space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={couponData.level}
                  onValueChange={(value) => setCouponData({ ...couponData, level: value })}
                >
                  <SelectTrigger id="level" className='w-full'>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {couponData.type === 'unique' && (
              <UserDropdown
                value={couponData.userType}
                onChange={(val) => setCouponData({ ...couponData, userType: val })}
                error={errors.userType}
              />
            )}

            {/* Add this new section */}
            <div className="space-y-2">
              <Label htmlFor="maxUsagePerUser">Max Usage Per User</Label>
              <Input
                type="number"
                id="maxUsagePerUser"
                name="maxUsagePerUser"
                value={couponData.maxUsagePerUser}
                onChange={handleChange}
                required
                aria-invalid={!!errors.maxUsagePerUser}
              />
              {errors.maxUsagePerUser && <p className="text-xs text-red-500">{errors.maxUsagePerUser}</p>}
            </div>

            {/* Add this switch after the Type/Level section and before Active Status */}
            <div className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <Label className="text-sm font-medium">First Order Only</Label>
                <p className="text-xs text-muted-foreground">
                  Coupon is only valid for first-time orders.
                </p>
              </div>
              <Switch
                checked={couponData.firstOrderOnly}
                onCheckedChange={(val) =>
                  setCouponData({ ...couponData, firstOrderOnly: val })
                }
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <Label className="text-sm font-medium">Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle to enable or disable the coupon.
                </p>
              </div>
              <Switch
                checked={couponData.isActive}
                onCheckedChange={(val) =>
                  setCouponData({ ...couponData, isActive: val })
                }
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <Label className="text-sm font-medium">POS Only</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle to enable or disable the POS only coupon.
                </p>
              </div>
              <Switch
                checked={couponData.isPOSOnly}
                onCheckedChange={(val) =>
                  setCouponData({ ...couponData, isPOSOnly: val })
                }
              />
            </div>
          </div>

          <SheetFooter className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setOpenSheet(false)} className="w-full">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="w-full">
              {isPending ? 'Saving...' : 'Save Coupon'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
