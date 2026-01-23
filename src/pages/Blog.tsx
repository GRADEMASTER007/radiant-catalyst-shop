import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  User,
  Search,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  read_time_minutes: number | null;
  category: string | null;
  tags: string[] | null;
  featured_image_url: string | null;
  is_featured: boolean | null;
}

const POSTS_PER_PAGE = 9;

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch blog posts from database
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, author_name, published_at, created_at, read_time_minutes, category, tags, featured_image_url, is_featured')
        .eq('is_published', true)
        .order('published_at', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data as BlogPost[];
    }
  });

  // Extract unique categories from posts
  const categories = ["All", ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const featuredPosts = posts.filter((post) => post.is_featured);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 pt-32 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-4">DFSA Blog</Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Dragon Fruit Farming Insights
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Expert advice, farming tips, and industry news from South Africa's premier dragon fruit nursery
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Featured Posts */}
      {!isLoading && featuredPosts.length > 0 && !searchQuery && selectedCategory === "All" && currentPage === 1 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">Featured</span> Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img
                        src={post.featured_image_url || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge className="absolute top-4 left-4">{post.category || 'General'}</Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author_name || 'DFSA Team'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.published_at || post.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.read_time_minutes || 5} min read
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Filter & Posts */}
      {!isLoading && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedCategory(category); setCurrentPage(1); }}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Posts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img
                        src={post.featured_image_url || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {post.category || 'General'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.read_time_minutes || 5} min
                        </span>
                      </div>
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.published_at || post.created_at)}
                        </div>
                        <Link
                          to={`/blog/${post.slug}`}
                          className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                        >
                          Read More
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No articles found matching your criteria.</p>
                <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setCurrentPage(1); }}>
                  Clear filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Subscribe to our newsletter for the latest dragon fruit farming tips, industry news, and exclusive offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-primary-foreground text-foreground"
            />
            <Button variant="secondary">Subscribe</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 Dragon Fruit South Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
