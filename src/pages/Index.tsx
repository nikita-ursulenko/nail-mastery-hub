import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  PlayCircle,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CourseCard } from "@/components/courses/CourseCard";
import { TestimonialsSection } from "@/components/testimonials/TestimonialsSection";
import { FounderSection } from "@/components/founder/FounderSection";
import { FadeInOnScroll } from "@/components/FadeInOnScroll";
import { api } from "@/lib/api";

import heroImage from "@/assets/hero-nails.jpg";

const benefits = [
  {
    icon: PlayCircle,
    title: "Видеоуроки HD",
    description:
      "Пошаговые инструкции с детальной съёмкой каждого этапа работы",
  },
  {
    icon: Users,
    title: "Поддержка куратора",
    description:
      "Персональная обратная связь и проверка домашних заданий в течение 24 часов",
  },
  {
    icon: Clock,
    title: "Бессрочный доступ",
    description:
      "Пересматривайте уроки в любое время, доступ к материалам навсегда",
  },
  {
    icon: Award,
    title: "Сертификат",
    description:
      "Официальный сертификат установленного образца после завершения курса",
  },
];


const stats = [
  { value: "15 000+", label: "Учеников" },
  { value: "98%", label: "Довольных" },
  { value: "50+", label: "Курсов" },
  { value: "6 лет", label: "Опыта" },
];

export default function Index() {
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeaturedCourses();
  }, []);

  const loadFeaturedCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPublicCourses({
        limit: 6, // Показываем 6 популярных курсов
      });
      setFeaturedCourses(response.courses);
    } catch (err: any) {
      setError(err.message || "Ошибка при загрузке курсов");
      console.error("Error loading featured courses:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container relative z-10 py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-in space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                <span>Новогодняя распродажа — скидки до 40%</span>
              </div>

              <h1 className="font-display text-4xl font-bold leading-tight lg:text-6xl">
                Станьте{" "}
                <span className="text-gradient">профессиональным</span>{" "}
                мастером маникюра
              </h1>

              <p className="text-lg text-muted-foreground lg:text-xl">
                Онлайн-курсы от практикующих мастеров с международным опытом.
                Начните зарабатывать от 1 000 € в месяц уже через 2 месяца
                обучения.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/courses">
                    Выбрать курс
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/schedule">Бесплатный вебинар</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-display text-2xl font-bold text-primary lg:text-3xl">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground lg:text-sm">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-in-up lg:animate-slide-in-right">
              <div className="relative overflow-hidden rounded-2xl shadow-elevated">
                <img
                  src={heroImage}
                  alt="Профессиональный маникюр"
                  loading="eager"
                  fetchPriority="high"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-6 -left-6 animate-float rounded-xl bg-card p-4 shadow-elevated">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">100% гарантия</p>
                    <p className="text-sm text-muted-foreground">
                      Вернём деньги
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <FadeInOnScroll>
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
              Почему выбирают нас
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Мы создали идеальные условия для комфортного и эффективного
              обучения онлайн
            </p>
          </div>
          </FadeInOnScroll>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <FadeInOnScroll key={benefit.title} delay={index * 100} className="h-full">
                <Card variant="elevated" className="group h-full">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <benefit.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 font-display text-xl font-semibold">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="bg-secondary/30 py-16 lg:py-24">
        <div className="container">
          <FadeInOnScroll>
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
                Популярные курсы
              </h2>
              <p className="max-w-2xl text-muted-foreground">
                Выберите свой путь в индустрии красоты
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/courses">
                Все курсы
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          </FadeInOnScroll>

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Загрузка курсов...</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="mb-4 text-xl font-medium text-destructive">{error}</p>
              <Button variant="outline" onClick={loadFeaturedCourses}>
                Попробовать снова
              </Button>
            </div>
          ) : featuredCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course, index) => {
                // Формируем URL изображения с fallback
                let imageUrl = "";
                if (course.image_upload_path) {
                  // Если путь уже начинается с /uploads/, используем как есть, иначе добавляем префикс
                  imageUrl = course.image_upload_path.startsWith('/uploads/')
                    ? course.image_upload_path
                    : `/uploads/courses/${course.image_upload_path}`;
                } else if (course.image_url) {
                  imageUrl = course.image_url;
                } else {
                  // Fallback изображение
                  imageUrl = "https://via.placeholder.com/400x300?text=Course";
                }

                return (
                  <FadeInOnScroll key={course.id || course.slug} delay={index * 100} className="h-full">
                  <CourseCard
                    id={course.slug}
                    title={course.title || "Без названия"}
                    description={course.description || ""}
                    image={imageUrl}
                    price={course.price || 0}
                    oldPrice={course.oldPrice}
                    duration={course.duration || ""}
                    students={course.students || 0}
                    rating={course.rating || 0}
                    level={course.level || "beginner"}
                    isNew={course.isNew}
                  />
                  </FadeInOnScroll>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="mb-4 text-xl font-medium">Курсы не найдены</p>
              <p className="text-muted-foreground">
                Попробуйте позже или перейдите в каталог курсов
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Founder Section */}
      <FounderSection />

      {/* Testimonials */}
      <TestimonialsSection variant="secondary" />

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <FadeInOnScroll>
          <div className="overflow-hidden rounded-3xl gradient-accent p-8 text-center lg:p-16">
            <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground lg:text-4xl">
              Готовы начать обучение?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">
              Запишитесь на бесплатный вебинар и получите план развития в
              профессии nail-мастера
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="gold" size="xl" asChild>
                <Link to="/schedule">Записаться бесплатно</Link>
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
