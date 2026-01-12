import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, X, ArrowRight, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BlogCard } from "@/components/blog/BlogCard";
import { FadeInOnScroll } from "@/components/FadeInOnScroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Helmet } from "react-helmet-async";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image_url?: string | null;
  image_upload_path?: string | null;
  author: string;
  author_avatar?: string | null;
  author_avatar_upload_path?: string | null;
  date: string;
  read_time: string;
  category: string;
  featured: boolean;
}

const categories = [
  { id: "all", label: "Все статьи" },
  { id: "Тренды", label: "Тренды" },
  { id: "Обучение", label: "Обучение" },
  { id: "Дизайн", label: "Дизайн" },
  { id: "Уход", label: "Уход" },
  { id: "Инструменты", label: "Инструменты" },
  { id: "Бизнес", label: "Бизнес" },
];

const POSTS_PER_PAGE = 9;

export default function Blog() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);

  const loadBlogPosts = useCallback(async (reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
      offsetRef.current = 0;
      setBlogPosts([]);
      setFeaturedPosts([]);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const params: any = {
        limit: POSTS_PER_PAGE,
        offset: offsetRef.current,
      };
      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await api.getPublicBlogPosts(params);
      
      if (reset) {
        // При сбросе разделяем featured и обычные посты
        const featured = response.posts.filter((post: BlogPost) => post.featured);
        const regular = response.posts.filter((post: BlogPost) => !post.featured);
        setFeaturedPosts(featured);
        
        // Показываем посты в основной сетке
        if (selectedCategory === "all" && !searchQuery) {
          // Без фильтров: показываем только не-featured в основной сетке
          setBlogPosts(regular);
        } else {
          // С фильтрами: показываем все посты
          setBlogPosts(response.posts);
        }
        offsetRef.current = response.posts.length;
      } else {
        // При подгрузке добавляем посты
        if (selectedCategory === "all" && !searchQuery) {
          // Без фильтров: добавляем только не-featured
          const regular = response.posts.filter((post: BlogPost) => !post.featured);
          setBlogPosts((prev) => [...prev, ...regular]);
        } else {
          // С фильтрами: добавляем все
          setBlogPosts((prev) => [...prev, ...response.posts]);
        }
        offsetRef.current += response.posts.length;
      }
      
      setHasMore(response.hasMore);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to load blog posts:", error);
      if (reset) {
        setBlogPosts([]);
        setFeaturedPosts([]);
        offsetRef.current = 0;
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadBlogPosts(true);
  }, [selectedCategory, searchQuery, loadBlogPosts]);

  // Infinite scroll с Intersection Observer
  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadBlogPosts(false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, loadBlogPosts]);

  // Для основной сетки показываем только не-featured посты, если нет фильтров
  const filteredPosts = selectedCategory === "all" && !searchQuery
    ? blogPosts
    : blogPosts;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all";

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>Блог о маникюре | NailArt Academy</title>
        <meta name="description" content="Полезные статьи и экспертные советы о маникюре, дизайне ногтей, техниках и трендах от профессионалов индустрии красоты." />
        <meta name="keywords" content="блог маникюра, статьи о маникюре, советы мастера маникюра, тренды маникюра, дизайн ногтей" />
        <meta property="og:title" content="Блог о маникюре | NailArt Academy" />
        <meta property="og:description" content="Полезные статьи и экспертные советы о маникюре, дизайне ногтей, техниках и трендах." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${baseUrl}/blog`} />
      </Helmet>
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container relative z-10 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Блог NailArt Academy</span>
            </div>
            <h1 className="mb-6 font-display text-4xl font-bold leading-tight lg:text-6xl">
              Полезные статьи и{" "}
              <span className="text-gradient">экспертные советы</span>
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Узнавайте о новейших трендах, техниках и секретах мастерства от
              профессионалов индустрии красоты
            </p>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {selectedCategory === "all" && !searchQuery && (
        <section className="py-16 lg:py-24">
          <div className="container">
            <FadeInOnScroll>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
                  Рекомендуем к прочтению
                </h2>
                <p className="max-w-2xl text-muted-foreground">
                  Самые популярные и актуальные статьи от наших экспертов
                </p>
              </div>
            </div>
            </FadeInOnScroll>

            <div className="grid gap-6 md:grid-cols-2">
              {featuredPosts.map((post, index) => {
                const imageUrl = post.image_upload_path
                  ? `/uploads/blog/${post.image_upload_path}`
                  : post.image_url || "";
                const formattedDate = new Date(post.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });
                return (
                  <FadeInOnScroll key={post.id} delay={index * 150} className="h-full">
                  <BlogCard
                    id={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    image={imageUrl}
                    author={post.author}
                    authorAvatar={post.author_avatar || undefined}
                    date={formattedDate}
                    readTime={post.read_time}
                    category={post.category}
                    featured={post.featured}
                  />
                  </FadeInOnScroll>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Filters Section */}
      <section className="border-b bg-card py-6">
        <div className="container">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск статей..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Toggle Filters (Mobile) */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Категории
            </Button>

            {/* Category Filters (Desktop) */}
            <div className="hidden flex-wrap items-center gap-2 lg:flex">
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className="cursor-pointer px-4 py-1.5 text-sm transition-colors"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="hidden lg:flex"
              >
                <X className="mr-1 h-4 w-4" />
                Сбросить
              </Button>
            )}
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="mt-4 space-y-4 border-t pt-4 lg:hidden">
              <div>
                <p className="mb-2 text-sm font-medium">Категория</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={
                        selectedCategory === cat.id ? "default" : "outline"
                      }
                      className="cursor-pointer transition-colors"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Сбросить все
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="flex-1 py-12 lg:py-16">
        <div className="container">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground">Загрузка статей...</p>
              </div>
            </div>
          ) : filteredPosts.length > 0 || featuredPosts.length > 0 ? (
              <>
                <FadeInOnScroll>
                <div className="mb-8 flex items-center justify-between">
                  <p className="text-muted-foreground">
                    Найдено статей: {total} {filteredPosts.length < total && `(показано ${filteredPosts.length + featuredPosts.length})`}
                  </p>
                </div>
                </FadeInOnScroll>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPosts.map((post, index) => {
                    const imageUrl = post.image_upload_path
                      ? `/uploads/blog/${post.image_upload_path}`
                      : post.image_url || "";
                    const formattedDate = new Date(post.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                    return (
                      <FadeInOnScroll key={post.id} delay={index * 50} className="h-full">
                      <BlogCard
                        id={post.slug}
                        title={post.title}
                        excerpt={post.excerpt}
                        image={imageUrl}
                        author={post.author}
                        authorAvatar={post.author_avatar || undefined}
                        date={formattedDate}
                        readTime={post.read_time}
                        category={post.category}
                        featured={post.featured}
                      />
                      </FadeInOnScroll>
                    );
                  })}
                </div>
                {/* Элемент-триггер для infinite scroll */}
                <div ref={observerTarget} className="h-10 w-full" />
                {isLoadingMore && (
                  <div className="mt-8 flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                )}
              </>
            ) : (
            <div className="py-16 text-center">
              <p className="mb-4 text-xl font-medium">Статьи не найдены</p>
              <p className="mb-6 text-muted-foreground">
                Попробуйте изменить параметры поиска
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Сбросить фильтры
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-secondary/30 py-16 lg:py-24">
        <div className="container">
          <FadeInOnScroll>
          <Card variant="elevated" className="overflow-hidden">
            <CardContent className="p-8 lg:p-12">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
                  Подпишитесь на рассылку
                </h2>
                <p className="mb-8 text-muted-foreground">
                  Получайте новые статьи и полезные советы прямо на почту
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="Ваш email"
                    className="flex-1"
                  />
                  <Button size="lg" className="whitespace-nowrap">
                    Подписаться
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </FadeInOnScroll>
        </div>
      </section>

      <Footer />
    </div>
  );
}




