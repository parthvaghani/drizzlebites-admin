import { useMemo, useState, useEffect } from 'react';
import { useProductCategoriesList } from '@/hooks/use-categories';
import { useProductsList } from '@/hooks/use-products';
import { useCreatePOSOrder } from '@/hooks/use-orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LogOut, ShoppingCart, User, ChefHat, Cake, Donut, Cookie, Sandwich, Image as ImageIcon, Wheat, Search, X, Menu, X as XIcon, ClipboardList } from 'lucide-react';
import { useLogout } from '@/hooks/use-auth';
import { useNavigate } from '@tanstack/react-router';
import { AddressModal } from '@/components/address-modal';
import { toast } from 'sonner';
import { Coupon, useApplyPOSCoupon, usePOSCoupons } from '@/hooks/use-coupons';
import { useAuthStore } from '@/stores/authStore';

interface Product {
    _id: string;
    name: string;
    description?: string;
    category: string | { _id: string; name: string; };
    variants?: {
        gm?: Array<{ weight: string; price: number; discount?: number; }>;
        kg?: Array<{ weight: string; price: number; discount?: number; }>;
    };
    images?: string[];
    isPremium?: boolean;
    isPopular?: boolean;
}

interface Category {
    _id: string;
    name: string;
    description?: string;
    pricingEnabled?: boolean;
}
interface CouponResponse {
    data?: {
        couponCode: string;
        couponId: string;
        percentage: string;
        discount: number;
    };
}

interface PricingData {
    unitPrice: number;
    unitDiscount: number;
    quantity: number;
}

interface OrderTotals {
    subtotal: number;
    totalDiscount: number;
    grandTotal: number;
}

