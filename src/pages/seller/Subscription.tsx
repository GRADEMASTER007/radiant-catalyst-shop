import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSellerListing, useSellerPlans, useSellerSubscription, useSellerProfile } from '@/hooks/use-seller';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const currency = (n: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n);

type Provider = 'payfast' | 'paypal';

export default function SellerSubscriptionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: listing } = useSellerListing();
  const { data: profile } = useSellerProfile();
  const { data: plans, isLoading: plansLoading } = useSellerPlans();
  const { data: history, isLoading: historyLoading } = useSellerSubscription();

  const [provider, setProvider] = useState<Provider>('payfast');
  const [payfastFields, setPayfastFields] = useState<Record<string, string> | null>(null);
  const [payfastUrl, setPayfastUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const choosePlan = useMutation({
    mutationFn: async (planId: string) => {
      if (!listing) throw new Error('You need a storefront before choosing a plan.');
      const { data, error } = await supabase.functions.invoke('seller-subscription', {
        body: { businessId: listing.id, planId, provider },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.formFields && data?.actionUrl) {
        setPayfastFields(data.formFields);
        setPayfastUrl(data.actionUrl);
        toast({ title: "Taking you to pay", description: 'Redirecting you to complete payment.' });
        setTimeout(() => formRef.current?.submit(), 50);
        return;
      }
      if (data?.redirectUrl) {
        toast({ title: 'Taking you to pay', description: 'Redirecting you to complete payment.' });
        window.location.assign(data.redirectUrl);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      queryClient.invalidateQueries({ queryKey: ['seller-subscriptions'] });
      toast({ title: 'Plan updated', description: 'Your subscription has been updated.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Could not update plan',
        description: error?.message ?? 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const isActive = profile?.isActive ?? false;
  const planName = profile?.planName ?? 'No active plan';
  const planPrice = profile?.planPrice;
  const expiresAt = profile?.expiresAt;

  return (
    <div className="space-y-8">
      <div className="glass-card p-6">
        <h2 className="mb-4 font-display text-xl">Your plan</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-medium">{planName}</p>
            {planPrice != null && <p className="text-muted-foreground">{currency(planPrice)} / month</p>}
            {expiresAt && (
              <p className="text-sm text-muted-foreground">
                Renews on {new Date(expiresAt).toLocaleDateString('en-ZA')}
              </p>
            )}
          </div>
          <Badge variant={isActive ? 'secondary' : 'outline'}>{isActive ? 'Active' : 'Inactive'}</Badge>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          If your plan lapses, your storefront will stop appearing to buyers and you won't be able to
          list new products until you subscribe again.
        </p>
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg">Choose how you'd like to pay</h3>
        <div className="mb-6 inline-flex rounded-lg border border-border p-1">
          {(['payfast', 'paypal'] as Provider[]).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={cn(
                'rounded-md px-4 py-2 text-sm transition-colors',
                provider === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {p === 'payfast' ? 'PayFast card' : 'PayPal'}
            </button>
          ))}
        </div>

        {plansLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {plans?.map((plan) => {
              const features = (plan.features ?? {}) as any;
              const isCurrent = isActive && planName === plan.name;
              return (
                <div key={plan.id} className="glass-card flex flex-col p-6">
                  <h4 className="font-display text-lg">{plan.name}</h4>
                  <p className="mt-1 font-display text-2xl">{currency(plan.price_zar)}<span className="text-sm text-muted-foreground"> / month</span></p>
                  {plan.description && <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>}
                  <ul className="my-4 flex-1 space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Up to {features.max_products ?? 20} products
                    </li>
                    {features.featured_placement && (
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Featured placement
                      </li>
                    )}
                    {features.international_promotion && (
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        International promotion
                      </li>
                    )}
                    {features.support && (
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {features.support} support
                      </li>
                    )}
                    {features.commission_percent != null && (
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {features.commission_percent}% commission
                      </li>
                    )}
                  </ul>
                  <Button
                    disabled={isCurrent || choosePlan.isPending}
                    onClick={() => choosePlan.mutate(plan.id)}
                  >
                    {isCurrent ? 'Current plan' : 'Choose plan'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {payfastFields && payfastUrl && (
        <form ref={formRef} action={payfastUrl} method="post" className="hidden">
          {Object.entries(payfastFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}

      <div className="glass-card p-6">
        <h3 className="mb-4 font-display text-lg">Payment history</h3>
        {historyLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : history && history.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell>{row.subscription_plans?.name ?? '—'}</TableCell>
                  <TableCell>{row.amount_paid_zar != null ? currency(row.amount_paid_zar) : '—'}</TableCell>
                  <TableCell className="capitalize">{row.status ?? '—'}</TableCell>
                  <TableCell>{row.starts_at ? new Date(row.starts_at).toLocaleDateString('en-ZA') : '—'}</TableCell>
                  <TableCell>{row.expires_at ? new Date(row.expires_at).toLocaleDateString('en-ZA') : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No payment history yet.</p>
        )}
      </div>
    </div>
  );
}
