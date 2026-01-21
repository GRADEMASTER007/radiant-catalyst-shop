import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Tag,
  Search,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";

// Sample blog posts (will be replaced with database content)
const blogPosts = [
  {
    id: "1",
    slug: "getting-started-dragon-fruit-farming",
    title: "Getting Started with Dragon Fruit Farming in South Africa",
    excerpt: "A comprehensive guide for beginners looking to start their dragon fruit farming journey in South Africa. Learn about site selection, climate requirements, and initial investment.",
    author: "Max van Heerden",
    date: "2026-01-15",
    readTime: "8 min read",
    category: "Farming Guide",
    tags: ["beginner", "farming", "south-africa"],
    image: "/placeholder.svg",
    featured: true,
  },
  {
    id: "2",
    slug: "best-dragon-fruit-varieties",
    title: "Top 10 Dragon Fruit Varieties for Commercial Farming",
    excerpt: "Discover the best dragon fruit cultivars for commercial production, including self-pollinating varieties perfect for the African climate.",
    author: "DFSA Team",
    date: "2026-01-10",
    readTime: "6 min read",
    category: "Varieties",
    tags: ["varieties", "commercial", "export"],
    image: "/placeholder.svg",
    featured: true,
  },
  {
    id: "3",
    slug: "dragon-fruit-health-benefits",
    title: "Dragon Fruit Health Benefits: A Superfood for Africa",
    excerpt: "Explore the amazing health benefits of dragon fruit and why it's becoming increasingly popular in health-conscious markets worldwide.",
    author: "DFSA Team",
    date: "2026-01-05",
    readTime: "5 min read",
    category: "Health",
    tags: ["health", "nutrition", "superfood"],
    image: "/placeholder.svg",
    featured: false,
  },
  {
    id: "4",
    slug: "irrigation-systems-dragon-fruit",
    title: "Irrigation Systems for Dragon Fruit: A Complete Guide",
    excerpt: "Learn about the most effective irrigation methods for dragon fruit cultivation, from drip systems to micro-sprinklers.",
    author: "Max van Heerden",
    date: "2025-12-28",
    readTime: "7 min read",
    category: "Farming Guide",
    tags: ["irrigation", "water-management", "technology"],
    image: "/placeholder.svg",
    featured: false,
  },
  {
    id: "5",
    slug: "export-dragon-fruit-africa",
    title: "Exporting Dragon Fruit from Africa: Market Opportunities",
    excerpt: "An in-depth look at export markets for African dragon fruit, including Europe, Middle East, and Asia.",
    author: "DFSA Team",
    date: "2025-12-20",
    readTime: "10 min read",
    category: "Business",
    tags: ["export", "markets", "business"],
    image: "/placeholder.svg",
    featured: false,
  },
  {
    id: "6",
    slug: "pest-disease-management",
    title: "Pest and Disease Management in Dragon Fruit",
    excerpt: "Identify common pests and diseases affecting dragon fruit and learn organic and conventional control methods.",
    author: "Max van Heerden",
    date: "2025-12-15",
    readTime: "9 min read",
    category: "Farming Guide",
    tags: ["pests", "diseases", "organic"],
    image: "/placeholder.svg",
    featured: false,
  },
];

const categories = ["All", "Farming Guide", "Varieties", "Health", "Business"];

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter((post) => post.featured);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && !searchQuery && selectedCategory === "All" && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">Featured</span> Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge className="absolute top-4 left-4">{post.category}</Badge>
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
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
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
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow group">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
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
                        {new Date(post.date).toLocaleDateString()}
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
              <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>

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
