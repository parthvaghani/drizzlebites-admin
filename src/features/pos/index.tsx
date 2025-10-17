import { useState } from 'react';
import { useProductCategoriesList } from '@/hooks/use-categories';
import { useProductsList } from '@/hooks/use-products';
import { useCreatePOSOrder } from '@/hooks/use-orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LogOut, ShoppingCart, User, ChefHat, Cake, Donut, Cookie, Sandwich, Image as ImageIcon, Wheat, Search, X, Menu, X as XIcon } from 'lucide-react';
import { useLogout } from '@/hooks/use-auth';
import { useNavigate } from '@tanstack/react-router';
import { AddressModal } from '@/components/address-modal';
import { toast } from 'sonner';

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

export default function POSScreen() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<Array<{ product: Product; quantity: number; variant?: { weight: string; price: number; }; }>>([]);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

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
    const allProducts = productsData?.results || [];

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

    const getTotalPrice = () => {
        return cart.reduce((total, item) => {
            const price = item.variant?.price || 0;
            return total + (price * item.quantity);
        }, 0);
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

    const getFinalTotal = () => {
        return cart.reduce((total, item) => {
            const discountedPrice = getDiscountedPrice(item);
            return total + (discountedPrice * item.quantity);
        }, 0);
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
                    // Find the selected variant key for this product
                    const selectedVariantKey = selectedVariants[item.product._id];
                    if (selectedVariantKey) {
                        const [type] = selectedVariantKey.split('-');
                        return {
                            productId: item.product._id,
                            weightVariant: type, // 'gm' or 'kg'
                            weight: item.variant.weight,
                            totalProduct: item.quantity,
                        };
                    }
                }

                // Default fallback for products without variants
                return {
                    productId: item.product._id,
                    weightVariant: 'gm',
                    weight: '100',
                    totalProduct: item.quantity,
                    // discountedPrice: 0,
                    // originalPrice: 0
                };
            }),
            address,
            phoneNumber,
        };

        createPOSOrder(orderPayload, {
            onSuccess: () => {
                toast.success('Order placed successfully!');
                setCart([]);
                setSelectedVariants({});
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

    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col">
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
                            alt="Aavkar Mukhwas Logo"
                            className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Aavkar Mukhwas POS</h1>
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
                        <Button variant="outline" onClick={handleBackToAdmin}>
                            <User className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Back to Admin</span>
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>

                    {/* Mobile Menu Buttons */}
                    <div className="lg:hidden flex items-center space-x-2">
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
                <div className="flex-1 flex flex-col">
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
                                        <span className="text-green-600">Discount:</span>
                                        <span className="font-medium text-green-600">-₹{getTotalSavings().toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="border-t pt-2">
                                    <div className="flex justify-between text-base sm:text-lg font-bold">
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
                                        <span className="text-sm sm:text-base">Process Order - ₹{getFinalTotal().toFixed(2)}</span>
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
                                            <span className="font-medium">₹{getTotalPrice().toFixed(2)}</span>
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
