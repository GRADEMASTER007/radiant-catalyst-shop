import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  ArrowLeft, 
  Share2,
  Facebook,
  Twitter,
  Linkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import { toast } from "sonner";
import { useEffect } from "react";

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      
      // Increment view count
      await supabase
        .from('blog_posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      return data;
    },
    enabled: !!slug,
  });

  // Dynamic meta tags and JSON-LD for SEO
  useEffect(() => {
    if (!post) return;

    const siteUrl = window.location.origin;
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    const title = post.meta_title || post.title;
    const description = post.meta_description || post.excerpt || post.title;

    // Update document title
    document.title = `${title} | Gut Health Probiotics South Africa`;

    // Update or create meta tags
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('description', description);
    setMeta('keywords', (post.tags || []).join(', '));
    setMeta('author', post.author_name || 'Gut Health Probiotics South Africa');
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'article', true);
    setMeta('og:url', postUrl, true);
    setMeta('og:site_name', 'Gut Health Probiotics South Africa', true);
    if (post.featured_image_url) {
      setMeta('og:image', post.featured_image_url, true);
    }
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (post.featured_image_url) {
      setMeta('twitter:image', post.featured_image_url);
    }
    setMeta('article:published_time', post.published_at || post.created_at, true);
    setMeta('article:author', post.author_name || 'Gut Health Probiotics South Africa', true);
    setMeta('article:section', post.category || 'General', true);
    (post.tags || []).forEach(tag => {
      setMeta(`article:tag:${tag}`, tag, true);
    });

    // Add canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = postUrl;

    // Add JSON-LD structured data
    let jsonLd = document.getElementById('blog-jsonld');
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.id = 'blog-jsonld';
      jsonLd.setAttribute('type', 'application/ld+json');
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "image": post.featured_image_url || `${siteUrl}/og-image.png`,
      "author": {
        "@type": "Person",
        "name": post.author_name || "Gut Health Probiotics South Africa"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Gut Health Probiotics South Africa",
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/images/logo-watermark.jpg`
        }
      },
      "datePublished": post.published_at || post.created_at,
      "dateModified": post.updated_at || post.created_at,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": postUrl
      },
      "keywords": (post.tags || []).join(', '),
      "articleSection": post.category || "General",
      "wordCount": post.content?.split(/\s+/).length || 0,
      "timeRequired": `PT${post.read_time_minutes || 5}M`
    });

    return () => {
      // Cleanup on unmount
      document.getElementById('blog-jsonld')?.remove();
      document.querySelector('link[rel="canonical"]')?.remove();
    };
  }, [post]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      return;
    }

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="aspect-video w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-24">
          <div className="container mx-auto px-4 text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const publishedDate = post.published_at || post.created_at;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24">
        {/* Back Button */}
        <div className="container mx-auto px-4 max-w-4xl mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>

        <article className="container mx-auto px-4 max-w-4xl">
          {/* Featured Image - ON TOP, before title */}
          {post.featured_image_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[21/9] rounded-xl overflow-hidden mb-8"
            >
              <img
                src={post.featured_image_url}
                alt={post.meta_description || post.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
              {/* Logo watermark */}
              <img
                src="/images/logo-watermark.jpg"
                alt="Gut Health Probiotics SA"
                className="absolute bottom-3 right-3 w-12 h-12 rounded-full opacity-80 shadow-lg"
              />
            </motion.div>
          )}

          {/* Article Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Badge>{post.category || 'General'}</Badge>
              {post.is_featured && <Badge variant="secondary">Featured</Badge>}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-6">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author_name || 'Gut Health SA Team'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <time dateTime={publishedDate}>
                  {new Date(publishedDate).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.read_time_minutes} min read
              </span>
            </div>
          </motion.header>

          {/* Content - no inline images from content, only formatted text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg dark:prose-invert max-w-none mb-12
              prose-headings:font-display prose-headings:leading-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:mb-5
              prose-li:leading-relaxed
              prose-a:text-primary prose-a:underline-offset-2
              prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              prose-img:hidden"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8 pt-4 border-t">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Share Buttons */}
          <div className="border-t pt-8 mb-12">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share this article
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('copy')}>
                Copy Link
              </Button>
            </div>
          </div>
        </article>
      </main>

      <footer className="py-8 bg-gut-forest text-white">
        <div className="container mx-auto px-4 text-center text-white/70">
          <p>© 2026 Gut Health Probiotics South Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
