import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, Sprout, Store, Package, Truck, Leaf, Users } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

interface PlanFeatures {
  max_products?: number;
  featured_placement?: boolean;
  international_promotion?: boolean;
  support?: string;
  commission_percent?: number;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_zar: number;
  duration_months: number;
  features: PlanFeatures | null;
}

const steps = [
  { number: '01', title: 'Sign up', description: 'Create your free account in a couple of minutes.' },
  { number: '02', title: 'Choose a plan', description: 'Pick the seller plan that fits your business.' },
  { number: '03', title: 'List your products', description: 'Add up to 20 products with photos and prices.' },
  { number: '04', title: 'Get orders', description: 'Buyers find you and place orders straight to you.' },
];

const sellerTypes = [
  { icon: Sprout, label: 'Fermentation cultures' },
  { icon: Store, label: 'Small bakeries' },
  { icon: Leaf, label: 'Growers' },
  { icon: Package, label: 'Herbalists' },
  { icon: Truck, label: 'Health food makers' },
];

function formatZAR(n: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n);
}

export default function Sell() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['seller-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_zar', { ascending: true });
      if (error) throw error;
      return data as unknown as Plan[];
    },
  });

  const canonical = typeof window !== 'undefined' ? `${window.location.origin}/sell` : '';

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Sell Your Living Foods & Cultures | Living Culture Health"
        description="Open your own storefront and sell fermentation cultures, baked goods, herbs and health foods to buyers across South Africa and beyond."
        canonical={canonical}
      />

      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-card-strong rounded-3xl p-10 md:p-16"
          >
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
              Sell your homemade goods on an{' '}
              <span className="text-gradient-probiotic">international platform</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Living Culture Health helps small South African sellers of cultures, ferments,
              bakes and healthy foods reach buyers near and far — no tech skills needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="btn-sunset">
                <Link to="/sell/start">Start selling</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/directory">See a storefront example</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <span className="text-4xl font-display font-bold text-gradient-probiotic">
                  {step.number}
                </span>
                <h3 className="font-display text-xl font-semibold mt-3 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-4">Seller plans</h2>
          <p className="text-center text-muted-foreground mb-12">
            Simple monthly pricing. Choose the plan that suits where you are today.
          </p>
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading plans…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {plans?.map((plan) => {
                const f = plan.features || {};
                return (
                  <div key={plan.id} className="glass-card rounded-2xl p-8 flex flex-col">
                    <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    )}
                    <p className="font-display text-4xl font-bold mt-4 text-gradient-probiotic">
                      {formatZAR(plan.price_zar)}
                      <span className="text-base text-muted-foreground font-normal">
                        {' '}/ {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}
                      </span>
                    </p>
                    <ul className="space-y-3 mt-6 flex-1">
                      {typeof f.max_products === 'number' && (
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          List up to {f.max_products} products
                        </li>
                      )}
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                        {f.featured_placement ? 'Featured placement on the site' : 'Standard listing placement'}
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                        {f.international_promotion
                          ? 'Promoted to international buyers'
                          : 'Promoted to South African buyers'}
                      </li>
                      {f.support && (
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          {f.support} support
                        </li>
                      )}
                      {typeof f.commission_percent === 'number' && (
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          Only {f.commission_percent}% commission on sales
                        </li>
                      )}
                    </ul>
                    <Button asChild className="mt-6 btn-sunset">
                      <Link to={`/sell/start?plan=${plan.id}`}>Choose {plan.name}</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Who sells here */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-10">Who sells here</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {sellerTypes.map((s) => (
              <div key={s.label} className="glass-card rounded-xl px-6 py-5 flex items-center gap-3">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-10 flex items-center justify-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="glass-card rounded-2xl p-4">
            <AccordionItem value="limit">
              <AccordionTrigger>Why is there a 20 product limit?</AccordionTrigger>
              <AccordionContent>
                To keep every storefront easy to browse and to keep quality high, each seller can
                list up to 20 products at a time. We may adjust this limit in future — check back
                here for the latest.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="lapse">
              <AccordionTrigger>What happens if my plan lapses?</AccordionTrigger>
              <AccordionContent>
                If your subscription isn't renewed, your storefront and products are hidden from
                buyers until you renew. Your information isn't deleted, so you can pick up right
                where you left off. (Exact grace periods may be updated by the site owner.)
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="found">
              <AccordionTrigger>How do buyers find me?</AccordionTrigger>
              <AccordionContent>
                Your products appear in our marketplace search and categories, and your storefront
                has its own shareable page. Featured plans get extra visibility on the homepage
                and directory.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="commission">
              <AccordionTrigger>How does commission work?</AccordionTrigger>
              <AccordionContent>
                Each plan lists a commission percentage on sales made through the platform. This
                covers payment processing and platform upkeep, and may be updated from time to
                time — your plan page will always show the current rate.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="restricted">
              <AccordionTrigger>What can't be sold here?</AccordionTrigger>
              <AccordionContent>
                We're a marketplace for living foods, cultures and related health products. Items
                that aren't legal to sell in South Africa, or that don't fit our food and wellness
                focus, aren't permitted. The site owner reviews listings and may remove anything
                that doesn't meet these guidelines.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center glass-card-strong rounded-3xl p-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to open your <span className="text-gradient-probiotic">storefront</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            It only takes a few minutes to get started.
          </p>
          <Button asChild size="lg" className="btn-sunset">
            <Link to="/sell/start">Start selling</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
