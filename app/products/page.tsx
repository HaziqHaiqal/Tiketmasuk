"use client";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Search, X, Package, Star } from "lucide-react";
import Spinner from "@/components/Spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useStorageUrl } from "@/lib/utils";

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);

  // Get all products (no search API for products yet, so just filter client-side)
  const allProducts = useQuery(api.products.getAll, {});

  // Simple component-level loading
  if (!allProducts) {
    return <Spinner fullScreen />;
  }

  type Product = Doc<"products">;
  
  // Filter products based on search query
  const filteredProducts = query 
    ? allProducts.filter((product: Product) => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
      )
    : allProducts;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      router.push('/products');
    }
  };

  const handleClear = () => {
    setSearchInput("");
    router.push('/products');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for products..."
                className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 m-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          {query ? (
            <>
              <Search className="w-6 h-6 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Search Results for &quot;{query}&quot;
                </h1>
                <p className="text-gray-600 mt-1">
                  Found {filteredProducts.length} products
                </p>
              </div>
            </>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
              <p className="text-gray-600 mt-1">
                Discover amazing products from our organizers
              </p>
            </div>
          )}
        </div>

        {/* No Results State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {query ? "No products found" : "No products available"}
            </h3>
            <p className="text-gray-600 mt-1">
              {query 
                ? "Try adjusting your search terms or browse all products"
                : "Check back later for new products"
              }
            </p>
            {query && (
              <button
                onClick={() => router.push('/products')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Browse All Products
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {query ? "Products" : `All Products (${filteredProducts.length})`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: Product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <ProductsPageContent />
    </Suspense>
  );
}

// Product Card Component (extracted from DiscoverySections)
interface ProductCardProps {
  product: Doc<"products">;
}

function ProductCard({ product }: ProductCardProps) {
  const imageUrl = useStorageUrl(product.featured_image_storage_id);
  const price = product.base_price / 100;

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
            <Package className="w-16 h-16 text-white opacity-70" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className="bg-white text-gray-900 hover:bg-gray-100">
            RM {price.toFixed(2)}
          </Badge>
        </div>
        <div className="absolute top-4 left-4">
          <Badge className="bg-green-500 text-white">
            Product
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1 group-hover:text-green-600 transition-colors">
          {product.name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {product.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Package className="w-4 h-4 mr-2 text-green-500" />
            {product.stock_quantity || 0} in stock
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            {product.variants?.length || 0} variants
          </div>
        </div>
        
        <Link href={`/products/${product._id}`} className="block mt-4">
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
            View Product
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
} 