import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, X, ArrowRight, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BlogCard } from "@/components/blog/BlogCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import courseBasic from "@/assets/course-basic.jpg";
import courseGel from "@/assets/course-gel.jpg";
import courseArt from "@/assets/course-art.jpg";
import instructorImage from "@/assets/instructor.jpg";

const blogPosts = [
  {
    id: "top-trends-2024",
    title: "Топ-10 трендов маникюра 2024: что будет актуально",
    excerpt:
      "Разбираем самые актуальные тренды в nail-дизайне на 2024 год. От минималистичных французских маникюров до ярких геометрических принтов.",
    image: courseArt,
    author: "Анна Петрова",
    authorAvatar: instructorImage,
    date: "15 января 2024",
    readTime: "5 мин",
    category: "Тренды",
    featured: true,
  },
  {
    id: "gel-polish-guide",
    title: "Как правильно наносить гель-лак: пошаговая инструкция",
    excerpt:
      "Детальный гайд по нанесению гель-лака для начинающих мастеров. Все этапы от подготовки ногтевой пластины до финального покрытия.",
    image: courseGel,
    author: "Мария Соколова",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    date: "12 января 2024",
    readTime: "8 мин",
    category: "Обучение",
    featured: true,
  },
  {
    id: "nail-care-tips",
    title: "10 секретов ухода за ногтями в домашних условиях",
    excerpt:
      "Простые и эффективные советы по уходу за ногтями, которые помогут сохранить их здоровье и красоту между визитами к мастеру.",
    image: courseBasic,
    author: "Елена Новикова",
    authorAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    date: "10 января 2024",
    readTime: "6 мин",
    category: "Уход",
    featured: false,
  },
  {
    id: "extension-mistakes",
    title: "Типичные ошибки при наращивании ногтей и как их избежать",
    excerpt:
      "Разбираем самые распространённые ошибки начинающих мастеров при наращивании и даём практические советы по их исправлению.",
    image: courseGel,
    author: "Анна Петрова",
    authorAvatar: instructorImage,
    date: "8 января 2024",
    readTime: "7 мин",
    category: "Обучение",
    featured: false,
  },
  {
    id: "color-psychology",
    title: "Психология цвета в маникюре: как выбрать оттенок",
    excerpt:
      "Как цвет лака влияет на настроение и восприятие? Узнайте, какие оттенки подходят для разных случаев и как создать гармоничный образ.",
    image: courseArt,
    author: "Мария Соколова",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    date: "5 января 2024",
    readTime: "4 мин",
    category: "Дизайн",
    featured: false,
  },
  {
    id: "tools-essentials",
    title: "Необходимые инструменты для начинающего мастера",
    excerpt:
      "Полный список инструментов и материалов, которые понадобятся для начала работы. Что купить в первую очередь, а на чём можно сэкономить.",
    image: courseBasic,
    author: "Елена Новикова",
    authorAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    date: "3 января 2024",
    readTime: "9 мин",
    category: "Инструменты",
    featured: false,
  },
  {
    id: "winter-manicure",
    title: "Зимний маникюр: идеи и вдохновение",
    excerpt:
      "Коллекция идей для зимнего маникюра: от новогодних дизайнов до элегантных классических вариантов. Фото и пошаговые инструкции.",
    image: courseArt,
    author: "Анна Петрова",
    authorAvatar: instructorImage,
    date: "1 января 2024",
    readTime: "5 мин",
    category: "Дизайн",
    featured: false,
  },
  {
    id: "business-tips",
    title: "Как открыть свой кабинет маникюра: бизнес-план",
    excerpt:
      "Практическое руководство по открытию собственного кабинета маникюра. От выбора локации до привлечения первых клиентов.",
    image: courseBasic,
    author: "Анна Петрова",
    authorAvatar: instructorImage,
    date: "28 декабря 2023",
    readTime: "12 мин",
    category: "Бизнес",
    featured: false,
  },
  {
    id: "nail-art-techniques",
    title: "5 техник nail-арта, которые должен знать каждый мастер",
    excerpt:
      "Осваиваем базовые техники дизайна ногтей: стемпинг, градиент, акварель, инкрустация и объёмный декор. Пошаговые мастер-классы.",
    image: courseArt,
    author: "Мария Соколова",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    date: "25 декабря 2023",
    readTime: "10 мин",
    category: "Дизайн",
    featured: false,
  },
];

const categories = [
  { id: "all", label: "Все статьи" },
  { id: "Тренды", label: "Тренды" },
  { id: "Обучение", label: "Обучение" },
  { id: "Дизайн", label: "Дизайн" },
  { id: "Уход", label: "Уход" },
  { id: "Инструменты", label: "Инструменты" },
  { id: "Бизнес", label: "Бизнес" },
];

const featuredPosts = blogPosts.filter((post) => post.featured);
const regularPosts = blogPosts.filter((post) => !post.featured);

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all";

  return (
    <div className="flex min-h-screen flex-col">
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

            <div className="grid gap-6 md:grid-cols-2">
              {featuredPosts.map((post) => (
                <BlogCard key={post.id} {...post} />
              ))}
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
          {filteredPosts.length > 0 ? (
            <>
              <div className="mb-8 flex items-center justify-between">
                <p className="text-muted-foreground">
                  Найдено статей: {filteredPosts.length}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => (
                  <BlogCard key={post.id} {...post} />
                ))}
              </div>
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
        </div>
      </section>

      <Footer />
    </div>
  );
}




