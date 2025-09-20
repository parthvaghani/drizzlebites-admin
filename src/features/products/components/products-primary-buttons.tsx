import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// import { IconDownload } from '@tabler/icons-react'
import { IconPlus } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useProductCategories } from '@/hooks/use-categories';
import { useCreateProduct } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';

export function ProductsPrimaryButtons() {
  const [openSheet, setOpenSheet] = useState(false);
  const queryClient = useQueryClient();

  const [productData, setProductData] = useState({
    category: '',
    name: '',
    description: '',
    images: [] as string[],
    ingredients: [] as string[],
    benefits: [] as string[],
    isPremium: false,
    isPopular: false,
    variants: {
      gm: [] as { weight: string; price: number; discount: number; }[],
      kg: [] as { weight: string; price: number; discount: number; }[],
    },
  });

  // Temporary local states for adding
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [ingredientsError, setIngredientsError] = useState<string | null>(null);
  const [benefitsError, setBenefitsError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [variantsError, setVariantsError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [variantType, setVariantType] = useState<'gm' | 'kg'>('gm');
  const [variantWeight, setVariantWeight] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantDiscount, setVariantDiscount] = useState('');
  const { data: categories = [] } = useProductCategories();

  const { mutate: createProduct, isPending } = useCreateProduct();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductData({ ...productData, [name]: value });
    if (name === 'name') {
      setNameError(value.trim() ? null : 'Please enter a product name.');
    }
    if (name === 'description') {
      setDescriptionError(value.trim() ? null : 'Please enter a product description.');
    }
  };

  const handleImagesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 5 - imageFiles.length;
    const acceptedMimePrefix = 'image/';
    const maxFileSizeBytes = 2 * 1024 * 1024; // 2MB per image
    const filtered = files.filter((file) => {
      if (!file.type.startsWith(acceptedMimePrefix)) {
        toast.warning(`${file.name} is not an image and was ignored.`);
        return false;
      }
      if (file.size > maxFileSizeBytes) {
        toast.warning(`${file.name} exceeds 2MB and was ignored.`);
        return false;
      }
      return true;
    });
    const toAdd = filtered.slice(0, Math.max(0, remainingSlots));

    if (files.length > remainingSlots) {
      toast.warning('You can upload a maximum of 5 images. Extra files ignored.');
    }

    if (toAdd.length === 0) return;

    setImageFiles((prev) => {
      const updated = [...prev, ...toAdd];
      if (updated.length > 0) setImagesError(null);
      return updated;
    });
    const newPreviews = toAdd.map((file) => URL.createObjectURL(file));
    setProductData((prev) => ({ ...prev, images: [...prev.images, ...newPreviews] }));
  };

  const handleRemoveImage = (index: number) => {
    const urlToRevoke = productData.images[index];
    if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    const updatedPreviews = productData.images.filter((_, i) => i !== index);
    setProductData((prev) => ({ ...prev, images: updatedPreviews }));
    if (updatedFiles.length === 0) setImagesError('Please upload at least one image.');
  };

  const handleAddIngredient = () => {
    const value = ingredientInput.trim();
    if (value) {
      const isDuplicate = productData.ingredients.some((i) => i.toLowerCase() === value.toLowerCase());
      if (isDuplicate) {
        setIngredientsError('This ingredient has already been added.');
        return;
      }
      setProductData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, value],
      }));
      setIngredientInput('');
      setIngredientsError(null);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setProductData((prev) => {
      const updated = prev.ingredients.filter((_, i) => i !== index);
      if (updated.length < 2) setIngredientsError('Please add at least two ingredients.');
      return { ...prev, ingredients: updated };
    });
  };

  const handleAddBenefit = () => {
    const value = benefitInput.trim();
    if (value) {
      const isDuplicate = productData.benefits.some((b) => b.toLowerCase() === value.toLowerCase());
      if (isDuplicate) {
        setBenefitsError('This benefit has already been added.');
        return;
      }
      setProductData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, value],
      }));
      setBenefitInput('');
      setBenefitsError(null);
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setProductData((prev) => {
      const updated = prev.benefits.filter((_, i) => i !== index);
      if (updated.length < 2) setBenefitsError('Please add at least two benefits.');
      return { ...prev, benefits: updated };
    });
  };

  const handleAddVariant = () => {
    const weightTrimmed = variantWeight.trim();
    if (!weightTrimmed || !variantPrice) {
      setVariantsError('Please enter both weight and price for the variant.');
      return;
    }
    const price = parseFloat(variantPrice);
    const discount = parseFloat(variantDiscount) || 0;
    if (Number.isNaN(price) || price <= 0) {
      setVariantsError('Price must be a number greater than 0.');
      return;
    }
    if (discount < 0 || discount >= price) {
      setVariantsError('Discount must be >= 0 and less than price.');
      return;
    }
    // Prevent duplicate weight within the same type
    const isDuplicate = productData.variants[variantType].some((v) => v.weight === weightTrimmed);
    if (isDuplicate) {
      setVariantsError('This variant already exists for the selected unit.');
      return;
    }
    setProductData((prev) => ({
      ...prev,
      variants: {
        ...prev.variants,
        [variantType]: [
          ...prev.variants[variantType],
          {
            weight: weightTrimmed,
            price,
            discount,
          },
        ],
      },
    }));
    setVariantWeight('');
    setVariantPrice('');
    setVariantDiscount('');
    setVariantsError(null);
  };

  const handleRemoveVariant = (type: 'gm' | 'kg', index: number) => {
    setProductData((prev) => {
      const updatedOfType = prev.variants[type].filter((_, i) => i !== index);
      const updatedVariants = { ...prev.variants, [type]: updatedOfType } as typeof prev.variants;
      const totalCount = updatedVariants.gm.length + updatedVariants.kg.length;
      if (totalCount > 0) setVariantsError(null);
      return { ...prev, variants: updatedVariants };
    });
  };

  const handleSubmit = () => {
    // Validate required arrays
    let hasError = false;
    setIngredientsError(null);
    setBenefitsError(null);
    setCategoryError(null);
    setVariantsError(null);
    setNameError(null);
    setDescriptionError(null);
    setImagesError(null);

    if (!productData.category) {
      setCategoryError('Please select a category.');
      hasError = true;
    }
    if (!productData.name.trim()) {
      setNameError('Please enter a product name.');
      hasError = true;
    }
    if (!productData.description.trim()) {
      setDescriptionError('Please enter a product description.');
      hasError = true;
    }
    if (imageFiles.length === 0) {
      setImagesError('Please upload at least one image.');
      hasError = true;
    }
    if (productData.ingredients.length < 2) {
      setIngredientsError('Please add at least two ingredients.');
      hasError = true;
    }
    if (productData.benefits.length < 2) {
      setBenefitsError('Please add at least two benefits.');
      hasError = true;
    }

    const totalVariants = productData.variants.gm.length + productData.variants.kg.length;
    if (totalVariants === 0) {
      setVariantsError('Please add at least one variant.');
      hasError = true;
    }

    if (hasError) {
      toast.error('Please fill all details before saving.');
      return;
    }

    // Build FormData to match backend expectations
    const form = new FormData();
    form.append('category', productData.category);
    form.append('name', productData.name);
    if (productData.description) form.append('description', productData.description);
    form.append('isPremium', String(productData.isPremium));
    form.append('isPopular', String(productData.isPopular));

    // Ingredients and benefits as repeated fields
    productData.ingredients.forEach((ing) => form.append('ingredients', ing));
    productData.benefits.forEach((ben) => form.append('benefits', ben));

    // Variants shape: variants[gm][0][weight], etc.
    (['gm', 'kg'] as const).forEach((type) => {
      productData.variants[type].forEach((v, i) => {
        form.append(`variants[${type}][${i}][weight]`, v.weight);
        form.append(`variants[${type}][${i}][price]`, String(v.price));
        form.append(`variants[${type}][${i}][discount]`, String(v.discount || 0));
      });
    });

    // Images: append each file under key 'images'
    imageFiles.forEach((file) => form.append('images', file));

    createProduct(form, {
      onSuccess: () => {
        toast.success('Product created successfully!');
        queryClient.invalidateQueries({ queryKey: ['products'] });
        setProductData({
          category: '',
          name: '',
          description: '',
          images: [],
          ingredients: [],
          benefits: [],
          isPremium: false,
          isPopular: false,
          variants: { gm: [], kg: [] },
        });
        setImageFiles([]);
        setOpenSheet(false);
      },
      onError: (error: Error) => {
        toast.error(error?.message || 'Failed to create product');
      },
    });
  };

  return (
    <div className='flex flex-col gap-2 sm:flex-row'>
      {/* <Button variant='outline' className='space-x-1'>
        <span>Import</span> <IconDownload size={18} />
      </Button> */}

      <Button className='space-x-1' onClick={() => setOpenSheet(true)}>
        <span>Create Product</span> <IconPlus size={18} />
      </Button>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className='p-0 w-full sm:max-w-2xl lg:max-w-3xl'>
          <div className='max-h-[calc(100vh-100px)] overflow-y-auto p-6'>
            <SheetHeader className='p-0'>
              <SheetTitle className='-pl-6 text-xl font-semibold'>
                Create New Product
              </SheetTitle>
              <p className='text-muted-foreground text-sm'>
                Fill out the details below to add a new product.
              </p>
            </SheetHeader>

            <div className='mt-6 space-y-5'>
              {/* Category */}
              <div className='grid gap-2'>
                <Label htmlFor='category'>Category*</Label>
                <Select
                  value={productData.category}
                  onValueChange={(value) => {
                    setProductData((prev) => ({ ...prev, category: value }));
                    setCategoryError(null);
                  }}
                >
                  <SelectTrigger id='category' className='w-full' aria-invalid={!!categoryError}>
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
                {categoryError ? (
                  <p className='text-red-500 text-xs'>{categoryError}</p>
                ) : null}
              </div>

              {/* Name */}
              <div className='space-y-2'>
                <Label htmlFor='name'>Name *</Label>
                <Input
                  id='name'
                  name='name'
                  value={productData.name}
                  onChange={handleChange}
                  required
                  aria-invalid={!!nameError}
                />
                {nameError ? (
                  <p className='text-red-500 text-xs'>{nameError}</p>
                ) : null}
              </div>

              {/* Description */}
              <div className='space-y-2'>
                <Label htmlFor='description'>Description*</Label>
                <Input
                  id='description'
                  name='description'
                  value={productData.description}
                  onChange={handleChange}
                  required
                  aria-invalid={!!descriptionError}
                />
                {descriptionError ? (
                  <p className='text-red-500 text-xs'>{descriptionError}</p>
                ) : null}
              </div>

              {/* Images */}
              <div className='space-y-2'>
                <Label>Images*</Label>
                <Input
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={handleImagesSelected}
                  disabled={imageFiles.length >= 5}
                  required
                  aria-invalid={!!imagesError}
                />
                <p className='text-muted-foreground text-xs'>
                  {imageFiles.length}/5 selected
                </p>
                {imagesError ? (
                  <p className='text-red-500 text-xs'>{imagesError}</p>
                ) : null}
                <div className='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                  {productData.images.map((img, i) => (
                    <div
                      key={i}
                      className='relative overflow-hidden rounded border'
                    >
                      <img
                        src={img}
                        alt={`Image ${i + 1}`}
                        className='h-32 w-full object-cover sm:h-24'
                      />
                      <Button
                        variant='destructive'
                        size='sm'
                        className='absolute top-1 right-1 h-6 w-6 p-0 text-xs'
                        onClick={() => handleRemoveImage(i)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div className='space-y-2'>
                <Label>Ingredients*</Label>
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <Input
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    placeholder='Add ingredient'
                    className='flex-1'
                  />
                  <Button type='button' onClick={handleAddIngredient} className='w-full sm:w-auto'>
                    Add
                  </Button>
                </div>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {productData.ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className='flex items-center gap-1 rounded bg-muted/50 px-2 py-1 text-sm'
                    >
                      {ing}
                      <button
                        onClick={() => handleRemoveIngredient(i)}
                        className='text-sm font-bold text-red-500 hover:text-red-700'
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                {ingredientsError ? (
                  <p className='text-red-500 text-xs'>{ingredientsError}</p>
                ) : null}
              </div>

              {/* Benefits */}
              <div className='space-y-2'>
                <Label>Benefits*</Label>
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <Input
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    placeholder='Add benefit'
                    className='flex-1'
                  />
                  <Button type='button' onClick={handleAddBenefit} className='w-full sm:w-auto'>
                    Add
                  </Button>
                </div>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {productData.benefits.map((ben, i) => (
                    <span
                      key={i}
                      className='flex items-center gap-1 rounded bg-muted/50 px-2 py-1 text-sm'
                    >
                      {ben}
                      <button
                        onClick={() => handleRemoveBenefit(i)}
                        className='text-sm font-bold text-red-500 hover:text-red-700'
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                {benefitsError ? (
                  <p className='text-red-500 text-xs'>{benefitsError}</p>
                ) : null}
              </div>

              {/* Variants */}
              <div className='space-y-2'>
                <Label>Variants</Label>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5'>
                  <select
                    value={variantType}
                    onChange={(e) =>
                      setVariantType(e.target.value as 'gm' | 'kg')
                    }
                    className='rounded border px-2 py-2 text-sm'
                  >
                    <option value='gm'>Gram</option>
                    <option value='kg'>Kilogram</option>
                  </select>
                  <Input
                    placeholder='Weight'
                    value={variantWeight}
                    onChange={(e) => setVariantWeight(e.target.value)}
                    className='sm:col-span-1'
                  />
                  <Input
                    placeholder='Price'
                    type='number'
                    value={variantPrice}
                    onChange={(e) => setVariantPrice(e.target.value)}
                    className='sm:col-span-1'
                  />
                  <Input
                    placeholder='Discount'
                    type='number'
                    value={variantDiscount}
                    onChange={(e) => setVariantDiscount(e.target.value)}
                    className='sm:col-span-1'
                  />
                  <Button onClick={handleAddVariant} className='w-full sm:col-span-1'>
                    Add
                  </Button>
                </div>
                {productData.variants.gm.length > 0 || productData.variants.kg.length > 0 ? (
                  <div className='mt-2'>
                    {(['gm', 'kg'] as const).map((type) => (
                      <div key={type} className='mt-2'>
                        <p className='font-medium capitalize'>
                          {type} Variants:
                        </p>
                        {productData.variants[type].map((v, i) => (
                          <div
                            key={i}
                            className='mt-1 flex flex-col gap-2 rounded border bg-muted/50 p-2 sm:flex-row sm:items-center sm:justify-between'
                          >
                            <div className='flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3'>
                              <span className='font-medium'>
                                {v.weight}
                                {type}
                              </span>
                              {v.discount ? (
                                <div className='flex flex-wrap items-center gap-2'>
                                  <span className='line-through text-muted-foreground'>₹{v.price}</span>
                                  <span className='font-semibold'>₹{v.price - v.discount}</span>
                                  <span className='rounded bg-red-600 px-2 pt-0.5 text-xs text-white'>₹{v.discount} OFF</span>
                                </div>
                              ) : (
                                <span className='font-semibold'>₹{v.price}</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveVariant(type, i)}
                              className='self-start text-sm font-bold text-red-500 sm:self-auto'
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
                {variantsError ? (
                  <p className='text-red-500 text-xs'>{variantsError}</p>
                ) : null}
              </div>

              {/* Switches */}
              <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
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
                  checked={productData.isPremium}
                  onCheckedChange={(val) =>
                    setProductData({ ...productData, isPremium: val })
                  }
                />
              </div>

              <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
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
                  checked={productData.isPopular}
                  onCheckedChange={(val) =>
                    setProductData({ ...productData, isPopular: val })
                  }
                />
              </div>
            </div>

            <SheetFooter className='mt-6 flex flex-col gap-2 sm:flex-row'>
              <Button
                variant='outline'
                onClick={() => setOpenSheet(false)}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className='w-full sm:w-auto'
              >
                {isPending ? 'Saving...' : 'Save Product'}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
