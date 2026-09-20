import { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { ProductCard } from "@/components/products/ProductCard";
import { useProducts, useCategories } from "@/hooks/use-products";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { Search, SlidersHorizontal, X, Grid3X3, LayoutList, Leaf } from "lucide-react";

const productTypeFilters = [
  { id: "cultures", label: "Live Cultures", color: "bg-green-100 text-green-800 border-green-300", keywords: ["kefir", "kombucha", "yogurt", "culture", "scoby", "grains"] },
  { id: "seeds", label: "Seeds & Growing", color: "bg-amber-100 text-amber-800 border-amber-300", keywords: ["seed", "wheatgrass", "soya", "growing"] },
  { id: "em1", label: "EM1 & Bio", color: "bg-teal-100 text-teal-800 border-teal-300", keywords: ["em1", "biosoil", "biopond", "biogreen", "fertilizer"] },
  { id: "algae", label: "Algae", color: "bg-cyan-100 text-cyan-800 border-cyan-300", keywords: ["spirulina", "chlorella", "algae"] },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { formatPrice } = useCurrency();
  
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const categorySlug = searchParams.get("category") || "all";
  const [selectedProductType, setSelectedProductType] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState([0, 35000]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  // Find category by slug
  const selectedCategory = categories.find(cat => cat.slug === categorySlug);
  
  // For parent-style categories (e.g. "dragon-fruit"), also match sub-categories with similar slugs
  const matchingCategoryIds = categorySlug !== "all"
    ? categories
        .filter(cat => cat.slug === categorySlug || cat.slug.includes(categorySlug))
        .map(cat => cat.id)
    : [];
  
  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      // Search filter
      if (search && !product.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      // Category filter by slug (includes sub-categories)
      if (categorySlug !== "all" && matchingCategoryIds.length > 0 && !matchingCategoryIds.includes(product.category_id || "")) {
        return false;
      }
      // Product type filter
      if (selectedProductType.length > 0) {
        const productText = `${product.name} ${product.short_description || ''} ${product.tags?.join(' ') || ''}`.toLowerCase();
        const matchesType = selectedProductType.some(typeId => {
          const typeFilter = productTypeFilters.find(f => f.id === typeId);
          return typeFilter?.keywords.some(keyword => productText.includes(keyword));
        });
        if (!matchesType) return false;
      }
      // Price filter
      if (product.price_zar < priceRange[0] || product.price_zar > priceRange[1]) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price_zar - b.price_zar;
        case "price-desc":
          return b.price_zar - a.price_zar;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value) {
      searchParams.set("q", value);
    } else {
      searchParams.delete("q");
    }
    setSearchParams(searchParams);
  };

  const toggleProductType = (typeId: string) => {
    setSelectedProductType(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleCategoryChange = (slug: string) => {
    if (slug === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", slug);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedProductType([]);
    setPriceRange([0, 35000]);
    setSortBy("newest");
    searchParams.delete("q");
    searchParams.delete("category");
    setSearchParams(searchParams);
  };

  const hasActiveFilters = search || categorySlug !== "all" || selectedProductType.length > 0 || priceRange[0] > 0 || priceRange[1] < 35000;

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Shop Gut Health Products | Kefir, Kombucha, Spirulina & EM1"
        description="Browse premium live probiotic cultures, fermentation starters, superfoods & bio-fertilizers. Quality products for homes, clinics & farms across South Africa."
        canonical="https://livingculturehealth.com/products"
      />
      <Header />
      <CartSidebar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl font-bold mb-4 text-gradient-probiotic"
            >
              Gut Health Products
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground max-w-2xl mx-auto"
            >
              Live probiotic cultures, fermentation supplies, bio-fertilizers and superfoods. 
              Quality products for homes, clinics, farms and labs across South Africa.
            </motion.p>
          </div>

          {/* Filters bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4 rounded-xl mb-8"
          >
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category */}
              <Select value={categorySlug} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>

              {/* View mode toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>

              {/* More filters */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Extended filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Product Type Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-primary" />
                      Product Type
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {productTypeFilters.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => toggleProductType(type.id)}
                          className={`px-3 py-2 rounded-full text-sm font-medium border-2 transition-all ${type.color} ${
                            selectedProductType.includes(type.id)
                              ? "ring-2 ring-primary ring-offset-2"
                              : "opacity-70 hover:opacity-100"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={35000}
                      step={100}
                      className="mt-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>R0</span>
                      <span>R35,000</span>
                    </div>
                  </div>
                </div>

                {/* Active filters badges */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {selectedProductType.map(typeId => {
                      const type = productTypeFilters.find(f => f.id === typeId);
                      return (
                        <Badge
                          key={typeId}
                          variant="secondary"
                          className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => toggleProductType(typeId)}
                        >
                          {type?.label}
                          <X className="h-3 w-3" />
                        </Badge>
                      );
                    })}
                    {categorySlug !== "all" && selectedCategory && (
                      <Badge
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleCategoryChange("all")}
                      >
                        {selectedCategory.name}
                        <X className="h-3 w-3" />
                      </Badge>
                    )}
                    {(priceRange[0] > 0 || priceRange[1] < 35000) && (
                      <Badge
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setPriceRange([0, 35000])}
                      >
                        {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                        <X className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Results count */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {/* Product grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-xl mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground mb-4">No products found</p>
              <Button onClick={clearFilters} className="btn-sunset">
                Clear Filters
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  variant={viewMode}
                />
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Products;
