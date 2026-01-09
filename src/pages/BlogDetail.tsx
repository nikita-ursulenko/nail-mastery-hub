import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, Share2, Heart } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FadeInOnScroll } from "@/components/FadeInOnScroll";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlogCard } from "@/components/blog/BlogCard";
import { api } from "@/lib/api";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // JSON string
  image_url?: string | null;
  image_upload_path?: string | null;
  author: string;
  author_avatar?: string | null;
  author_avatar_upload_path?: string | null;
  author_bio?: string | null;
  date: string;
  read_time: string;
  category: string;
  tags: string[];
  featured: boolean;
}

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (id) {
      loadBlogPost(id);
    }
  }, [id]);

  const loadBlogPost = async (slug: string) => {
    setIsLoading(true);
    try {
      const data = await api.getPublicBlogPostBySlug(slug);
      setPost(data);
      
      // Загружаем похожие статьи из той же категории
      const relatedResponse = await api.getPublicBlogPosts({ 
        category: data.category,
        featured: false 
      });
      const related = relatedResponse.posts || relatedResponse; // Поддержка старого формата
      setRelatedPosts(related.filter((p: BlogPost) => p.slug !== slug).slice(0, 3));
    } catch (error) {
      console.error("Failed to load blog post:", error);
      setPost(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="container flex flex-1 flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Загрузка статьи...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="container flex flex-1 flex-col items-center justify-center py-16 text-center">
          <h1 className="mb-4 font-display text-3xl font-bold">Статья не найдена</h1>
          <p className="mb-8 text-muted-foreground">
            К сожалению, запрашиваемая статья не существует.
          </p>
          <Button asChild>
            <Link to="/blog">Вернуться к блогу</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Breadcrumb */}
      <div className="border-b bg-secondary/30 py-4">
        <div className="container">
          <Link
            to="/blog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к блогу
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="gradient-hero py-12 lg:py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <Badge variant="secondary" className="px-4 py-1.5">
                {post.category}
              </Badge>
            </div>

            <h1 className="mb-6 font-display text-4xl font-bold leading-tight lg:text-5xl">
              {post.title}
            </h1>

            <p className="mb-8 text-xl text-muted-foreground">
              {post.excerpt}
            </p>

            {/* Meta Info */}
            <div className="mb-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>{new Date(post.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>{post.read_time} чтения</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span>{post.author}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Поделиться
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="mr-2 h-4 w-4" />
                Нравится
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {(post.image_upload_path || post.image_url) && (
        <section className="py-8">
          <div className="container">
            <FadeInOnScroll>
              <div className="mx-auto max-w-4xl">
                <div className="overflow-hidden rounded-2xl shadow-elevated">
                  <img
                    src={post.image_upload_path 
                      ? `/uploads/blog/${post.image_upload_path}`
                      : post.image_url || ""}
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full object-cover"
                  />
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </section>
      )}

      {/* Article Content */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <FadeInOnScroll>
            <div className="mx-auto max-w-3xl">
            <article className="prose prose-lg max-w-none">
              {(() => {
                // Парсим content (JSON массив параграфов)
                let paragraphs: string[] = [];
                try {
                  const parsed = JSON.parse(post.content);
                  if (Array.isArray(parsed)) {
                    paragraphs = parsed;
                  } else {
                    paragraphs = [post.content];
                  }
                } catch (e) {
                  paragraphs = [post.content];
                }
                return paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="mb-6 text-base leading-relaxed text-foreground lg:text-lg"
                  >
                    {paragraph}
                  </p>
                ));
              })()}
            </article>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap gap-2 border-t pt-8">
                <span className="mr-2 text-sm font-medium text-muted-foreground">
                  Теги:
                </span>
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-primary/10">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Author Section */}
      <section className="bg-secondary/30 py-12 lg:py-16">
        <div className="container">
          <FadeInOnScroll>
            <div className="mx-auto max-w-3xl">
              <Card variant="elevated">
              <CardContent className="p-6 lg:p-8">
                  <div className="flex flex-col gap-6 sm:flex-row">
                  {(post.author_avatar || post.author_avatar_upload_path) && (
                    <img
                      src={post.author_avatar || (post.author_avatar_upload_path
                        ? `/uploads/avatars/${post.author_avatar_upload_path}`
                        : "")}
                      alt={post.author}
                      loading="lazy"
                      decoding="async"
                      className="h-24 w-24 shrink-0 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="mb-2 font-display text-2xl font-semibold">
                      {post.author}
                    </h3>
                    {post.author_bio && (
                      <p className="mb-4 text-muted-foreground">
                        {post.author_bio}
                      </p>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/about">Все статьи автора</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="container">
            <FadeInOnScroll>
              <div className="mb-12">
                <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
                  Похожие статьи
                </h2>
                <p className="text-muted-foreground">
                  Рекомендуем к прочтению
                </p>
              </div>
            </FadeInOnScroll>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((relatedPost, index) => {
                const imageUrl = relatedPost.image_upload_path
                  ? `/uploads/blog/${relatedPost.image_upload_path}`
                  : relatedPost.image_url || "";
                const formattedDate = new Date(relatedPost.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });
                return (
                  <FadeInOnScroll key={relatedPost.id} delay={index * 100} className="h-full">
                    <BlogCard
                      id={relatedPost.slug}
                      title={relatedPost.title}
                      excerpt={relatedPost.excerpt}
                      image={imageUrl}
                      author={relatedPost.author}
                      authorAvatar={
                        relatedPost.author_avatar_upload_path
                          ? `/uploads/avatars/${relatedPost.author_avatar_upload_path}`
                          : relatedPost.author_avatar || undefined
                      }
                      date={formattedDate}
                      readTime={relatedPost.read_time}
                      category={relatedPost.category}
                      featured={relatedPost.featured}
                    />
                  </FadeInOnScroll>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-secondary/30 py-12 lg:py-16">
        <div className="container">
          <FadeInOnScroll>
            <div className="overflow-hidden rounded-3xl gradient-accent p-8 text-center lg:p-12">
              <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground">
                Хотите узнать больше?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
                Присоединяйтесь к нашим курсам и станьте профессиональным мастером маникюра
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="gold" size="lg" asChild>
                  <Link to="/courses">
                    Посмотреть курсы
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                  asChild
                >
                  <Link to="/blog">Больше статей</Link>
                </Button>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      <Footer />
    </div>
  );
}
