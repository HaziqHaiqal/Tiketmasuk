"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Package, Star, ArrowLeft, ShoppingCart, Minus, Plus, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useStorageUrl } from "@/lib/utils";
import Spinner from "@/components/Spinner";
import { Label } from "@/components/ui/label";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

function ProductPageContent({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedFulfillmentMethod, setSelectedFulfillmentMethod] = useState<"pickup" | "shipping" | null>(null);

  const product = useQuery(api.products.getById, {
    product_id: productId as Id<"products">,
  });

  const imageUrl = useStorageUrl(product?.featured_image_storage_id);

  // Calculate total price including variants
  const calculateTotalPrice = () => {
    if (!product) return 0;
    
    let basePrice = product.base_price;
    
    // Add variant price modifiers
    if (product.variants) {
      for (const variant of product.variants) {
        const selectedOptionId = selectedVariants[variant.variant_id];
        if (selectedOptionId) {
          const selectedOption = variant.options.find(opt => opt.option_id === selectedOptionId);
          if (selectedOption) {
            basePrice += selectedOption.price_modifier;
          }
        }
      }
    }
    
    return basePrice * quantity;
  };

  const handleVariantChange = (variantId: string, optionId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantId]: optionId
    }));
  };

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    // This would typically call a mutation to add the product to cart
    console.log("Adding to cart:", {
      productId,
      quantity,
      selectedVariants,
      fulfillmentMethod: selectedFulfillmentMethod,
      totalPrice: calculateTotalPrice()
    });
    
    // For now, redirect to checkout
    const cartData = {
      product_id: productId,
      quantity,
      variants: selectedVariants,
      fulfillment_method: selectedFulfillmentMethod,
      unit_price: calculateTotalPrice() / quantity
    };
    
    // Store in localStorage temporarily and redirect
    localStorage.setItem('cart_item', JSON.stringify(cartData));
    window.location.href = '/checkout/cart';
  };

  const isAddToCartDisabled = () => {
    if (!product) return true;
    
    // Check if all required variants are selected
    if (product.variants) {
      for (const variant of product.variants) {
        if (variant.required && !selectedVariants[variant.variant_id]) {
          return true;
        }
      }
    }
    
    // Check if fulfillment method is selected
    if (!selectedFulfillmentMethod) return true;
    
    // Check stock availability
    if (product.track_inventory && (product.stock_quantity || 0) < quantity) {
      return true;
    }
    
    return false;
  };

  if (!product) {
    return <Spinner fullScreen />;
  }

  const price = calculateTotalPrice() / 100; // Convert from cents
  const unitPrice = product.base_price / 100;

  const getCategoryBadge = () => {
    const categoryLabels = {
      merchandise: "Merchandise",
      add_on: "Add-on",
      upgrade: "Upgrade",
      service: "Service",
      digital: "Digital",
      food_beverage: "Food & Beverage"
    };
    
    return (
      <Badge variant="outline">
        {categoryLabels[product.category] || product.category}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Products
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left Column - Product Image */}
            <div className="space-y-4">
              <div className="aspect-square relative w-full rounded-lg overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <Package className="w-24 h-24 text-white opacity-70" />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Product Details */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {getCategoryBadge()}
                  <Badge className="bg-green-100 text-green-800">
                    {product.is_active ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-green-600">
                    RM {price.toFixed(2)}
                  </span>
                  {quantity > 1 && (
                    <span className="text-lg text-gray-500">
                      (RM {unitPrice.toFixed(2)} each)
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-2">
                    <Package className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-sm font-medium">Stock</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {product.track_inventory 
                      ? `${product.stock_quantity || 0} available`
                      : "In stock"
                    }
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-2">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    <span className="text-sm font-medium">Variants</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {product.variants?.length || 0} options
                  </p>
                </div>
              </div>

              {/* Variants Selection */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Select Options</h3>
                  {product.variants.map((variant) => (
                    <div key={variant.variant_id} className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        {variant.name} {variant.required && <span className="text-red-500">*</span>}
                      </Label>
                      <Select
                        value={selectedVariants[variant.variant_id] || ""}
                        onValueChange={(value) => handleVariantChange(variant.variant_id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${variant.name.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {variant.options.map((option) => (
                            <SelectItem key={option.option_id} value={option.option_id}>
                              <div className="flex justify-between items-center w-full">
                                <span>{option.label}</span>
                                {option.price_modifier !== 0 && (
                                  <span className="text-sm text-gray-500 ml-2">
                                    {option.price_modifier > 0 ? '+' : ''}
                                    RM {(option.price_modifier / 100).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}

              {/* Fulfillment Method Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Delivery Method</h3>
                <div className="grid grid-cols-1 gap-3">
                  {product.supported_fulfillment_types.includes("pickup") && (
                    <Card 
                      className={`cursor-pointer transition-all ${
                        selectedFulfillmentMethod === "pickup" 
                          ? "ring-2 ring-green-500 bg-green-50" 
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedFulfillmentMethod("pickup")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-green-600" />
                          <div>
                            <h4 className="font-medium">Pickup</h4>
                            <p className="text-sm text-gray-600">Free - Collect from pickup location</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {product.supported_fulfillment_types.includes("shipping") && (
                    <Card 
                      className={`cursor-pointer transition-all ${
                        selectedFulfillmentMethod === "shipping" 
                          ? "ring-2 ring-green-500 bg-green-50" 
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedFulfillmentMethod("shipping")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">Shipping</h4>
                            <p className="text-sm text-gray-600">Delivery to your address</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Quantity</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const maxQuantity = product.track_inventory ? (product.stock_quantity || 0) : 999;
                      setQuantity(Math.min(maxQuantity, quantity + 1));
                    }}
                    disabled={
                      product.track_inventory && quantity >= (product.stock_quantity || 0)
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="pt-4">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                  onClick={handleAddToCart}
                  disabled={isAddToCartDisabled()}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart - RM {price.toFixed(2)}
                </Button>
                
                {isAddToCartDisabled() && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    {product.variants?.some(v => v.required && !selectedVariants[v.variant_id])
                      ? "Please select all required options"
                      : !selectedFulfillmentMethod
                      ? "Please select a delivery method"
                      : "Out of stock"
                    }
                  </p>
                )}
              </div>

              {/* Product Details */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium">{getCategoryBadge()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scope:</span>
                    <span className="font-medium">
                      {product.product_scope === "store_only" ? "Store Only" :
                       product.product_scope === "event_bundled" ? "Event Bundled" :
                       "Both Store & Events"}
                    </span>
                  </div>
                  {product.weight && (
                    <div className="flex justify-between">
                      <span>Weight:</span>
                      <span className="font-medium">{product.weight}g</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span className="font-medium">
                        {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {product.dimensions.unit}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage({ params }: ProductPageProps) {
  const [productId, setProductId] = useState<string | null>(null);

  useEffect(() => {
    async function resolveParams() {
      const { id } = await params;
      setProductId(id);
    }
    resolveParams();
  }, [params]);

  if (!productId) {
    return <Spinner fullScreen />;
  }

  return <ProductPageContent productId={productId} />;
} 