export default function POSScreen() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<Array<{ product: Product; quantity: number; variant?: { weight: string; price: number; discount?: number; }; }>>([]);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [expandedCoupons, setExpandedCoupons] = useState<Set<string>>(new Set());
    const { data: couponsData, isLoading: couponsLoading } = usePOSCoupons();
    const applyCouponMutation = useApplyPOSCoupon();
    const user = useAuthStore((state) => state.auth.user);
    const fetchUser = useAuthStore((state) => state.auth.fetchUser);
    const [couponResponse, setCouponResponse] = useState<CouponResponse | null>(null);
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

    // Fetch user data on component mount if not already loaded
    useEffect(() => {
        if (!user) {
            fetchUser();
        }
    }, [user, fetchUser]);

    // console.log('couponsData', user)

    const navigate = useNavigate();
    const { mutate: logout } = useLogout();
    const { mutate: createPOSOrder, isPending: isCreatingOrder } = useCreatePOSOrder();

    // Fetch categories
    const { data: categoriesData, isLoading: categoriesLoading } = useProductCategoriesList({
        page: 1,
        limit: 100,
        search: '',
    });

    // Fetch all products (no category filter for now)
    const { data: productsData, isLoading: productsLoading } = useProductsList({
        page: 1,
        limit: 1000,
        search: '',
    });

    const categories: Category[] = categoriesData?.results || [];
    const allProducts = useMemo(() => productsData?.results || [], [productsData?.results]);

    // Group products by category
    const productsByCategory = allProducts.reduce((acc, product) => {
        const categoryId = typeof product.category === 'object'
            ? product.category?._id
            : product.category;

        if (!categoryId) return acc;

        if (!acc[categoryId]) {
            acc[categoryId] = [];
        }
        acc[categoryId].push(product);
        return acc;
    }, {} as Record<string, any[]>); // eslint-disable-line @typescript-eslint/no-explicit-any

    // Get products for selected category or all products
    let products = selectedCategory
        ? productsByCategory[selectedCategory] || []
        : allProducts;

    // Filter products by search query
    if (searchQuery.trim()) {
        products = products.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    const addToCart = (product: Product, variant?: { weight: string; price: number; }) => {
        const existingItem = cart.find(
            item => item.product._id === product._id &&
                (!variant || (item.variant?.weight === variant.weight))
        );

        if (existingItem) {
            setCart(cart.map(item =>
                item === existingItem
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { product, quantity: 1, variant }]);
        }
    };

    const removeFromCart = (productId: string, variantWeight?: string) => {
        setCart(cart.filter(item =>
            !(item.product._id === productId &&
                (!variantWeight || item.variant?.weight === variantWeight))
        ));
    };

    const updateQuantity = (productId: string, quantity: number, variantWeight?: string) => {
        if (quantity <= 0) {
            removeFromCart(productId, variantWeight);
            return;
        }

        setCart(cart.map(item =>
            item.product._id === productId &&
                (!variantWeight || item.variant?.weight === variantWeight)
                ? { ...item, quantity }
                : item
        ));
    };


    const getDiscountedPrice = (item: { product: Product; quantity: number; variant?: { weight: string; price: number; }; }) => {
        if (!item.variant) return 0;

        // Find the original variant to get discount information
        const product = item.product;
        const selectedVariantKey = selectedVariants[product._id];
        if (!selectedVariantKey) return item.variant.price;

        const [type, index] = selectedVariantKey.split('-');
        const variant = type === 'gm'
            ? product.variants?.gm?.[parseInt(index)]
            : product.variants?.kg?.[parseInt(index)];

        if (variant?.discount) {
            return Math.max(0, item.variant.price - variant.discount);
        }

        return item.variant.price;
    };

    const getTotalSavings = () => {
        return cart.reduce((total, item) => {
            const originalPrice = item.variant?.price || 0;
            const discountedPrice = getDiscountedPrice(item);
            const savings = (originalPrice - discountedPrice) * item.quantity;
            return total + savings;
        }, 0);
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => {
            const price = item.variant?.price || 0;
            return total + (price * item.quantity);
        }, 0);
    };

    const getFinalTotal = () => {
        return cart.reduce((total, item) => {
            const discountedPrice = getDiscountedPrice(item);
            return total + (discountedPrice * item.quantity);
        }, 0);
    };

    // Calculate coupon discount
    const getCouponDiscount = () => {
        if (!couponResponse || !appliedCoupon) return 0;

        const subtotal = getFinalTotal();
        const discount = couponResponse.data?.discount ?? 0;

        return Math.min(discount, subtotal); // Don't allow negative totals
    };

    // Remove applied coupon
    const removeAppliedCoupon = () => {
        setAppliedCoupon(null);
        setCouponResponse(null);
        toast.success('Coupon removed successfully!');
    };

    const handleLogout = () => {
        logout();
    };

    const handleBackToAdmin = () => {
        navigate({ to: '/' });
    };

    const handleProcessOrder = () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        setIsAddressModalOpen(true);
    };

    const handleAddressSubmit = (address: { addressLine1: string; addressLine2: string; city: string; state: string; zip: string; }, phoneNumber: string) => {
        const orderPayload = {
            cart: cart.map(item => {
                // If item has a variant, we need to determine the weight variant type
                if (item.variant) {
                    const product = item.product;
                    const variantWeight = item.variant.weight;

                    // Try to find which variant type (gm or kg) contains this weight
                    let type: 'gm' | 'kg' | null = null;
                    let variantData = null;

                    // Check in gm variants
                    if (product.variants?.gm) {
                        variantData = product.variants.gm.find((v: { weight: string; }) => v.weight === variantWeight);
                        if (variantData) {
                            type = 'gm';
                        }
                    }

                    // Check in kg variants if not found in gm
                    if (!type && product.variants?.kg) {
                        variantData = product.variants.kg.find((v: { weight: string; }) => v.weight === variantWeight);
                        if (variantData) {
                            type = 'kg';
                        }
                    }

                    // If we found the variant type, return proper payload
                    if (type && variantData) {
                        return {
                            productId: item.product._id,
                            weightVariant: type,
                            weight: variantWeight,
                            totalProduct: item.quantity,
                            price: variantData?.price || item.variant.price || 0,
                            discount: variantData?.discount || 0,
                        };
                    }

                    // Fallback: use variant data directly if we couldn't find the type
                    return {
                        productId: item.product._id,
                        weightVariant: 'gm', // default
                        weight: variantWeight,
                        totalProduct: item.quantity,
                        price: item.variant.price || 0,
                        discount: item.variant.discount || 0,
                    };
                }

                // Default fallback for products without variants
                return {
                    productId: item.product._id,
                    weightVariant: 'gm',
                    weight: '100',
                    totalProduct: item.quantity,
                    price: 0,
                    discount: 0,
                };
            }),
            address,
            phoneNumber,
            // Include coupon information if applied
            ...(appliedCoupon && couponResponse && {
                couponId: appliedCoupon._id,
                discountAmount: getCouponDiscount(),
                discountPercentage: couponResponse.data?.percentage ?? 0,
            }),
        };

        createPOSOrder(orderPayload, {
            onSuccess: () => {
                toast.success('Order placed successfully!');
                setCart([]);
                setSelectedVariants({});
                setAppliedCoupon(null);
                setCouponResponse(null);
                setIsAddressModalOpen(false);
            },
            onError: (error: unknown) => {
                const errorMessage = error && typeof error === 'object' && 'response' in error &&
                    error.response && typeof error.response === 'object' && 'data' in error.response &&
                    error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
                    ? (error.response.data.message as string)
                    : 'Failed to place order';
                toast.error(errorMessage);
            }
        });
    };

    const getCategoryIcon = (categoryName: string) => {
        const name = categoryName.toLowerCase();
        if (name.includes('bread')) return <Wheat className="w-4 h-4" />;
        if (name.includes('cake')) return <Cake className="w-4 h-4" />;
        if (name.includes('donut')) return <Donut className="w-4 h-4" />;
        if (name.includes('pastry') || name.includes('cookie')) return <Cookie className="w-4 h-4" />;
        if (name.includes('sandwich')) return <Sandwich className="w-4 h-4" />;
        return <ChefHat className="w-4 h-4" />;
    };

    const renderProductCard = (product: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const base = import.meta.env.VITE_IMAGE_BASE_URL ?? '';
        const imageUrl = product.images?.[0]
            ? `${base}${typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as { url: string; })?.url || ''}`
            : '';
        const variants = product.variants;
        const hasVariants = variants && (variants.gm?.length || variants.kg?.length);

        return (
            <Card key={product._id} className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer gap-0 py-0 h-full flex flex-col">
                <CardHeader className="p-0 flex-shrink-0 gap-0">
                    <div className="relative w-full h-20 sm:h-24 md:h-28 lg:h-30 bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg overflow-hidden">
                        {product.images?.[0] ? (
                            <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-200 hover:scale-110"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center ${product.images?.[0] ? 'hidden' : ''}`}>
                            <div className="text-center">
                                <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto text-gray-400 mb-1 sm:mb-2" />
                                <p className="text-xs text-gray-500">No Image</p>
                            </div>
                        </div>
                        {/* Premium/Popular badges overlay */}
                        <div className="absolute top-1 right-1 flex flex-col gap-1">
                            {product.isPremium && (
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                                    Premium
                                </Badge>
                            )}
                            {product.isPopular && (
                                <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">
                                    Popular
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="p-2 sm:p-3">
                        <CardTitle className="text-xs sm:text-sm font-medium line-clamp-2 leading-tight">
                            {product.name}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-2 pt-0 flex-1 flex flex-col justify-end">
                    {hasVariants ? (
                        <div className="space-y-2 w-full">
                            {/* Variant Selection */}
                            <div className="w-full">
                                <Select
                                    value={selectedVariants[product._id] || (() => {
                                        // Auto-select first variant if none selected
                                        if (variants.gm?.length > 0) {
                                            return 'gm-0';
                                        } else if (variants.kg?.length > 0) {
                                            return 'kg-0';
                                        }
                                        return '';
                                    })()}
                                    onValueChange={(value) => {
                                        setSelectedVariants(prev => ({
                                            ...prev,
                                            [product._id]: value
                                        }));
                                    }}
                                >
                                    <SelectTrigger className="w-full h-8 text-xs border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md">
                                        <SelectValue placeholder="Select variant" />
                                    </SelectTrigger>
                                    <SelectContent className="max-w-xs z-50">
                                        {variants.gm?.map((variant: { weight: string; price: number; discount?: number; }, _index: number) => (
                                            <SelectItem
                                                key={`gm-${_index}`}
                                                value={`gm-${_index}`}
                                                className="text-xs cursor-pointer hover:bg-green-50 focus:bg-green-50"
                                            >
                                                <div className="flex items-center justify-between w-full min-w-0">
                                                    <span className="truncate font-medium">{variant.weight}gm</span>
                                                    <span className="text-green-600 ml-2 flex-shrink-0 font-semibold">₹{variant.price}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                        {variants.kg?.map((variant: { weight: string; price: number; discount?: number; }, _index: number) => (
                                            <SelectItem
                                                key={`kg-${_index}`}
                                                value={`kg-${_index}`}
                                                className="text-xs cursor-pointer hover:bg-green-50 focus:bg-green-50"
                                            >
                                                <div className="flex items-center justify-between w-full min-w-0">
                                                    <span className="truncate font-medium">{variant.weight}kg</span>
                                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                                        <span className="text-green-600 font-semibold">₹{variant.price}</span>
                                                        {variant.discount && (
                                                            <span className="text-gray-400 line-through text-xs">₹{variant.price + variant.discount}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Add Button */}
                            <Button
                                size="sm"
                                onClick={() => {
                                    const selectedVariantKey = selectedVariants[product._id] || (() => {
                                        // Auto-select first variant if none selected
                                        if (variants.gm?.length > 0) {
                                            return 'gm-0';
                                        } else if (variants.kg?.length > 0) {
                                            return 'kg-0';
                                        }
                                        return '';
                                    })();

                                    if (selectedVariantKey) {
                                        const [type, index] = selectedVariantKey.split('-');
                                        const variant = type === 'gm'
                                            ? variants.gm?.[parseInt(index)]
                                            : variants.kg?.[parseInt(index)];
                                        if (variant) {
                                            addToCart(product, variant);
                                        }
                                    }
                                }}
                                className="w-full h-8 text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 rounded-md"
                                disabled={false}
                            >
                                Add to Cart
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            onClick={() => addToCart(product)}
                            className="w-full h-8 text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 rounded-md"
                        >
                            Add to Cart
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    };

    const toggleCouponDetails = (couponId: string) => {
        setExpandedCoupons((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(couponId)) {
                newSet.delete(couponId);
            } else {
                newSet.add(couponId);
            }
            return newSet;
        });
    };

    const priceMap = useMemo(() => {
        const map = new Map<string, { unitPrice: number; finalUnitPrice: number; unitDiscount: number; }>();
        for (const it of cart) {
            const info = allProducts.find((p) => p._id === it.product._id);
            const gm = Array.isArray(info?.variants?.gm) ? info?.variants?.gm || [] : [];
            const kg = Array.isArray(info?.variants?.kg) ? info?.variants?.kg || [] : [];
            const all: { weight: string; price: number; discount?: number; }[] = [...gm, ...kg];
            const v = all.find((x) => x.weight === it.variant?.weight);
            const unitPrice = v?.price ?? 0;
            const unitDiscount = v?.discount ?? 0;
            const finalUnitPrice = Math.max(0, unitPrice - unitDiscount);
            map.set(it.product._id, { unitPrice, finalUnitPrice, unitDiscount });
        }
        return map;
    }, [cart, allProducts]);

    const subtotalBeforeDiscountForCart = useMemo(
        () =>
            cart.reduce(
                (sum, it) => sum + (priceMap.get(it.product._id)?.finalUnitPrice || 0) * (it.quantity || 1),
                0
            ),
        [cart, priceMap]
    );

    const handleApplyCoupon = (coupon: Coupon) => {
        applyCouponMutation.mutate(
            {
                couponCode: coupon.couponCode,
                userId: user?._id as string,
                orderQuantity: cart.length,
                cartValue: getFinalTotal(),
                level: 'order',
            },
            {
                onSuccess: (data) => {
                    toast.success('Coupon applied successfully!');
                    setCouponResponse(data as CouponResponse);
                    setAppliedCoupon(coupon);
                },
                onError: (error: unknown) => {
                    // console.log('error', error)
                    const message = error && typeof error === 'object' && 'response' in error &&
                        error.response && typeof error.response === 'object' && 'data' in error.response &&
                        error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
                        ? (error.response.data.message as string)
                        : "Something went wrong";
                    toast.error(message);
                }
            }
        );
    };

    const calculateOrderTotals = (
        items: { _id: string; }[],
        pricingById: Map<string, PricingData>
    ): OrderTotals => {
        return (items || []).reduce(
            (totals, item) => {
                const pricing = pricingById.get(item._id);
                const itemSubtotal = (pricing?.unitPrice ?? 0) * (pricing?.quantity ?? 0);
                const itemDiscount = (pricing?.unitDiscount ?? 0) * (pricing?.quantity ?? 0);

                return {
                    subtotal: totals.subtotal + itemSubtotal,
                    totalDiscount: totals.totalDiscount + itemDiscount,
                    grandTotal: totals.grandTotal + (itemSubtotal - itemDiscount),
                };
            },
            { subtotal: 0, totalDiscount: 0, grandTotal: 0 }
        );
    };

    const pricingById = useMemo(() => {
        const out = new Map<
            string,
            {
                unitPrice: number;
                unitDiscount: number;
                finalUnitPrice: number;
                lineTotal: number;
                quantity: number;
            }
        >();
        for (const item of cart || []) {
            const { gm, kg } = item.product.variants || {};
            const gmArr = Array.isArray(gm) ? gm : [];
            const kgArr = Array.isArray(kg) ? kg : [];
            const all = [...gmArr, ...kgArr];
            const variant = all.find((v) => v.weight === item.variant?.weight);
            const unitPrice = variant?.price ?? 0;
            const unitDiscount = variant?.discount ?? 0;
            const finalUnitPrice = Math.max(0, unitPrice - unitDiscount);
            const quantity = item.quantity ?? 1;
            const lineTotal = finalUnitPrice * quantity;
            out.set(item.product._id, { unitPrice, unitDiscount, finalUnitPrice, lineTotal, quantity });
        }
        return out;
    }, [cart]);

    const orderTotals = calculateOrderTotals(cart.map(item => ({ _id: item.product._id })), pricingById);
    // const totalDiscount = (couponResponse?.discount ?? 0) + orderTotals.totalDiscount;

    useEffect(() => {
        if (appliedCoupon && user) {
            applyCouponMutation.mutate(
                {
                    couponCode: appliedCoupon.couponCode,
                    userId: (appliedCoupon.userType || user._id) as string,
                    orderQuantity: cart.length,
                    cartValue: getFinalTotal(),
                    level: appliedCoupon.level as string,
                },
                {
                    onSuccess: (data) => {
                        setCouponResponse(data as CouponResponse);
                    },
                    onError: (error: unknown) => {
                        // Coupon became invalid - clear it
                        setAppliedCoupon(null);
                        setCouponResponse(null);

                        if (error) {
                            const message = error && typeof error === 'object' && 'response' in error &&
                        error.response && typeof error.response === 'object' && 'data' in error.response &&
                        error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
                        ? (error.response.data.message as string)
                        : "Coupon no longer valid for current cart";
                    toast.error(message);
                        }
                    }
                }
            );
        }
    }, [orderTotals.subtotal, appliedCoupon?.couponCode]);

    const subtotalBeforeDiscount = useMemo(
        () =>
            cart.reduce(
                (sum, it) => sum + (priceMap.get(it.product._id)?.finalUnitPrice || 0) * (it.quantity || 1),
                0
            ),
        [cart, priceMap]
    );

    const totalDiscount = useMemo(() => {
        let discount = 0;

        for (const it of cart) {
            const p = priceMap.get(it.product._id) as { unitDiscount: number; };
            const qty = it.quantity || 1;
            discount += (p?.unitDiscount || 0) * qty;
        }

        discount += couponResponse?.data?.discount ?? 0;

        return discount;
    }, [cart, priceMap, couponResponse]);

    const subtotalAfterDiscountForCart = subtotalBeforeDiscountForCart - totalDiscount;
    const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="bg-white shadow-sm border-b px-4 sm:px-6 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-4">
                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Menu className="w-5 h-5" />
                    </Button>

                    {/* Company Logo */}
                    <div className="items-center justify-center">
                        <img
                            src="/images/logo.png"
                            alt="DrizzleBites Logo"
                            className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">DrizzleBites POS</h1>
                    </div>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-4">
                    {/* Mobile Cart Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="lg:hidden relative"
                        onClick={() => setIsCartOpen(!isCartOpen)}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {cart.length > 0 && (
                            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full">
                                {cart.length}
                            </Badge>
                        )}
                    </Button>

                    {/* Desktop Buttons */}
                    <div className="hidden lg:flex items-center space-x-4">
                        <Button variant="outline" onClick={() => navigate({ to: '/pos-orders' })}>
                            <ClipboardList className="w-4 h-4" />
                            <span className="hidden sm:inline">POS Orders</span>
                        </Button>
                        <Button variant="outline" onClick={handleBackToAdmin}>
                            <User className="w-4 h-4" />
                            <span className="hidden sm:inline">Back to Admin</span>
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>

                    {/* Mobile Menu Buttons */}
                    <div className="lg:hidden flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/pos-orders' })}>
                            <ClipboardList className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleBackToAdmin}>
                            <User className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="bg-white w-80 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Categories</h2>
                                <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)}>
                                    <XIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            <Button
                                variant={selectedCategory === null ? "default" : "outline"}
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full justify-start"
                            >
                                <ChefHat className="w-4 h-4 mr-2" />
                                All Products
                            </Button>
                            {categoriesLoading ? (
                                <div className="text-gray-500">Loading categories...</div>
                            ) : (
                                categories.map((category) => (
                                    <Button
                                        key={category._id}
                                        variant={selectedCategory === category._id ? "default" : "outline"}
                                        onClick={() => {
                                            setSelectedCategory(category._id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full justify-start"
                                    >
                                        {getCategoryIcon(category.name)}
                                        <span className="ml-2">{category.name}</span>
                                    </Button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Side - Categories and Products */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Search and Categories */}
                    <div className="bg-white border-b p-3 sm:p-4">
                        {/* Categories - Hidden on mobile, shown in mobile menu */}
                        <div className="hidden lg:block">
                            <h2 className="text-lg font-semibold mb-3">Categories</h2>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={selectedCategory === null ? "default" : "outline"}
                                    onClick={() => setSelectedCategory(null)}
                                    className="mb-2 flex items-center gap-2"
                                >
                                    <ChefHat className="w-4 h-4" />
                                    All Products
                                </Button>
                                {categoriesLoading ? (
                                    <div className="text-gray-500">Loading categories...</div>
                                ) : (
                                    categories.map((category) => (
                                        <Button
                                            key={category._id}
                                            variant={selectedCategory === category._id ? "default" : "outline"}
                                            onClick={() => setSelectedCategory(category._id)}
                                            className="mb-2 flex items-center gap-2"
                                        >
                                            {getCategoryIcon(category.name)}
                                            {category.name}
                                        </Button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mt-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-10 h-10 rounded-2xl"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Products by Category */}
                    <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
                        {productsLoading ? (
                            <div className="text-center py-8 text-gray-500">Loading products...</div>
                        ) : searchQuery.trim() ? (
                            // Show search results
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base sm:text-lg font-semibold">
                                        Search Results for "{searchQuery}"
                                    </h2>
                                    <span className="text-xs sm:text-sm text-gray-500">{products.length} products found</span>
                                </div>
                                {products.length > 0 ? (
                                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                                        {products.map((product) => renderProductCard(product))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-600 mb-2">No products found</h3>
                                        <p className="text-gray-500">Try searching with different keywords</p>
                                    </div>
                                )}
                            </div>
                        ) : selectedCategory ? (
                            // Show products for selected category
                            <div>
                                <h2 className="text-base sm:text-lg font-semibold mb-4">
                                    {categories.find(c => c._id === selectedCategory)?.name} Products
                                </h2>
                                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                                    {products.map((product) => renderProductCard(product))}
                                </div>
                            </div>
                        ) : (
                            // Show all categories with their products
                            <div className="space-y-6">
                                {(() => {
                                    const allProducts = Object.values(productsByCategory).flat();
                                    allProducts.sort((a, b) => a.name.localeCompare(b.name));

                                    return (
                                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                                            {allProducts.map((product) => renderProductCard(product))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side - Enhanced Cart */}
                <div className={`w-full lg:w-96 bg-white border-l flex flex-col shadow-lg ${isCartOpen ? 'fixed inset-0 z-50 lg:relative lg:z-auto' : 'hidden lg:flex'}`}>
                    {/* Cart Header */}
                    <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <ShoppingCart className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Cart</h2>
                                    <p className="text-sm text-gray-600">{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {cart.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCart([])}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        Clear All
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="lg:hidden"
                                    onClick={() => setIsCartOpen(false)}
                                >
                                    <XIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full px-4 sm:px-6 py-8 sm:py-12">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                                    <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Cart is empty</h3>
                                <p className="text-sm text-gray-500 text-center mb-4 sm:mb-6">Add delicious products from our menu to get started</p>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <ChefHat className="w-4 h-4" />
                                    <span>Browse our amazing collection</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                                {cart.map((item, _index) => {
                                    const base = import.meta.env.VITE_IMAGE_BASE_URL ?? '';
                                    const imageUrl = item.product.images?.[0]
                                        ? `${base}${typeof item.product.images[0] === 'string' ? item.product.images[0] : (item.product.images[0] as { url: string; })?.url || ''}`
                                        : '';

                                    const discountedPrice = getDiscountedPrice(item);
                                    const originalPrice = item.variant?.price || 0;
                                    const hasDiscount = discountedPrice < originalPrice;
                                    const itemTotal = discountedPrice * item.quantity;
                                    const originalTotal = originalPrice * item.quantity;
                                    const savings = originalTotal - itemTotal;

                                    return (
                                        <div key={`${item.product._id}-${item.variant?.weight || 'default'}`}
                                            className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                            <div className="flex items-start gap-3 sm:gap-4">
                                                {/* Product Image */}
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.product.images?.[0] ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={item.product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-full h-full flex items-center justify-center ${item.product.images?.[0] ? 'hidden' : ''}`}>
                                                        <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                                    </div>
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-xs sm:text-sm text-gray-900 truncate mb-1">
                                                                {item.product.name}
                                                            </h4>
                                                            {item.variant && (
                                                                <p className="text-xs text-gray-600 mb-1 sm:mb-2">
                                                                    {item.variant.weight} {item.variant.weight.includes('kg') ? 'kg' : 'gm'}
                                                                </p>
                                                            )}

                                                            {/* Price Display */}
                                                            <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                                                                {hasDiscount ? (
                                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                                                                        <div className="flex items-center gap-1 sm:gap-2">
                                                                            <span className="text-sm sm:text-lg font-bold text-green-600">
                                                                                ₹{discountedPrice.toFixed(2)}
                                                                            </span>
                                                                            <span className="text-xs sm:text-sm text-gray-500 line-through">
                                                                                ₹{originalPrice.toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                                                            Save ₹{savings.toFixed(2)}
                                                                        </Badge>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm sm:text-lg font-bold text-gray-900">
                                                                        ₹{originalPrice.toFixed(2)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Remove Button */}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => removeFromCart(item.product._id, item.variant?.weight)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 p-1"
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.variant?.weight)}
                                                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-gray-50"
                                                                disabled={item.quantity <= 1}
                                                            >
                                                                −
                                                            </Button>
                                                            <span className="text-xs sm:text-sm font-semibold min-w-[1.5rem] sm:min-w-[2rem] text-center">
                                                                {item.quantity}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.variant?.weight)}
                                                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-gray-50"
                                                            >
                                                                +
                                                            </Button>
                                                        </div>

                                                        {/* Item Total */}
                                                        <div className="text-right">
                                                            <div className="text-xs sm:text-sm font-bold text-gray-900">
                                                                ₹{itemTotal.toFixed(2)}
                                                            </div>
                                                            {hasDiscount && (
                                                                <div className="text-xs text-gray-500 line-through">
                                                                    ₹{originalTotal.toFixed(2)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 💸 UPDATED: Enhanced Coupon Section with NEW VALIDATIONS */}
                    {cart.length > 0 && (
                        <div className="!m-2">
                            <div className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 !text-center">
                                <span>Available Coupons</span>
                            </div>

                            <div className="space-y-2">
                                {couponsLoading ? (
                                    <div className="text-center py-4 text-gray-500 text-sm">
                                        Loading coupons...
                                    </div>
                                ) : couponsData?.results && couponsData.results.length > 0 ? (
                                    couponsData.results
                                        .filter((coupon: Coupon) => {
                                            const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                                            const isUsageLimitReached = coupon?.usageCount && coupon.maxUsage && coupon.usageCount >= coupon.maxUsage;

                                            // NEW: Check firstOrderOnly validation
                                            const isFirstOrderViolation = coupon.firstOrderOnly && user?._id;

                                            // NEW: Check maxUsagePerUser validation
                                            const isUserLimitReached = coupon?.maxUsagePerUser &&
                                                (coupon?.usageCount ?? 0) >= coupon?.maxUsagePerUser;

                                            // Only show active, non-expired coupons with remaining usage
                                            return !isExpired &&
                                                !isUsageLimitReached &&
                                                !isFirstOrderViolation &&
                                                !isUserLimitReached &&
                                                coupon.isActive;
                                        })
                                        .map((coupon: Coupon) => {
                                            const isNotStarted = coupon.startDate && new Date(coupon.startDate) > new Date();
                                            const isMinCartNotMet = coupon?.minCartValue && subtotalBeforeDiscount < coupon.minCartValue;
                                            const isMinQuantityNotMet = coupon?.minOrderQuantity && cart.length < coupon.minOrderQuantity;
                                            const showDetails = expandedCoupons.has(coupon._id);
                                            const isApplied = appliedCoupon?._id === coupon._id;
                                            // NEW: Additional validation checks
                                            const isFirstOrderViolation = coupon.firstOrderOnly && user?._id;
                                            const isUserLimitReached = coupon.maxUsagePerUser &&
                                                (coupon?.usageCount ?? 0) >= coupon?.maxUsagePerUser;

                                            const canApply = !isNotStarted &&
                                                !isMinCartNotMet &&
                                                !isMinQuantityNotMet &&
                                                !isFirstOrderViolation &&
                                                !isUserLimitReached;

                                            return (
                                                <div
                                                    key={coupon._id}
                                                    className={`rounded-lg overflow-hidden transition-all duration-200 ${isApplied
                                                        ? "border-2 border-primary shadow-lg"
                                                        : canApply
                                                            ? "border-none hover:shadow-md"
                                                            : "border border-gray-200 opacity-60"
                                                        }`}
                                                >
                                                    {/* Coupon Card with Gradient Background */}
                                                    <div
                                                        className={`relative ${isApplied
                                                            ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
                                                            : canApply
                                                                ? "bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50"
                                                                : "bg-gray-50"
                                                            }`}
                                                    >
                                                        {/* Decorative Pattern */}
                                                        <div className="absolute inset-0 opacity-10">
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
                                                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 rounded-full blur-3xl"></div>
                                                        </div>

                                                        {/* Main Content */}
                                                        <div className="relative flex items-center gap-2 p-2 sm:p-3">
                                                            {/* Left Icon/Badge */}
                                                            <div
                                                                className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center ${isApplied
                                                                    ? "bg-primary text-white"
                                                                    : canApply
                                                                        ? "bg-gradient-to-br from-orange-400 to-pink-500 text-white"
                                                                        : "bg-gray-200 text-gray-400"
                                                                    }`}
                                                            >
                                                                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                                                                </svg>
                                                            </div>

                                                            {/* Coupon Details */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <div className="font-bold text-sm sm:text-base text-gray-900 tracking-wide">
                                                                                {coupon.couponCode}
                                                                            </div>
                                                                            {isNotStarted && (
                                                                                <span className="text-[9px] sm:text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                                                                                    Coming Soon
                                                                                </span>
                                                                            )}
                                                                            {isApplied && (
                                                                                <span className="text-[9px] sm:text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-medium animate-pulse">
                                                                                    ✓ Active
                                                                                </span>
                                                                            )}
                                                                            {/* NEW: First Order Only Badge */}
                                                                            {/* {coupon.firstOrderOnly && (
                                                                                        <span className="text-[9px] sm:text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                                                                                            First Order Only
                                                                                        </span>
                                                                                    )} */}
                                                                        </div>
                                                                        <div className="text-gray-600 text-[10px] sm:text-xs mt-0.5 line-clamp-1">
                                                                            {coupon.description}
                                                                        </div>
                                                                    </div>

                                                                    {/* Action Buttons */}
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
                                                                            onClick={() => toggleCouponDetails(coupon._id)}
                                                                        >
                                                                            {showDetails ? "Less ▲" : "More ▼"}
                                                                        </Button>
                                                                        <Button
                                                                            variant={isApplied ? "default" : "outline"}
                                                                            size="sm"
                                                                            className={`h-7 sm:h-8 text-[10px] sm:text-xs px-3 font-semibold ${isApplied
                                                                                ? "bg-primary text-white"
                                                                                : "bg-white hover:bg-primary hover:text-white border-primary text-primary"
                                                                                }`}
                                                                            onClick={() => handleApplyCoupon(coupon)}
                                                                            disabled={applyCouponMutation.isPending || !canApply || isApplied}
                                                                        >
                                                                            {isApplied ? "✓ Applied" : "Apply"}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Dashed Border Separator */}
                                                        {showDetails && (
                                                            <div className="relative px-2">
                                                                <div className="border-t-2 border-dashed border-gray-300"></div>
                                                                {/* Left Circle */}
                                                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-gray-200"></div>
                                                                {/* Right Circle */}
                                                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-gray-200"></div>
                                                            </div>
                                                        )}

                                                        {/* Expandable Details */}
                                                        {showDetails && (
                                                            <div className="relative px-3 sm:px-4 pb-3 sm:pb-4 pt-3">
                                                                <div className="space-y-2">
                                                                    {/* Validity Period with Icon */}
                                                                    <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                                                                        <div>
                                                                            <span className="font-semibold text-gray-700">Validity: </span>
                                                                            <span className="text-gray-600">
                                                                                {coupon.startDate && new Date(coupon.startDate).toLocaleDateString('en-IN', {
                                                                                    day: 'numeric',
                                                                                    month: 'short',
                                                                                    year: 'numeric'
                                                                                })}{' '}
                                                                                -{' '}
                                                                                {coupon.expiryDate && new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
                                                                                    day: 'numeric',
                                                                                    month: 'short',
                                                                                    year: 'numeric'
                                                                                })}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Conditions with Visual Indicators */}
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-gray-700">
                                                                            <span>Conditions:</span>
                                                                        </div>

                                                                        {/* NEW: First Order Only Condition */}
                                                                        {coupon.firstOrderOnly && (
                                                                            <div
                                                                                className={`flex items-center gap-2 text-[10px] sm:text-xs pl-6 ${isFirstOrderViolation ? "text-red-600" : "text-green-600"
                                                                                    }`}
                                                                            >
                                                                                <span
                                                                                    className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${isFirstOrderViolation ? "bg-red-500" : "bg-green-500"
                                                                                        }`}
                                                                                >
                                                                                    {isFirstOrderViolation ? "✗" : "✓"}
                                                                                </span>
                                                                                <span className="flex-1">
                                                                                    Valid for first order only
                                                                                    {isFirstOrderViolation && (
                                                                                        <span className="text-gray-500 ml-1">
                                                                                            (You&apos;ve already placed an order)
                                                                                        </span>
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        {/* NEW: Max Usage Per User Condition */}
                                                                        {coupon.maxUsagePerUser && (
                                                                            <div
                                                                                className={`flex items-center gap-2 text-[10px] sm:text-xs pl-6 ${isUserLimitReached ? "text-red-600" : "text-green-600"
                                                                                    }`}
                                                                            >
                                                                                <span
                                                                                    className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${isUserLimitReached ? "bg-red-500" : "bg-green-500"
                                                                                        }`}
                                                                                >
                                                                                    {isUserLimitReached ? "✗" : "✓"}
                                                                                </span>
                                                                                <span className="flex-1">
                                                                                    Max {coupon.maxUsagePerUser} {coupon.maxUsagePerUser === 1 ? 'use' : 'uses'} per user
                                                                                    {/* {!isUserLimitReached && (
                                                                                                <span className="text-gray-500 ml-1">
                                                                                                    ({coupon.maxUsagePerUser - (coupon.userUsageCount ?? 0)} remaining)
                                                                                                </span>
                                                                                            )} */}
                                                                                    {isUserLimitReached && (
                                                                                        <span className="text-gray-500 ml-1">
                                                                                            (You&apos;ve used this coupon {coupon?.usageCount ?? 0} times)
                                                                                        </span>
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        {/* Min Cart Value */}
                                                                        <div
                                                                            className={`flex items-center gap-2 text-[10px] sm:text-xs pl-6 ${isMinCartNotMet ? "text-red-600" : "text-green-600"
                                                                                }`}
                                                                        >
                                                                            <span
                                                                                className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${isMinCartNotMet ? "bg-red-500" : "bg-green-500"
                                                                                    }`}
                                                                            >
                                                                                {isMinCartNotMet ? "✗" : "✓"}
                                                                            </span>
                                                                            <span className="flex-1">
                                                                                Min cart value: ₹{coupon.minCartValue}
                                                                                {isMinCartNotMet && (
                                                                                    <span className="text-gray-500 ml-1">
                                                                                        (Add ₹{coupon?.minCartValue && coupon.minCartValue - subtotalBeforeDiscount} more)
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </div>

                                                                        {/* Min Order Quantity */}
                                                                        <div
                                                                            className={`flex items-center gap-2 text-[10px] sm:text-xs pl-6 ${isMinQuantityNotMet ? "text-red-600" : "text-green-600"
                                                                                }`}
                                                                        >
                                                                            <span
                                                                                className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${isMinQuantityNotMet ? "bg-red-500" : "bg-green-500"
                                                                                    }`}
                                                                            >
                                                                                {isMinQuantityNotMet ? "✗" : "✓"}
                                                                            </span>
                                                                            <span className="flex-1">
                                                                                Min {coupon.minOrderQuantity} items required
                                                                                {isMinQuantityNotMet && (
                                                                                    <span className="text-gray-500 ml-1">
                                                                                        (Add {coupon?.minOrderQuantity && coupon.minOrderQuantity - cart.length} more)
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </div>

                                                                        {/* Usage Limit - Will always show available since expired are filtered out */}
                                                                        <div className="flex items-center gap-2 text-[10px] sm:text-xs pl-6 text-green-600">
                                                                            <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-green-500">
                                                                                ✓
                                                                            </span>
                                                                            <span className="flex-1">
                                                                                Coupon available
                                                                                {/* <span className="text-gray-500 ml-1">
                                                                                            ({coupon.maxUsage - coupon.usageCount} left)
                                                                                        </span> */}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Terms and Conditions */}
                                                                    {coupon.termsAndConditions && (
                                                                        <div className="pt-2 border-t border-gray-200 mt-2">
                                                                            <div className="flex items-start gap-2">
                                                                                <div className="flex-1">
                                                                                    <div className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1">
                                                                                        Terms & Conditions:
                                                                                    </div>
                                                                                    <div className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                                                                                        {coupon.termsAndConditions}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                ) : (
                                    <div className="text-center py-4 text-gray-500 text-sm">
                                        No coupons available
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Cart Summary */}
                    {cart.length > 0 && (
                        <div className="border-t bg-gray-50 p-4 sm:p-6 space-y-3 sm:space-y-4">
                            {/* Price Breakdown */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium">₹{getTotalPrice().toFixed(2)}</span>
                                </div>

                                {getTotalSavings() > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600">Product Discount:</span>
                                        <span className="font-medium text-green-600">-₹{getTotalSavings().toFixed(2)}</span>
                                    </div>
                                )}

                                {appliedCoupon && couponResponse && (
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-600">Coupon Discount ({appliedCoupon.couponCode}):</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={removeAppliedCoupon}
                                                className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                        <span className="font-medium text-blue-600">-{formatCurrency(couponResponse?.data?.discount ?? 0)}</span>
                                    </div>
                                )}

                                <div className="border-t pt-2">
                                    <div className="flex justify-between text-base sm:text-lg font-bold">
                                        <span>Total:</span>
                                        <span className="text-green-600">{formatCurrency(subtotalAfterDiscountForCart)}</span>
                                    </div>
                                </div>

                                {(getTotalSavings() > 0 || getCouponDiscount() > 0) && (
                                    <div className="text-center">
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                            You saved ₹{(getTotalSavings() + getCouponDiscount()).toFixed(2)}!
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {/* Process Order Button */}
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                                size="lg"
                                onClick={handleProcessOrder}
                                disabled={isCreatingOrder}
                            >
                                {isCreatingOrder ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm sm:text-base">Processing Order...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="text-sm sm:text-base">Process Order - ₹ {(
                                            Number(getFinalTotal().toFixed(2)) -
                                            Number(couponResponse?.data?.discount ?? 0)
                                        ).toFixed(2)}</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Cart Overlay */}
            {isCartOpen && (
                <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsCartOpen(false)}>
                    <div className="bg-white w-full h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                        {/* Cart Header */}
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <ShoppingCart className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Cart</h2>
                                        <p className="text-sm text-gray-600">{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {cart.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCart([])}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            Clear All
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsCartOpen(false)}
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Cart Content - Same as desktop but in mobile overlay */}
                        <div className="flex flex-col h-full">
                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto">
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
                                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                                            <ShoppingCart className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Cart is empty</h3>
                                        <p className="text-sm text-gray-500 text-center mb-4">Add delicious products from our menu to get started</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <ChefHat className="w-4 h-4" />
                                            <span>Browse our amazing collection</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 space-y-3">
                                        {cart.map((item, _index) => {
                                            const base = import.meta.env.VITE_IMAGE_BASE_URL ?? '';
                                            const imageUrl = item.product.images?.[0]
                                                ? `${base}${typeof item.product.images[0] === 'string' ? item.product.images[0] : (item.product.images[0] as { url: string; })?.url || ''}`
                                                : '';

                                            const discountedPrice = getDiscountedPrice(item);
                                            const originalPrice = item.variant?.price || 0;
                                            const hasDiscount = discountedPrice < originalPrice;
                                            const itemTotal = discountedPrice * item.quantity;
                                            const originalTotal = originalPrice * item.quantity;
                                            const savings = originalTotal - itemTotal;

                                            return (
                                                <div key={`${item.product._id}-${item.variant?.weight || 'default'}`}
                                                    className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                                                    <div className="flex items-start gap-3">
                                                        {/* Product Image */}
                                                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                            {item.product.images?.[0] ? (
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={item.product.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div className={`w-full h-full flex items-center justify-center ${item.product.images?.[0] ? 'hidden' : ''}`}>
                                                                <ImageIcon className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                        </div>

                                                        {/* Product Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-semibold text-xs text-gray-900 truncate mb-1">
                                                                        {item.product.name}
                                                                    </h4>
                                                                    {item.variant && (
                                                                        <p className="text-xs text-gray-600 mb-1">
                                                                            {item.variant.weight} {item.variant.weight.includes('kg') ? 'kg' : 'gm'}
                                                                        </p>
                                                                    )}

                                                                    {/* Price Display */}
                                                                    <div className="flex items-center gap-1 mb-2">
                                                                        {hasDiscount ? (
                                                                            <div className="flex flex-col items-start gap-1">
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="text-sm font-bold text-green-600">
                                                                                        ₹{discountedPrice.toFixed(2)}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-500 line-through">
                                                                                        ₹{originalPrice.toFixed(2)}
                                                                                    </span>
                                                                                </div>
                                                                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                                                                    Save ₹{savings.toFixed(2)}
                                                                                </Badge>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-sm font-bold text-gray-900">
                                                                                ₹{originalPrice.toFixed(2)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Remove Button */}
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => removeFromCart(item.product._id, item.variant?.weight)}
                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 p-1"
                                                                >
                                                                    ×
                                                                </Button>
                                                            </div>

                                                            {/* Quantity Controls */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.variant?.weight)}
                                                                        className="h-6 w-6 p-0 rounded-full hover:bg-gray-50"
                                                                        disabled={item.quantity <= 1}
                                                                    >
                                                                        −
                                                                    </Button>
                                                                    <span className="text-xs font-semibold min-w-[1.5rem] text-center">
                                                                        {item.quantity}
                                                                    </span>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.variant?.weight)}
                                                                        className="h-6 w-6 p-0 rounded-full hover:bg-gray-50"
                                                                    >
                                                                        +
                                                                    </Button>
                                                                </div>

                                                                {/* Item Total */}
                                                                <div className="text-right">
                                                                    <div className="text-xs font-bold text-gray-900">
                                                                        ₹{itemTotal.toFixed(2)}
                                                                    </div>
                                                                    {hasDiscount && (
                                                                        <div className="text-xs text-gray-500 line-through">
                                                                            ₹{originalTotal.toFixed(2)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Cart Summary */}
                            {cart.length > 0 && (
                                <div className="border-t bg-gray-50 p-4 space-y-3">
                                    {/* Price Breakdown */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span className="font-medium">₹{getFinalTotal().toFixed(2)}</span>
                                        </div>

                                        {getTotalSavings() > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-green-600">Discount:</span>
                                                <span className="font-medium text-green-600">-₹{getTotalSavings().toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="border-t pt-2">
                                            <div className="flex justify-between text-base font-bold">
                                                <span>Total:</span>
                                                <span className="text-green-600">₹{getFinalTotal().toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {getTotalSavings() > 0 && (
                                            <div className="text-center">
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                                    You saved ₹{getTotalSavings().toFixed(2)}!
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Process Order Button */}
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                                        size="lg"
                                        onClick={handleProcessOrder}
                                        disabled={isCreatingOrder}
                                    >
                                        {isCreatingOrder ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing Order...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <ShoppingCart className="w-5 h-5" />
                                                Process Order - ₹{getFinalTotal().toFixed(2)}
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Address Modal */}
            <AddressModal
                isOpen={isAddressModalOpen}
                onClose={() => setIsAddressModalOpen(false)}
                onSave={handleAddressSubmit}
                isLoading={isCreatingOrder}
            />
        </div>
    );
}
