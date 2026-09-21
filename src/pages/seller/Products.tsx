import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { ProductFormDialog } from '@/components/seller/ProductFormDialog';
import { MoreVertical, ImageIcon, Plus, Package } from 'lucide-react';

const formatZAR = (n: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n);

type StatusFilter = 'all' | 'active' | 'hidden';

export default function SellerProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const { data: business } = useQuery({
    queryKey: ['seller-business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('business_listings')
        .select('id, business_name')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: plan } = useQuery({
    queryKey: ['seller-plan-limit', business?.id],
    queryFn: async () => {
      if (!business) return { maxProducts: 20 };
      const { data } = await supabase
        .from('business_subscriptions')
        .select('plan:subscription_plans(features)')
        .eq('business_id', business.id)
        .eq('status', 'active')
        .maybeSingle();
      const features = (data as any)?.plan?.features;
      const maxProducts = features?.max_products ?? 20;
      return { maxProducts };
    },
    enabled: !!business,
  });

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['seller-products', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast({ title: 'Product updated' });
    },
    onError: (e: any) => toast({ title: 'Could not update product', description: e.message, variant: 'destructive' }),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase.from('products').update({ is_featured }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast({ title: 'Product updated' });
    },
    onError: (e: any) => toast({ title: 'Could not update product', description: e.message, variant: 'destructive' }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast({ title: 'Product deleted' });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast({ title: 'Could not delete product', description: e.message, variant: 'destructive' }),
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        status === 'all' ? true : status === 'active' ? !!p.is_active : !p.is_active;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, status]);

  const productCount = products?.length ?? 0;
  const maxProducts = plan?.maxProducts ?? 20;
  const atCeiling = productCount >= maxProducts;

  const openCreate = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">We couldn't load your products right now. Please try again shortly.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl text-gradient-probiotic">
            {business?.business_name ?? 'My products'}
          </h1>
          <div className="mt-2 max-w-xs">
            <p className="text-xs text-muted-foreground mb-1">
              {productCount} of {maxProducts} products used
            </p>
            <Progress value={Math.min((productCount / maxProducts) * 100, 100)} />
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button onClick={openCreate} disabled={atCeiling}>
                  <Plus className="h-4 w-4 mr-1" /> Add product
                </Button>
              </span>
            </TooltipTrigger>
            {atCeiling && (
              <TooltipContent>
                <p>
                  You've reached your plan's limit. <Link to="/seller/subscription" className="underline">Upgrade your plan</Link> to add more.
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search your products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">In shop</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        productCount === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-10 text-center space-y-3">
              <Package className="h-10 w-10 mx-auto text-primary" />
              <h2 className="font-display text-xl">This is where your products will live</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Add your first ferment, culture or living food so buyers across South Africa can find it.
              </p>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Add your first product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              No products match your search or filter.
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Card key={product.id} className="glass-card overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center">
                {product.primary_image_url ? (
                  <img
                    src={product.primary_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-display line-clamp-1">{product.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(product)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleActive.mutate({ id: product.id, is_active: !product.is_active })}
                      >
                        {product.is_active ? 'Hide from shop' : 'Show in shop'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleFeatured.mutate({ id: product.id, is_featured: !product.is_featured })}
                      >
                        {product.is_featured ? 'Unfeature' : 'Feature'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(product)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{formatZAR(product.price_zar)}</span>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'In shop' : 'Hidden'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Stock: {product.stock_quantity}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        maxProducts={maxProducts}
        productCount={productCount}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              Buyers will no longer be able to find "{deleteTarget?.name}" in your shop. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteProduct.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
