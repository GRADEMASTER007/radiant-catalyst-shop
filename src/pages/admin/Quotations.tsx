import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Search, Trash2, Download, Eye, FileText, Loader2, X } from 'lucide-react';
import { generateQuotationPDF } from '@/lib/quotation-generator';

interface QuotationItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface QuotationForm {
  customer_name: string;
  company_name: string;
  phone: string;
  email: string;
  billing_address: string;
  notes: string;
  vat_enabled: boolean;
  items: QuotationItem[];
}

const VAT_RATE = 0.15;

const emptyForm: QuotationForm = {
  customer_name: '',
  company_name: '',
  phone: '',
  email: '',
  billing_address: '',
  notes: '',
  vat_enabled: true,
  items: [],
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(v);

export default function Quotations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [form, setForm] = useState<QuotationForm>({ ...emptyForm });
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Fetch quotations
  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Search products
  const handleProductSearch = async (query: string) => {
    setProductSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, price_zar')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const addProduct = (product: any) => {
    const exists = form.items.find(i => i.product_id === product.id);
    if (exists) { toast.info('Product already added'); return; }
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: 1,
        unit_price: product.price_zar,
        total_price: product.price_zar,
      }],
    }));
    setProductSearch('');
    setSearchResults([]);
  };

  const updateItem = (index: number, field: 'quantity' | 'unit_price', value: number) => {
    setForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value, total_price: field === 'quantity' ? value * items[index].unit_price : items[index].quantity * value };
      return { ...prev, items };
    });
  };

  const removeItem = (index: number) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const subtotal = form.items.reduce((s, i) => s + i.total_price, 0);
  const vat = form.vat_enabled ? subtotal * VAT_RATE : 0;
  const total = subtotal + vat;

  // Save quotation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('quotations').insert({
        customer_name: form.customer_name,
        company_name: form.company_name || null,
        phone: form.phone || null,
        email: form.email || null,
        billing_address: form.billing_address || null,
        items: form.items as any,
        subtotal_zar: subtotal,
        vat_zar: vat,
        total_zar: total,
        vat_enabled: form.vat_enabled,
        notes: form.notes || null,
        status: 'sent',
        created_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Quotation saved');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setShowCreate(false);
      setForm({ ...emptyForm });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSaveAndDownload = async () => {
    if (!form.customer_name || form.items.length === 0) {
      toast.error('Please add customer name and at least one product');
      return;
    }
    // Save first
    await saveMutation.mutateAsync();
    // Generate PDF
    generateQuotationPDF({
      quotation_number: 'DRAFT',
      customer_name: form.customer_name,
      company_name: form.company_name,
      phone: form.phone,
      email: form.email,
      billing_address: form.billing_address,
      items: form.items,
      subtotal_zar: subtotal,
      vat_zar: vat,
      total_zar: total,
      vat_enabled: form.vat_enabled,
      notes: form.notes,
      created_at: new Date().toISOString(),
    });
  };

  const handleDownloadExisting = (q: any) => {
    generateQuotationPDF({
      quotation_number: q.quotation_number,
      customer_name: q.customer_name,
      company_name: q.company_name,
      phone: q.phone,
      email: q.email,
      billing_address: q.billing_address,
      items: q.items as QuotationItem[],
      subtotal_zar: q.subtotal_zar,
      vat_zar: q.vat_zar,
      total_zar: q.total_zar,
      vat_enabled: q.vat_enabled,
      notes: q.notes,
      created_at: q.created_at,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Quotations</h1>
          <p className="text-muted-foreground">Create and manage quotations & invoices</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm }); setShowCreate(true); }} className="btn-sunset">
          <Plus className="h-4 w-4 mr-2" /> Create Quotation
        </Button>
      </div>

      {/* Quotations List */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : quotations.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No quotations yet</TableCell></TableRow>
              ) : quotations.map((q: any) => (
                <TableRow key={q.id}>
                  <TableCell className="font-mono text-sm">{q.quotation_number}</TableCell>
                  <TableCell>{q.customer_name}</TableCell>
                  <TableCell>{q.company_name || '-'}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(q.total_zar)}</TableCell>
                  <TableCell>{new Date(q.created_at).toLocaleDateString('en-ZA')}</TableCell>
                  <TableCell><Badge variant="secondary">{q.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setShowDetail(q)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadExisting(q)}><Download className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Quotation Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Create Quotation
            </DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Customer Details</h3>
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Billing Address</Label>
                <Textarea value={form.billing_address} onChange={e => setForm(p => ({ ...p, billing_address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.vat_enabled} onCheckedChange={v => setForm(p => ({ ...p, vat_enabled: v }))} />
                <Label>Include VAT (15%)</Label>
              </div>
            </div>

            {/* Products */}
            <div className="space-y-4">
              <h3 className="font-semibold">Products</h3>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search products by name or SKU..."
                  value={productSearch}
                  onChange={e => handleProductSearch(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((p: any) => (
                      <button
                        key={p.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between"
                        onClick={() => addProduct(p)}
                      >
                        <span>{p.name}</span>
                        <span className="text-muted-foreground">{formatCurrency(p.price_zar)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {form.items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Search and add products above</p>
              ) : (
                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.product_sku}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Qty</Label>
                          <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="h-8" />
                        </div>
                        <div>
                          <Label className="text-xs">Unit Price</Label>
                          <Input type="number" min={0} step={0.01} value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="h-8" />
                        </div>
                        <div>
                          <Label className="text-xs">Total</Label>
                          <p className="h-8 flex items-center font-semibold text-sm">{formatCurrency(item.total_price)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {form.vat_enabled && <div className="flex justify-between"><span>VAT (15%)</span><span>{formatCurrency(vat)}</span></div>}
                <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>

              <Button onClick={handleSaveAndDownload} disabled={saveMutation.isPending} className="w-full btn-sunset">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Save & Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quotation {showDetail?.quotation_number}</DialogTitle>
          </DialogHeader>
          {showDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Customer:</span> {showDetail.customer_name}</div>
                {showDetail.company_name && <div><span className="text-muted-foreground">Company:</span> {showDetail.company_name}</div>}
                {showDetail.email && <div><span className="text-muted-foreground">Email:</span> {showDetail.email}</div>}
                {showDetail.phone && <div><span className="text-muted-foreground">Phone:</span> {showDetail.phone}</div>}
              </div>
              {showDetail.billing_address && (
                <div className="text-sm"><span className="text-muted-foreground">Address:</span> {showDetail.billing_address}</div>
              )}
              <Separator />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(showDetail.items as QuotationItem[]).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell>{formatCurrency(item.total_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-sm space-y-1 text-right">
                <div>Subtotal: {formatCurrency(showDetail.subtotal_zar)}</div>
                {showDetail.vat_enabled && <div>VAT: {formatCurrency(showDetail.vat_zar)}</div>}
                <div className="font-bold text-base">Total: {formatCurrency(showDetail.total_zar)}</div>
              </div>
              <Button onClick={() => handleDownloadExisting(showDetail)} className="w-full">
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
