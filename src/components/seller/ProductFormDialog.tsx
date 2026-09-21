import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductRow {
  id: string;
  name: string;
  short_description: string | null;
  description: string | null;
  price_zar: number;
  compare_at_price_zar: number | null;
  stock_quantity: number;
  brand: string | null;
  category_id: string | null;
  primary_image_url: string | null;
  images: string[] | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  tags: string[] | null;
  vendor_id: string | null;
  business_id: string | null;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductRow | null;
  maxProducts: number;
  productCount: number;
}

interface FormState {
  name: string;
  short_description: string;
  description: string;
  price_zar: string;
  compare_at_price_zar: string;
  stock_quantity: string;
  brand: string;
  category_id: string;
  primary_image_url: string;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  tags: string;
}

const emptyForm: FormState = {
  name: '',
  short_description: '',
  description: '',
  price_zar: '',
  compare_at_price_zar: '',
  stock_quantity: '0',
  brand: '',
  category_id: '',
  primary_image_url: '',
  images: [],
  is_active: true,
  is_featured: false,
  tags: '',
};

export function ProductFormDialog({ open, onOpenChange, product, maxProducts, productCount }: ProductFormDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEdit = !!product;
  const atCeiling = !isEdit && productCount >= maxProducts;

  useEffect(() => {
    if (open) {
      setSubmitError(null);
      setErrors({});
      if (product) {
        setForm({
          name: product.name ?? '',
          short_description: product.short_description ?? '',
          description: product.description ?? '',
          price_zar: String(product.price_zar ?? ''),
          compare_at_price_zar: product.compare_at_price_zar != null ? String(product.compare_at_price_zar) : '',
          stock_quantity: String(product.stock_quantity ?? 0),
          brand: product.brand ?? '',
          category_id: product.category_id ?? '',
          primary_image_url: product.primary_image_url ?? '',
          images: Array.isArray(product.images) ? (product.images as string[]) : [],
          is_active: product.is_active ?? true,
          is_featured: product.is_featured ?? false,
          tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [open, product]);

  const { data: categories } = useQuery({
    queryKey: ['seller-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: myBusiness } = useQuery({
    queryKey: ['seller-my-business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('business_listings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: open && !!user,
  });

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Please give your product a name.';
    const price = Number(form.price_zar);
    if (!form.price_zar || isNaN(price) || price <= 0) {
      nextErrors.price_zar = 'Enter a price greater than R0.';
    }
    const stock = Number(form.stock_quantity);
    if (form.stock_quantity === '' || isNaN(stock) || !Number.isInteger(stock) || stock < 0) {
      nextErrors.stock_quantity = 'Stock must be a whole number of 0 or more.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        price_zar: Number(form.price_zar),
        compare_at_price_zar: form.compare_at_price_zar ? Number(form.compare_at_price_zar) : null,
        stock_quantity: Number(form.stock_quantity),
        brand: form.brand.trim() || null,
        category_id: form.category_id || null,
        primary_image_url: form.primary_image_url || null,
        images: form.images,
        is_active: form.is_active,
        is_featured: form.is_featured,
        tags,
      };

      if (isEdit && product) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert({
          ...payload,
          vendor_id: user?.id,
          business_id: myBusiness?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast({
        title: isEdit ? 'Product updated' : 'Product added',
        description: isEdit ? 'Your changes are live in your shop.' : 'Your new product is ready in your shop.',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      setSubmitError(error?.message ?? 'Something went wrong saving this product.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Edit product' : 'Add a product'}</DialogTitle>
          <DialogDescription>We'll create the shop link for you automatically.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Product name*</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="short_description">Short description</Label>
              <Input
                id="short_description"
                value={form.short_description}
                onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                placeholder="A one-line summary for listings"
              />
            </div>

            <div>
              <Label htmlFor="description">Full description</Label>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_zar">Price (R)*</Label>
                <Input
                  id="price_zar"
                  type="number"
                  step="0.01"
                  value={form.price_zar}
                  onChange={(e) => setForm({ ...form, price_zar: e.target.value })}
                />
                {errors.price_zar && <p className="text-sm text-destructive mt-1">{errors.price_zar}</p>}
              </div>
              <div>
                <Label htmlFor="compare_at_price_zar">Compare-at price (R)</Label>
                <Input
                  id="compare_at_price_zar"
                  type="number"
                  step="0.01"
                  value={form.compare_at_price_zar}
                  onChange={(e) => setForm({ ...form, compare_at_price_zar: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock_quantity">Stock quantity*</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  step="1"
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                />
                {errors.stock_quantity && <p className="text-sm text-destructive mt-1">{errors.stock_quantity}</p>}
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={form.category_id || 'none'}
                onValueChange={(v) => setForm({ ...form, category_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Primary image</Label>
              <ImageUpload
                value={form.primary_image_url}
                onChange={(url) => setForm({ ...form, primary_image_url: url })}
                onRemove={() => setForm({ ...form, primary_image_url: '' })}
              />
            </div>

            <div>
              <Label>Gallery images</Label>
              <MultiImageUpload
                value={form.images}
                onChange={(urls) => setForm({ ...form, images: urls })}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="kefir, probiotic, raw"
              />
            </div>

            <div className="flex items-center justify-between glass-card p-3 rounded-lg">
              <div>
                <p className="text-sm font-medium">Show in shop</p>
                <p className="text-xs text-muted-foreground">Buyers can see and buy this product.</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>

            <div className="flex items-center justify-between glass-card p-3 rounded-lg">
              <div>
                <p className="text-sm font-medium">Feature this product</p>
                <p className="text-xs text-muted-foreground">Give it extra visibility in your shop.</p>
              </div>
              <Switch
                checked={form.is_featured}
                onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
              />
            </div>

            {atCeiling && (
              <div className="flex items-start gap-2 text-sm text-destructive glass-card p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  You've reached your plan's product limit. Remove a product or{' '}
                  <Link to="/seller/subscription" className="underline text-primary">
                    upgrade your plan
                  </Link>{' '}
                  to list more.
                </p>
              </div>
            )}

            {submitError && (
              <div className="flex items-start gap-2 text-sm text-destructive glass-card p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>{submitError}</p>
              </div>
            )}
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={atCeiling || mutation.isPending}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
