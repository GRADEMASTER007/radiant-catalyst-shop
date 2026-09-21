import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { LogIn, UserPlus, Store, Loader2 } from 'lucide-react';

const CATEGORIES = [
  'Fermentation cultures',
  'Bakery & baked goods',
  'Growers & produce',
  'Herbalist & remedies',
  'Health foods',
  'Other',
];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

interface FormState {
  business_name: string;
  slug: string;
  category: string;
  description: string;
  story: string;
  phone: string;
  email: string;
  address: string;
  logo_url: string;
  cover_image_url: string;
}

const initialForm: FormState = {
  business_name: '',
  slug: '',
  category: '',
  description: '',
  story: '',
  phone: '',
  email: '',
  address: '',
  logo_url: '',
  cover_image_url: '',
};

export default function SellStart() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan');

  const [form, setForm] = useState<FormState>(initialForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: existingListing, isLoading: listingLoading } = useQuery({
    queryKey: ['seller-my-business-listing', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('business_listings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!slugTouched) {
      setForm((f) => ({ ...f, slug: slugify(f.business_name) }));
    }
  }, [form.business_name, slugTouched]);

  const validate = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.business_name.trim()) nextErrors.business_name = 'Please enter your business or brand name.';
    if (!form.slug.trim()) nextErrors.slug = 'Please choose a shop link.';
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) {
      nextErrors.slug = 'Shop links can only use lowercase letters, numbers and hyphens.';
    }
    if (!form.category) nextErrors.category = 'Please choose a category.';
    if (!form.description.trim()) nextErrors.description = 'Please add a short one-line description.';
    if (!form.phone.trim()) nextErrors.phone = 'Please add a contact phone number.';
    if (!form.email.trim()) nextErrors.email = 'Please add a contact email address.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'That email address doesn\'t look right.';

    if (!nextErrors.slug) {
      const { data, error } = await supabase
        .from('business_listings')
        .select('id')
        .eq('slug', form.slug)
        .maybeSingle();
      if (!error && data) {
        nextErrors.slug = 'That shop link is already taken — please try another.';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!user) return;
    setSubmitting(true);
    const isValid = await validate();
    if (!isValid) {
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from('business_listings').insert({
      user_id: user.id,
      business_name: form.business_name.trim(),
      slug: form.slug.trim(),
      category: form.category,
      description: [form.description.trim(), form.story.trim()].filter(Boolean).join('\n\n'),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim() || null,
      logo_url: form.logo_url || null,
      cover_image_url: form.cover_image_url || null,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    toast({
      title: 'Welcome aboard!',
      description: 'Your storefront details are saved. Choose a plan to go live.',
    });
    navigate(`/seller/subscription?new=1${plan ? `&plan=${plan}` : ''}`);
  };

  if (isLoading || (user && listingLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-8 text-center">
            <LogIn className="h-8 w-8 text-primary mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Already have an account?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in and come straight back here to set up your storefront.
            </p>
            <Button asChild className="w-full btn-sunset">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
          <div className="glass-card rounded-2xl p-8 text-center">
            <UserPlus className="h-8 w-8 text-primary mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">New here?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Create a free account in a couple of minutes, then return to this page.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/signup">Create an account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (existingListing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-10 max-w-lg w-full text-center">
          <Store className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">You already have a storefront</h2>
          <p className="text-sm text-muted-foreground mb-6">
            "{existingListing.business_name}" is already set up. Manage it or take a look at your
            public shop page.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="btn-sunset">
              <Link to="/seller">Go to seller dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/vendor/${existingListing.slug}`}>View my shop</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Set up your <span className="text-gradient-probiotic">storefront</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Tell us about your business — you can update all of this later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business or brand name *</Label>
            <Input
              id="business_name"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            />
            {errors.business_name && <p className="text-sm text-destructive">{errors.business_name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Your shop link</Label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">/vendor/</span>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: slugify(e.target.value) });
                }}
              />
            </div>
            {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short description *</Label>
            <Input
              id="description"
              placeholder="One line about what you sell"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="story">Tell buyers your story</Label>
            <Textarea
              id="story"
              rows={4}
              value={form.story}
              onChange={(e) => setForm({ ...form, story: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Town or city</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo (optional)</Label>
              <ImageUpload
                value={form.logo_url}
                onChange={(url) => setForm({ ...form, logo_url: url })}
                onRemove={() => setForm({ ...form, logo_url: '' })}
                folder="business-logos"
              />
            </div>
            <div className="space-y-2">
              <Label>Cover image (optional)</Label>
              <ImageUpload
                value={form.cover_image_url}
                onChange={(url) => setForm({ ...form, cover_image_url: url })}
                onRemove={() => setForm({ ...form, cover_image_url: '' })}
                folder="business-covers"
              />
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-destructive">
              We couldn't save your storefront: {submitError}
            </p>
          )}

          <Button type="submit" className="w-full btn-sunset" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create my storefront
          </Button>
        </form>
      </div>
    </div>
  );
}
