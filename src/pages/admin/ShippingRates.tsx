import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Truck } from "lucide-react";

interface ShippingRate {
  id: string;
  provider: string;
  service_name: string;
  service_code: string | null;
  max_weight_kg: number;
  max_length_cm: number | null;
  max_width_cm: number | null;
  max_height_cm: number | null;
  price_zar: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

const emptyRate: Omit<ShippingRate, 'id'> = {
  provider: 'pudo',
  service_name: '',
  service_code: null,
  max_weight_kg: 5,
  max_length_cm: 60,
  max_width_cm: 41,
  max_height_cm: 19,
  price_zar: 100,
  description: null,
  is_active: true,
  sort_order: 0,
};

const ShippingRates = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [formData, setFormData] = useState<Omit<ShippingRate, 'id'>>(emptyRate);

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['shipping-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .order('provider')
        .order('sort_order');
      if (error) throw error;
      return data as ShippingRate[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Omit<ShippingRate, 'id'> & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('shipping_rates')
          .update(data)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shipping_rates')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
      toast.success(editingRate ? 'Rate updated' : 'Rate created');
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save rate');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shipping_rates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
      toast.success('Rate deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete rate');
    },
  });

  const openDialog = (rate?: ShippingRate) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        provider: rate.provider,
        service_name: rate.service_name,
        service_code: rate.service_code,
        max_weight_kg: rate.max_weight_kg,
        max_length_cm: rate.max_length_cm,
        max_width_cm: rate.max_width_cm,
        max_height_cm: rate.max_height_cm,
        price_zar: rate.price_zar,
        description: rate.description,
        is_active: rate.is_active,
        sort_order: rate.sort_order,
      });
    } else {
      setEditingRate(null);
      setFormData(emptyRate);
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRate(null);
    setFormData(emptyRate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editingRate ? { ...formData, id: editingRate.id } : formData);
  };

  const getProviderIcon = (provider: string) => {
    if (provider.startsWith('pudo')) return <Package className="h-4 w-4" />;
    return <Truck className="h-4 w-4" />;
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'pudo': return 'PUDO Door/Locker';
      case 'pudo_locker': return 'PUDO Locker-to-Locker';
      case 'courier_guy': return 'The Courier Guy';
      default: return provider;
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Shipping Rates</h1>
            <p className="text-muted-foreground">Manage shipping rates for PUDO and courier services</p>
          </div>
          <Button onClick={() => openDialog()} className="btn-sunset">
            <Plus className="h-4 w-4 mr-2" />
            Add Rate
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipping Rate Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading rates...</div>
            ) : rates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No shipping rates configured</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Max Weight</TableHead>
                    <TableHead>Max Dimensions (L×W×H)</TableHead>
                    <TableHead className="text-right">Price (ZAR)</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getProviderIcon(rate.provider)}
                          <span>{getProviderLabel(rate.provider)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{rate.service_name}</TableCell>
                      <TableCell>{rate.max_weight_kg} kg</TableCell>
                      <TableCell>
                        {rate.max_length_cm && rate.max_width_cm && rate.max_height_cm
                          ? `${rate.max_length_cm}×${rate.max_width_cm}×${rate.max_height_cm} cm`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">R{rate.price_zar.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${rate.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {rate.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDialog(rate)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(rate.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRate ? 'Edit Shipping Rate' : 'Add Shipping Rate'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(v) => setFormData({ ...formData, provider: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pudo">PUDO Door/Locker</SelectItem>
                      <SelectItem value="pudo_locker">PUDO Locker-to-Locker</SelectItem>
                      <SelectItem value="courier_guy">The Courier Guy</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    placeholder="e.g., Medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.max_weight_kg}
                    onChange={(e) => setFormData({ ...formData, max_weight_kg: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (ZAR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_zar}
                    onChange={(e) => setFormData({ ...formData, price_zar: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Length (cm)</Label>
                  <Input
                    type="number"
                    value={formData.max_length_cm || ''}
                    onChange={(e) => setFormData({ ...formData, max_length_cm: parseFloat(e.target.value) || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Width (cm)</Label>
                  <Input
                    type="number"
                    value={formData.max_width_cm || ''}
                    onChange={(e) => setFormData({ ...formData, max_width_cm: parseFloat(e.target.value) || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    value={formData.max_height_cm || ''}
                    onChange={(e) => setFormData({ ...formData, max_height_cm: parseFloat(e.target.value) || null })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-sunset" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Rate'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default ShippingRates;
