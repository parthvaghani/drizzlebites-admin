import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SquarePen, Trash, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useProductCategories } from '@/hooks/use-categories';
import { useUpdateProduct, useDeleteProduct } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Variant {
    weight: string;
    price: number;
    discount?: number;
}

interface Variants {
    gm?: Variant[];
    kg?: Variant[];
}

interface Category {
    _id?: string;
    id?: string;
    name?: string;
}

interface Product {
    _id?: string;
    id?: string;
    category?: Category | string;
    name?: string;
    description?: string;
    product_slug?: string;
    isPremium?: boolean;
    isPopular?: boolean;
    images?: string[];
    ingredients?: string[];
    benefits?: string[];
    variants?: Variants;
}

export function DataTableRowActions({ row }: { row: { original: Product; }; }) {
    const queryClient = useQueryClient();
    const product = row.original;

    const [editOpen, setEditOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [formData, setFormData] = useState<Product>({
        ...product,
        category: product.category,
        images: product.images || [],
        ingredients: product.ingredients || [],
        benefits: product.benefits || [],
        variants: product.variants || { gm: [], kg: [] },
    });
    const { data: categories = [] } = useProductCategories();

    const [newIngredient, setNewIngredient] = useState('');
    const [newBenefit, setNewBenefit] = useState('');
    const [formErrors, setFormErrors] = useState<{
        category?: string;
        name?: string;
        images?: string;
        variants?: string;
    }>({});
    const [newVariant, setNewVariant] = useState<{
        type: 'gm' | 'kg';
        weight: string;
        price: string;
        discount: string;
    }>({
        type: 'gm',
        weight: '',
        price: '',
        discount: '',
    });

    const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
    const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

    // Local state for new image files (max 5)
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const MAX_IMAGES = 5;
    const MAX_IMAGE_SIZE_MB = 2; // per file
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    const buildImageUrl = (value: unknown): string => {
        const base = import.meta.env.VITE_IMAGE_BASE_URL as string;
        if (typeof value === 'string') return `${base}${value}`;
        if (value && typeof value === 'object') {
            const v = value as Record<string, unknown>;
            const candidate = (v.url ?? v.src ?? v.path);
            if (typeof candidate === 'string') return `${base}${candidate}`;
        }
        return '';
    };

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const remainingSlots = MAX_IMAGES - (formData.images?.length || 0) - newImageFiles.length;
        if (remainingSlots <= 0) {
            const msg = `You can upload a maximum of ${MAX_IMAGES} images`;
            setFormErrors((er) => ({ ...er, images: msg }));
            toast.error(msg);
            return;
        }

        const accepted: File[] = [];
        const rejectedMessages: string[] = [];
        for (const file of files) {
            if (accepted.length >= remainingSlots) break;
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                rejectedMessages.push(`${file.name}: unsupported type`);
                continue;
            }
            const sizeMb = file.size / (1024 * 1024);
            if (sizeMb > MAX_IMAGE_SIZE_MB) {
                rejectedMessages.push(`${file.name}: larger than ${MAX_IMAGE_SIZE_MB}MB`);
                continue;
            }
            accepted.push(file);
        }
        if (rejectedMessages.length) {
            const msg = `Some files were rejected: ${rejectedMessages.join(', ')}`;
            setFormErrors((er) => ({ ...er, images: msg }));
            toast.error(msg);
        } else {
            setFormErrors((er) => ({ ...er, images: undefined }));
        }
        if (accepted.length) {
            setNewImageFiles((prev) => [...prev, ...accepted]);
        }
    };

    const removePendingFile = (index: number) => {
        setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
        setTimeout(() => validateForm(), 0);
    };

    const isValidObjectId = (val: string) => /^[a-fA-F0-9]{24}$/.test(val);

    const validateForm = (): boolean => {
        const errors: typeof formErrors = {};
        const categoryId =
            typeof formData.category === 'string'
                ? formData.category
                : formData.category?._id || formData.category?.id || '';

        if (!categoryId) {
            errors.category = 'Category is required';
        } else if (!isValidObjectId(categoryId)) {
            errors.category = 'Invalid category selection';
        }

        if (!formData.name || !formData.name.trim()) {
            errors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }

        const totalImages = (formData.images?.length || 0) + newImageFiles.length;
        if (totalImages > 5) {
            errors.images = 'You can upload a maximum of 5 images';
        }

        // Validate variants: non-empty weight, non-negative price/discount, unique weight per type
        const variantErrors: string[] = [];
        (['gm', 'kg'] as const).forEach((type) => {
            const list = formData.variants?.[type] || [];
            const seen = new Set<string>();
            for (const v of list) {
                const weightKey = String(v.weight || '').trim().toLowerCase();
                if (!weightKey) {
                    variantErrors.push(`${type}: weight is required`);
                }
                if (seen.has(weightKey)) {
                    variantErrors.push(`${type}: duplicate weight '${v.weight}'`);
                } else if (weightKey) {
                    seen.add(weightKey);
                }
                const priceNum = Number(v.price);
                const discountNum = Number(v.discount || 0);
                if (!(priceNum >= 0)) {
                    variantErrors.push(`${type}: price must be >= 0`);
                }
                if (!(discountNum >= 0)) {
                    variantErrors.push(`${type}: discount must be >= 0`);
                }
                if (discountNum > priceNum) {
                    variantErrors.push(`${type}: discount cannot exceed price`);
                }
            }
        });
        if (variantErrors.length) {
            errors.variants = variantErrors.join(' • ');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ✅ Updated Edit Submit Handler
    const handleEditSubmit = () => {
        if (!formData.id && !formData._id) {
            toast.error('Product ID is missing!');
            return;
        }

        // Validate all fields before submit
        const ok = validateForm();
        if (!ok) {
            toast.error('Please fix validation errors');
            return;
        }

        // ✅ Ensure category is always an ID
        const categoryId =
            typeof formData.category === 'string'
                ? formData.category
                : formData.category?._id || formData.category?.id || '';
        // Enforce max 5 total images (existing + new files)
        const existingCount = formData.images?.length || 0;
        if (existingCount + newImageFiles.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        // Compute imagesToRemove by diffing original images vs current state
        const originalImages = product.images || [];
        const currentImages = formData.images || [];
        // Normalize to storage keys like "products/..." if full URLs are present
        const toStorageKey = (value: unknown) => {
            // Handle common object shapes first
            if (value && typeof value === 'object') {
                const v = value as Record<string, unknown>;
                const candidate = v.key || v.path || v.url || v.src;
                if (typeof candidate === 'string') value = candidate;
            }
            if (typeof value !== 'string') return '';
            try {
                const url = new URL(value);
                const idx = url.pathname.indexOf('/products/');
                if (idx >= 0) return url.pathname.slice(idx + 1); // drop leading '/'
                return value;
            } catch {
                const i = value.indexOf('products/');
                return i >= 0 ? value.slice(i) : value;
            }
        };

        // Helper to normalize image for comparison
        const normalizeForComparison = (img: unknown): string => {
            if (typeof img === 'string') return img;
            if (img && typeof img === 'object') {
                const v = img as Record<string, unknown>;
                return String(v.key || v.path || v.url || v.src || '');
            }
            return String(img || '');
        };

        // Check if images have changed by comparing arrays
        const normalizedOriginal = originalImages.map(normalizeForComparison).sort();
        const normalizedCurrent = currentImages.map(normalizeForComparison).sort();
        const imagesChanged =
            normalizedOriginal.length !== normalizedCurrent.length ||
            normalizedOriginal.some((img, idx) => img !== normalizedCurrent[idx]) ||
            newImageFiles.length > 0;

        // Find images to remove by comparing normalized values
        const normalizedCurrentSet = new Set(normalizedCurrent);
        const imagesToRemove = originalImages
            .filter((img) => {
                const normalized = normalizeForComparison(img);
                return !normalizedCurrentSet.has(normalized);
            })
            .map((img) => toStorageKey(img))
            .filter((s): s is string => typeof s === 'string' && s.length > 0);

        // If new files or images to remove exist, let the hook build FormData
        if (newImageFiles.length > 0 || imagesToRemove.length > 0) {
            const multipartPayload: {
                id: string;
                files: File[];
                imagesToRemove: string[];
                category?: string;
                name: string;
                description?: string;
                isPremium: boolean;
                isPopular: boolean;
                ingredients: string[];
                benefits: string[];
                product_slug: string;
                variants: {
                    gm: Array<{ weight: string; price: number; discount: number }>;
                    kg: Array<{ weight: string; price: number; discount: number }>;
                };
            } = {
                id: String(formData.id || formData._id!),
                files: newImageFiles,
                imagesToRemove,
                // include fields to update alongside images
                category: isValidObjectId(categoryId) ? categoryId : undefined,
                name: formData.name || '',
                description: formData.description || undefined,
                isPremium: formData.isPremium ?? false,
                isPopular: formData.isPopular ?? false,
                ingredients: formData.ingredients || [],
                benefits: formData.benefits || [],
                product_slug: formData.name?.toLowerCase().replace(/ /g, '-') || '',
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
            };

            updateProduct(
                multipartPayload as unknown as never,
                {
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['products'] });
                        toast.success('Product updated successfully!');
                        setEditOpen(false);
                        setNewImageFiles([]);
                    },
                    onError: () => toast.error('Failed to update product'),
                }
            );
            return;
        }

        // Otherwise, send JSON payload
        const payload: {
            id: string;
            category: string;
            name: string;
            description: string;
            isPremium: boolean;
            isPopular: boolean;
            images?: string[];
            product_slug: string;
            ingredients: string[];
            benefits: string[];
            variants: {
                gm: Array<{ weight: string; price: number; discount: number }>;
                kg: Array<{ weight: string; price: number; discount: number }>;
            };
        } = {
            id: formData.id || formData._id!,
            category: categoryId,
            name: formData.name || '',
            description: formData.description || '',
            isPremium: formData.isPremium ?? false,
            isPopular: formData.isPopular ?? false,
            product_slug: formData.name?.toLowerCase().replace(/ /g, '-') || '',
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
        };

        // Only include images if they have changed
        if (imagesChanged) {
            payload.images = formData.images || [];
        }

        updateProduct(payload as unknown as never, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['products'] });
                toast.success('Product updated successfully!');
                setEditOpen(false);
                setNewImageFiles([]);
            },
            onError: () => toast.error('Failed to update product'),
        });
    };

    // ✅ Delete Handler
    const handleDelete = () => {
        const productId = product.id || product._id;
        if (!productId) {
            toast.error('Product ID is missing!');
            return;
        }

        deleteProduct(productId, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['products'] });
                toast.success('Product deleted successfully!');
                setDeleteConfirm(false);
            },
            onError: () => toast.error('Failed to delete product'),
        });
    };

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
                    });
                    setEditOpen(true);
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
                                onValueChange={(value) => {
                                    setFormData({ ...formData, category: value });
                                    setFormErrors((e) => ({ ...e, category: undefined }));
                                }}
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
                            {formErrors.category && (
                                <p className='text-xs text-red-500 mt-1'>{formErrors.category}</p>
                            )}
                        </div>
                        {/* Name */}
                        <div>
                            <Label>Name</Label>
                            <Input
                                className='mt-2'
                                value={formData.name || ''}
                                onChange={(e) => {
                                    setFormData({ ...formData, name: e.target.value });
                                    if (formErrors.name) {
                                        setFormErrors((er) => ({ ...er, name: undefined }));
                                    }
                                }}
                            />
                            {formErrors.name && (
                                <p className='text-xs text-red-500 mt-1'>{formErrors.name}</p>
                            )}
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

                        {/* Images (File uploads only, max 5) */}
                        <div>
                            <Label>Images</Label>
                            <div className='mt-2 flex flex-col gap-2'>
                                <Input
                                    type='file'
                                    accept='image/*'
                                    multiple
                                    onChange={handleFilesSelected}
                                    disabled={(formData.images?.length || 0) + newImageFiles.length >= 5}
                                />
                                <p className='text-muted-foreground text-xs'>
                                    {(formData.images?.length || 0) + newImageFiles.length}/5 selected
                                </p>
                            </div>

                            <div className='mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3'>
                                {formData.images?.map((img, i) => (
                                    <div
                                        key={`existing-${i}`}
                                        className='relative overflow-hidden rounded border'
                                    >
                                        <img
                                            src={buildImageUrl(img)}
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
                                                    images: formData.images!.filter((_, idx) => idx !== i),
                                                })
                                            }
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                ))}

                                {newImageFiles.map((file, i) => (
                                    <div
                                        key={`file-${i}`}
                                        className='relative overflow-hidden rounded border'
                                    >
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`New file ${i + 1}`}
                                            className='h-24 w-full object-cover'
                                        />
                                        <Button
                                            variant='destructive'
                                            size='sm'
                                            className='absolute top-1 right-1 h-6 w-6 p-0 text-xs'
                                            onClick={() => removePendingFile(i)
                                            }
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            {formErrors.images && (
                                <p className='text-xs text-red-500 mt-1'>{formErrors.images}</p>
                            )}
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
                                            });
                                            setNewIngredient('');
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
                                            });
                                            setNewBenefit('');
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
                                        const weight = newVariant.weight.trim();
                                        const priceNum = Number(newVariant.price);
                                        const discountNum = Number(newVariant.discount || 0);
                                        const list = formData.variants?.[newVariant.type] || [];
                                        const duplicate = list.some(
                                            (v) => String(v.weight).trim().toLowerCase() === weight.toLowerCase()
                                        );
                                        if (!weight) {
                                            toast.error('Variant weight is required');
                                            return;
                                        }
                                        if (!(priceNum >= 0)) {
                                            toast.error('Variant price must be >= 0');
                                            return;
                                        }
                                        if (!(discountNum >= 0)) {
                                            toast.error('Variant discount must be >= 0');
                                            return;
                                        }
                                        if (discountNum > priceNum) {
                                            toast.error('Variant discount cannot exceed price');
                                            return;
                                        }
                                        if (duplicate) {
                                            toast.error('Duplicate weight for this type');
                                            return;
                                        }
                                        setFormData((prev) => {
                                            const updated = {
                                                ...prev,
                                                variants: {
                                                    ...prev.variants!,
                                                    [newVariant.type]: [
                                                        ...(prev.variants?.[newVariant.type] || []),
                                                        {
                                                            weight,
                                                            price: priceNum,
                                                            discount: discountNum || 0,
                                                        },
                                                    ],
                                                },
                                            };
                                            // revalidate variants after update to clear possible errors
                                            setTimeout(() => validateForm(), 0);
                                            return updated;
                                        });
                                        setNewVariant({
                                            type: 'gm',
                                            weight: '',
                                            price: '',
                                            discount: '',
                                        });
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
                                                    onClick={() => {
                                                        setFormData((prev) => {
                                                            const updated = {
                                                                ...prev,
                                                                variants: {
                                                                    ...prev.variants!,
                                                                    [type]: prev.variants?.[type]?.filter(
                                                                        (_, idx) => idx !== i
                                                                    ),
                                                                },
                                                            };
                                                            setTimeout(() => validateForm(), 0);
                                                            return updated;
                                                        });
                                                    }}
                                                    className='text-sm font-bold text-red-500'
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            {formErrors.variants && (
                                <p className='text-xs text-red-500 mt-1'>{formErrors.variants}</p>
                            )}
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

                        {/* Product Slug */}
                        {product.product_slug && (
                            <div>
                                <h3 className='font-medium text-gray-800'>Product Slug</h3>
                                <p className='mt-1 rounded-md border p-2 text-sm font-mono'>
                                    {product.product_slug}
                                </p>
                            </div>
                        )}

                        {/* Images */}
                        {product.images && product.images.length > 0 && (
                            <div>
                                <h3 className='mb-2 font-medium text-gray-800'>Images</h3>
                                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                                    {product.images.map((img, i) => (
                                        <img
                                            key={i}
                                            src={buildImageUrl(img)}
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
    );
}
