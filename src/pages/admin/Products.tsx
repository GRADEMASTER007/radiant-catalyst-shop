import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Sparkles, Loader2, DollarSign, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';
import { useCategories } from '@/hooks/use-products';

interface ProductForm {
  name: string;
  sku: string;
  slug: string;
  short_description: string;
  description: string;
  category_id: string | null;
  price_zar: string;
  compare_at_price_zar: string;
  stock_quantity: string;
  primary_image_url: string;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
}

const emptyForm: ProductForm = {
  name: '',
  sku: '',
  slug: '',
  short_description: '',
  description: '',
  category_id: null,
  price_zar: '',
  compare_at_price_zar: '',
  stock_quantity: '0',
  primary_image_url: '',
  images: [],
  is_active: true,
  is_featured: false,
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [isBulkStockOpen, setIsBulkStockOpen] = useState(false);
  const [bulkPriceAction, setBulkPriceAction] = useState<'set' | 'increase' | 'decrease'>('set');
  const [bulkPriceValue, setBulkPriceValue] = useState('');
  const [bulkPricePercent, setBulkPricePercent] = useState(false);
  const [bulkStockAction, setBulkStockAction] = useState<'set' | 'add' | 'subtract'>('set');
  const [bulkStockValue, setBulkStockValue] = useState('');
  
  const { data: categories } = useCategories();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      // Set primary image from images array if not set
      const primaryImage = data.primary_image_url || data.images[0] || null;
      
      const payload = {
        name: data.name,
        sku: data.sku,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        short_description: data.short_description || null,
        description: data.description || null,
        category_id: data.category_id || null,
        price_zar: parseFloat(data.price_zar) || 0,
        compare_at_price_zar: data.compare_at_price_zar ? parseFloat(data.compare_at_price_zar) : null,
        stock_quantity: parseInt(data.stock_quantity) || 0,
        primary_image_url: primaryImage,
        images: data.images,
        is_active: data.is_active,
        is_featured: data.is_featured,
      };

      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success(editingId ? 'Product updated!' : 'Product created!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkPriceMutation = useMutation({
    mutationFn: async () => {
      const value = parseFloat(bulkPriceValue);
      if (isNaN(value)) throw new Error('Invalid price value');
      
      for (const productId of selectedProducts) {
        const product = products?.find(p => p.id === productId);
        if (!product) continue;
        
        let newPrice: number;
        if (bulkPriceAction === 'set') {
          newPrice = value;
        } else if (bulkPriceAction === 'increase') {
          newPrice = bulkPricePercent 
            ? product.price_zar * (1 + value / 100)
            : product.price_zar + value;
        } else {
          newPrice = bulkPricePercent 
            ? product.price_zar * (1 - value / 100)
            : product.price_zar - value;
        }
        
        newPrice = Math.max(0, Math.round(newPrice * 100) / 100);
        
        const { error } = await supabase
          .from('products')
          .update({ price_zar: newPrice })
          .eq('id', productId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsBulkPriceOpen(false);
      setSelectedProducts(new Set());
      setBulkPriceValue('');
      toast.success(`Updated prices for ${selectedProducts.size} products`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkStockMutation = useMutation({
    mutationFn: async () => {
      const value = parseInt(bulkStockValue);
      if (isNaN(value)) throw new Error('Invalid stock value');
      
      for (const productId of selectedProducts) {
        const product = products?.find(p => p.id === productId);
        if (!product) continue;
        
        let newStock: number;
        if (bulkStockAction === 'set') {
          newStock = value;
        } else if (bulkStockAction === 'add') {
          newStock = product.stock_quantity + value;
        } else {
          newStock = product.stock_quantity - value;
        }
        
        newStock = Math.max(0, newStock);
        
        const { error } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', productId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsBulkStockOpen(false);
      setSelectedProducts(new Set());
      setBulkStockValue('');
      toast.success(`Updated stock for ${selectedProducts.size} products`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleAllProducts = () => {
    if (selectedProducts.size === products?.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products?.map(p => p.id) || []));
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const generateDescription = async () => {
    if (!form.name) {
      toast.error('Please enter a product name first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            type: 'product_description',
            prompt: form.short_description || 'Create a compelling description',
            context: {
              productName: form.name,
              existingDescription: form.description,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate');
      }

      const data = await response.json();
      setForm((prev) => ({ ...prev, description: data.content }));
      toast.success('Description generated!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    const productImages = Array.isArray(product.images) ? product.images : [];
    setForm({
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      short_description: product.short_description || '',
      description: product.description || '',
      category_id: product.category_id || null,
      price_zar: product.price_zar?.toString() || '',
      compare_at_price_zar: product.compare_at_price_zar?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '0',
      primary_image_url: product.primary_image_url || '',
      images: productImages as string[],
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.price_zar) {
      toast.error('Please fill in required fields');
      return;
    }
    saveMutation.mutate(form);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(value);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories?.find((c) => c.id === categoryId);
    return category?.name || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedProducts.size > 0 && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsBulkPriceOpen(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Bulk Price ({selectedProducts.size})
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsBulkStockOpen(true)}
              >
                <Package className="h-4 w-4 mr-2" />
                Bulk Stock ({selectedProducts.size})
              </Button>
            </>
          )}
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setEditingId(null);
              setForm(emptyForm);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="btn-sunset">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="auto-generated-from-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select
                    value={form.category_id || 'none'}
                    onValueChange={(value) => setForm({ ...form, category_id: value === 'none' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Input
                  id="short_description"
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateDescription}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_zar">Price (ZAR) *</Label>
                  <Input
                    id="price_zar"
                    type="number"
                    step="0.01"
                    value={form.price_zar}
                    onChange={(e) => setForm({ ...form, price_zar: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compare_at_price_zar">Compare Price</Label>
                  <Input
                    id="compare_at_price_zar"
                    type="number"
                    step="0.01"
                    value={form.compare_at_price_zar}
                    onChange={(e) => setForm({ ...form, compare_at_price_zar: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Product Images</Label>
                <MultiImageUpload
                  value={form.images}
                  onChange={(urls) => {
                    setForm({ 
                      ...form, 
                      images: urls,
                      primary_image_url: urls[0] || '' 
                    });
                  }}
                  maxImages={10}
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <span>Featured</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-sunset" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Bulk Price Dialog */}
      <Dialog open={isBulkPriceOpen} onOpenChange={setIsBulkPriceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Price Update ({selectedProducts.size} products)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={bulkPriceAction} onValueChange={(v: 'set' | 'increase' | 'decrease') => setBulkPriceAction(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set price to</SelectItem>
                  <SelectItem value="increase">Increase by</SelectItem>
                  <SelectItem value="decrease">Decrease by</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  step="0.01"
                  value={bulkPriceValue}
                  onChange={(e) => setBulkPriceValue(e.target.value)}
                  placeholder={bulkPriceAction === 'set' ? 'New price (R)' : 'Amount'}
                />
                {bulkPriceAction !== 'set' && (
                  <label className="flex items-center gap-2 whitespace-nowrap">
                    <Checkbox checked={bulkPricePercent} onCheckedChange={(c) => setBulkPricePercent(!!c)} />
                    <span>%</span>
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkPriceOpen(false)}>Cancel</Button>
            <Button onClick={() => bulkPriceMutation.mutate()} disabled={bulkPriceMutation.isPending}>
              {bulkPriceMutation.isPending ? 'Updating...' : 'Update Prices'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Stock Dialog */}
      <Dialog open={isBulkStockOpen} onOpenChange={setIsBulkStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Stock Update ({selectedProducts.size} products)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={bulkStockAction} onValueChange={(v: 'set' | 'add' | 'subtract') => setBulkStockAction(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set stock to</SelectItem>
                  <SelectItem value="add">Add to stock</SelectItem>
                  <SelectItem value="subtract">Subtract from stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={bulkStockValue}
                onChange={(e) => setBulkStockValue(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkStockOpen(false)}>Cancel</Button>
            <Button onClick={() => bulkStockMutation.mutate()} disabled={bulkStockMutation.isPending}>
              {bulkStockMutation.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={products?.length ? selectedProducts.size === products.length : false}
                    onCheckedChange={toggleAllProducts}
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.primary_image_url && (
                        <img
                          src={product.primary_image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.is_featured && (
                          <span className="text-xs text-primary">Featured</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>
                    {getCategoryName(product.category_id) || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(product.price_zar)}</TableCell>
                  <TableCell>
                    <span className={product.stock_quantity < 5 ? 'text-red-500 font-medium' : ''}>
                      {product.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.is_active
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {product.is_active ? 'Active' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Delete this product?')) {
                            deleteMutation.mutate(product.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}
