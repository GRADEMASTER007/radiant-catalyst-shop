import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Eye, Loader2, Package, Truck, CheckCircle, FileText, Download, Sprout, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateInvoicePDF } from '@/lib/invoice-generator';
import { sendRootingReadyEmail } from '@/lib/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  processing: 'bg-blue-500/20 text-blue-500',
  paid: 'bg-green-500/20 text-green-500',
  shipped: 'bg-purple-500/20 text-purple-500',
  delivered: 'bg-green-600/20 text-green-600',
  cancelled: 'bg-red-500/20 text-red-500',
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<string | null>(null);
  const [isSendingRootingEmail, setIsSendingRootingEmail] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (search) {
        query = query.or(`order_number.ilike.%${search}%,guest_email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', selectedOrder?.id],
    enabled: !!selectedOrder,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', selectedOrder.id);
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'shipped') {
        updates.shipped_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDownloadInvoice = async (order: any) => {
    setIsGeneratingInvoice(order.id);
    try {
      // Fetch order items
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      
      if (error) throw error;
      
      generateInvoicePDF(order, items || []);
      toast.success('Invoice downloaded!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate invoice');
    } finally {
      setIsGeneratingInvoice(null);
    }
  };

  const handleSendRootingReadyEmail = async (order: any) => {
    const email = order.guest_email || (order.shipping_address as any)?.email;
    if (!email) {
      toast.error('No email address found for this order');
      return;
    }
    
    setIsSendingRootingEmail(order.id);
    try {
      const result = await sendRootingReadyEmail(order.id, email);
      if (result.success) {
        toast.success('Rooting ready notification sent!');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setIsSendingRootingEmail(null);
    }
  };

  // Check if order has rooting service
  const hasRootingService = (order: any) => {
    return order.notes && order.notes.includes('Rooting Service:');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : orders?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No orders found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    {order.guest_email || 'Guest'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.total_zar)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status] || ''}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.payment_status === 'paid'
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {order.payment_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedOrder(order)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadInvoice(order)}
                        disabled={isGeneratingInvoice === order.id}
                        title="Download Invoice"
                      >
                        {isGeneratingInvoice === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                      {hasRootingService(order) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendRootingReadyEmail(order)}
                          disabled={isSendingRootingEmail === order.id}
                          title="Send Rooting Ready Notification"
                        >
                          {isSendingRootingEmail === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sprout className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      )}
                      {order.status === 'paid' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'shipped' })}
                          title="Mark as Shipped"
                        >
                          <Truck className="h-4 w-4 text-secondary" />
                        </Button>
                      )}
                      {order.status === 'shipped' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'delivered' })}
                          title="Mark as Delivered"
                        >
                          <CheckCircle className="h-4 w-4 text-secondary" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Customer</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.guest_email}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Shipping Address</h4>
                  {selectedOrder.shipping_address ? (
                    <p className="text-sm text-muted-foreground">
                      {(selectedOrder.shipping_address as any).name}<br />
                      {(selectedOrder.shipping_address as any).address}<br />
                      {(selectedOrder.shipping_address as any).city}, {(selectedOrder.shipping_address as any).province}<br />
                      {(selectedOrder.shipping_address as any).postalCode}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No address</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {orderItems?.map((item) => (
                    <div key={item.id} className="flex justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × {formatCurrency(item.unit_price_zar)}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.total_price_zar)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal_zar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatCurrency(selectedOrder.shipping_cost_zar || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total_zar)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Select
                  value={selectedOrder.status}
                  onValueChange={(status) => {
                    updateStatusMutation.mutate({ id: selectedOrder.id, status });
                    setSelectedOrder({ ...selectedOrder, status });
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  disabled={isGeneratingInvoice === selectedOrder.id}
                  className="btn-sunset"
                >
                  {isGeneratingInvoice === selectedOrder.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </>
                  )}
                </Button>

                {hasRootingService(selectedOrder) && (
                  <Button
                    onClick={() => handleSendRootingReadyEmail(selectedOrder)}
                    disabled={isSendingRootingEmail === selectedOrder.id}
                    variant="outline"
                    className="border-secondary text-secondary hover:bg-secondary/10"
                  >
                    {isSendingRootingEmail === selectedOrder.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Sprout className="h-4 w-4 mr-2" />
                        Rooting Ready
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
