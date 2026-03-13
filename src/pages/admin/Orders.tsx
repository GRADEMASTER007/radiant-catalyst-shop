import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Eye, Loader2, Package, Truck, CheckCircle, FileText, Download, Sprout, Mail, Save, StickyNote, Edit, Trash2, XCircle, Clock, CreditCard, MapPin, Phone, User } from 'lucide-react';
import { motion } from 'motion/react';
import { generateInvoicePDF } from '@/lib/invoice-generator';
import { sendRootingReadyEmail } from '@/lib/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  processing: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  paid: 'bg-green-500/20 text-green-500 border-green-500/30',
  shipped: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  delivered: 'bg-green-600/20 text-green-600 border-green-600/30',
  cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
  expired: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
  awaiting_payment: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
};

const paymentStatusColors: Record<string, string> = {
  paid: 'bg-green-500/20 text-green-500 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  failed: 'bg-red-500/20 text-red-500 border-red-500/30',
  abandoned: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
  refunded: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  processing: <Package className="h-3 w-3" />,
  paid: <CreditCard className="h-3 w-3" />,
  shipped: <Truck className="h-3 w-3" />,
  delivered: <CheckCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
  expired: <Clock className="h-3 w-3" />,
  awaiting_payment: <CreditCard className="h-3 w-3" />,
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<string | null>(null);
  const [isSendingRootingEmail, setIsSendingRootingEmail] = useState<string | null>(null);
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter, paymentFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (paymentFilter !== 'all') {
        query = query.eq('payment_status', paymentFilter);
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

  const updateRootingStatusMutation = useMutation({
    mutationFn: async ({ id, rootingStatus }: { id: string; rootingStatus: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ rooting_status: rootingStatus } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Rooting status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateOrderDetailsMutation = useMutation({
    mutationFn: async ({ id, tracking_number, notes }: { id: string; tracking_number: string; notes: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number, notes } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order details updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);
      if (itemsError) throw itemsError;

      // Then delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order deleted successfully');
      setOrderToDelete(null);
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

  // Extract customer notes (non-rooting notes)
  const getCustomerNotes = (order: any) => {
    if (!order.notes) return null;
    const notes = order.notes;
    // Remove rooting service line if present
    const lines = notes.split('\n').filter((line: string) => !line.includes('Rooting Service:'));
    return lines.join('\n').trim() || null;
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
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">✅ Paid</SelectItem>
            <SelectItem value="pending">⏳ Pending</SelectItem>
            <SelectItem value="failed">❌ Failed</SelectItem>
            <SelectItem value="abandoned">🚫 Abandoned</SelectItem>
            <SelectItem value="refunded">↩️ Refunded</SelectItem>
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
                    <Badge variant="outline" className={`${statusColors[order.status] || ''} gap-1`}>
                      {statusIcons[order.status]}
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${
                      order.payment_status === 'paid'
                        ? 'bg-green-500/20 text-green-500 border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                    } gap-1`}>
                      <CreditCard className="h-3 w-3" />
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedOrder(order);
                          setEditTrackingNumber(order.tracking_number || '');
                          setEditNotes(order.notes || '');
                        }}
                        title="View & Edit Details"
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
                            <Sprout className="h-4 w-4 text-secondary" />
                          )}
                        </Button>
                      )}
                      {(order.status === 'pending' || order.status === 'paid') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'shipped' })}
                          title="Mark as Shipped"
                        >
                          <Truck className="h-4 w-4 text-primary" />
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOrderToDelete(order)}
                        title="Delete Order"
                        className="text-destructive hover:text-destructive"
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
      </motion.div>

      {/* Order Details Modal */}
      <Dialog 
        open={!!selectedOrder} 
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              Order {selectedOrder?.order_number}
            </DialogTitle>
            <DialogDescription>
              View and manage order details, update status, and track shipment
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status & Payment Overview */}
              <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg">
                <Badge variant="outline" className={`${statusColors[selectedOrder.status] || ''} gap-1 text-sm px-3 py-1`}>
                  {statusIcons[selectedOrder.status]}
                  Order: {selectedOrder.status}
                </Badge>
                <Badge variant="outline" className={`${
                  selectedOrder.payment_status === 'paid'
                    ? 'bg-green-500/20 text-green-500 border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                } gap-1 text-sm px-3 py-1`}>
                  <CreditCard className="h-3 w-3" />
                  Payment: {selectedOrder.payment_status}
                </Badge>
                <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(selectedOrder.created_at)}
                </Badge>
              </div>

              {/* Customer & Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Customer Details</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {selectedOrder.guest_email}
                    </div>
                    {(selectedOrder.shipping_address as any)?.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {(selectedOrder.shipping_address as any).phone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Shipping Address</h4>
                  </div>
                  {selectedOrder.shipping_address ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">{(selectedOrder.shipping_address as any).name}</p>
                      <p>{(selectedOrder.shipping_address as any).address}</p>
                      <p>{(selectedOrder.shipping_address as any).city}, {(selectedOrder.shipping_address as any).province}</p>
                      <p>{(selectedOrder.shipping_address as any).postalCode}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No address provided</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-muted/50 border-b">
                  <Package className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Order Items</h4>
                </div>
                <div className="divide-y">
                  {orderItems?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.product_sku || 'N/A'} · Qty: {item.quantity} × {formatCurrency(item.unit_price_zar)}
                        </p>
                      </div>
                      <p className="font-semibold text-primary">{formatCurrency(item.total_price_zar)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Notes (if any) */}
              {getCustomerNotes(selectedOrder) && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote className="h-4 w-4 text-amber-600" />
                    <h4 className="font-medium text-amber-700">Customer Notes</h4>
                  </div>
                  <p className="text-sm text-amber-800">{getCustomerNotes(selectedOrder)}</p>
                </div>
              )}

              {/* Tracking Number and Admin Notes Section */}
              <div className="p-4 rounded-lg border space-y-4">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Fulfillment Details</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tracking-number">Tracking Number</Label>
                    <Input
                      id="tracking-number"
                      value={editTrackingNumber}
                      onChange={(e) => setEditTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping-method">Shipping Method</Label>
                    <Input
                      id="shipping-method"
                      value={selectedOrder.shipping_method || 'Not specified'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="order-notes">Internal Notes (Admin Only)</Label>
                  <Textarea
                    id="order-notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add internal notes about this order..."
                    className="min-h-[60px]"
                  />
                </div>

                <Button
                  onClick={() => {
                    updateOrderDetailsMutation.mutate({
                      id: selectedOrder.id,
                      tracking_number: editTrackingNumber,
                      notes: editNotes,
                    });
                    setSelectedOrder({ 
                      ...selectedOrder, 
                      tracking_number: editTrackingNumber,
                      notes: editNotes 
                    });
                  }}
                  disabled={updateOrderDetailsMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  {updateOrderDetailsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Details
                    </>
                  )}
                </Button>
              </div>

              {/* Order Summary */}
              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal_zar)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(selectedOrder.shipping_cost_zar || 0)}</span>
                </div>
                {(selectedOrder.discount_zar > 0 || selectedOrder.coupon_code) && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount {selectedOrder.coupon_code && <span className="font-mono text-xs">({selectedOrder.coupon_code})</span>}</span>
                    <span>-{formatCurrency(selectedOrder.coupon_discount_zar || selectedOrder.discount_zar || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedOrder.total_zar)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Select
                  value={selectedOrder.status}
                  onValueChange={(status) => {
                    updateStatusMutation.mutate({ id: selectedOrder.id, status });
                    setSelectedOrder({ ...selectedOrder, status });
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="processing">📦 Processing</SelectItem>
                    <SelectItem value="paid">💳 Paid</SelectItem>
                    <SelectItem value="shipped">🚚 Shipped</SelectItem>
                    <SelectItem value="delivered">✅ Delivered</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelled</SelectItem>
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
                      Invoice
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

                <Button
                  variant="destructive"
                  onClick={() => {
                    setSelectedOrder(null);
                    setOrderToDelete(selectedOrder);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order <span className="font-mono font-bold">{orderToDelete?.order_number}</span>? 
              This action cannot be undone and will permanently remove the order and all associated items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => orderToDelete && deleteOrderMutation.mutate(orderToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
