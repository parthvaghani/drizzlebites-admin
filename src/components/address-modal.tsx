import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Building } from 'lucide-react';

interface Address {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address, phoneNumber: string) => void;
  isLoading?: boolean;
}

export function AddressModal({ isOpen, onClose, onSave, isLoading = false }: AddressModalProps) {
  const [formData, setFormData] = useState<Address & { phoneNumber: string }>({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
    phoneNumber: ''
  });

  const [errors, setErrors] = useState<Partial<Address & { phoneNumber: string }>>({});

  const validateForm = () => {
    const newErrors: Partial<Address & { phoneNumber: string }> = {};

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address Line 1 is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zip.trim()) {
      newErrors.zip = 'ZIP code is required';
    } else if (!/^\d{6}$/.test(formData.zip)) {
      newErrors.zip = 'ZIP code must be 6 digits';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const { phoneNumber, ...address } = formData;
      onSave(address, phoneNumber);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    setFormData({
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zip: '',
      country: 'India',
      phoneNumber: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Customer Address & Contact Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+919876543210"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className={errors.phoneNumber ? 'border-red-500' : ''}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div className="space-y-2">
                  <Label htmlFor="addressLine1" className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Address Line 1 *
                  </Label>
                  <Input
                    id="addressLine1"
                    placeholder="House/Flat No., Building Name, Street"
                    value={formData.addressLine1}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                    className={errors.addressLine1 ? 'border-red-500' : ''}
                  />
                  {errors.addressLine1 && (
                    <p className="text-sm text-red-500">{errors.addressLine1}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id="addressLine2"
                    placeholder="Landmark, Area, Locality"
                    value={formData.addressLine2}
                    onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                  />
                </div>

                {/* City and State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      placeholder="Maharashtra"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className={errors.state ? 'border-red-500' : ''}
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500">{errors.state}</p>
                    )}
                  </div>
                </div>

                {/* ZIP Code and Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input
                      id="zip"
                      placeholder="400001"
                      value={formData.zip}
                      onChange={(e) => handleInputChange('zip', e.target.value)}
                      className={errors.zip ? 'border-red-500' : ''}
                    />
                    {errors.zip && (
                      <p className="text-sm text-red-500">{errors.zip}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Processing...' : 'Place Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
