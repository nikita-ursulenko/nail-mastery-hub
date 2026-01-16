import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Users,
  Star,
  CheckCircle,
  PlayCircle,
  FileText,
  Award,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FadeInOnScroll } from "@/components/FadeInOnScroll";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/lib/supabase";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { StructuredData, createCourseSchema } from "@/components/seo/StructuredData";
import { useAnalytics } from "@/hooks/useAnalytics";

const levelLabels: Record<string, string> = {
  beginner: "Для начинающих",
  intermediate: "Средний",
  advanced: "Продвинутый",
};

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const { trackViewCourse, trackInitiateCheckout } = useAnalytics();
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<number | null>(null); // ID тарифа, который покупается

  useEffect(() => {
    if (id) {
      loadCourse();
    }
  }, [id]);

  // Трекинг просмотра курса
  useEffect(() => {
    if (courseData) {
      const minPrice = courseData.tariffs && courseData.tariffs.length > 0
        ? Math.min(...courseData.tariffs.map((t: any) => t.price || Infinity))
        : undefined;

      trackViewCourse(
        courseData.id?.toString() || courseData.slug,
        courseData.title,
        minPrice !== undefined && minPrice !== Infinity ? minPrice : undefined
      );
    }
  }, [courseData, trackViewCourse]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          tariffs:course_tariffs(id, name, price, old_price, features, not_included, is_popular, tariff_type)
        `)
        .eq('slug', id!)
        .single();

      if (courseError) throw courseError;
      if (!courseData) throw new Error('Курс не найден');

      // Fetch modules with correct column names (order_index)
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('id, title, description, order_index')
        .eq('course_id', courseData.id)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch lessons using course_lessons table and order_index
      const modulesWithLessons = await Promise.all(
        (modulesData || []).map(async (module: any) => {
          const { data: lessonsData } = await supabase
            .from('course_lessons')
            .select('id, title, duration, video_url, order_index')
            .eq('module_id', module.id)
            .order('order_index', { ascending: true });

          return {
            ...module,
            lessons: lessonsData || [],
            lessons_count: lessonsData?.length || 0,
          };
        })
      );

      console.log('--- DEBUG COURSE DATA ---');
      console.log('Course:', courseData);
      console.log('Modules:', modulesWithLessons);

      // Get instructor separately
      let instructor = null;
      if (courseData.instructor_id) {
        const { data: instructorData } = await supabase
          .from('team_members')
          .select('name, role, image_url, image_upload_path')
          .eq('id', courseData.instructor_id)
          .single();
        instructor = instructorData;
        console.log('Instructor:', instructor);
      }

      setCourseData({
        ...courseData,
        instructor,
        modules: modulesWithLessons,
        includes: courseData.includes || [],
        materials: courseData.required_materials || [],
      });
    } catch (err: any) {
      setError(err.message || "Ошибка при загрузке курса");
      console.error("Error loading course:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (tariff: any) => {
    if (!user) {
      toast.error("Необходимо войти в систему");
      navigate("/login");
      return;
    }

    if (!courseData) {
      return;
    }

    try {
      setPurchasing(tariff.id);

      // Трекинг начала покупки
      trackInitiateCheckout(
        courseData.id?.toString() || courseData.slug,
        courseData.title,
        tariff.price
      );

      // Call Supabase Edge Function to create Stripe Checkout Session
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          courseId: courseData.id,
          tariffId: tariff.id,
          userId: user.id,
        }
      });

      if (sessionError) throw sessionError;

      if (sessionData?.url) {
        // Перенаправляем на Stripe Checkout
        window.location.href = sessionData.url;
      } else {
        throw new Error("Не получен URL для оплаты");
      }
    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      toast.error(err.message || "Ошибка при создании платежа");
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Загрузка курса...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-xl font-medium text-destructive">
              {error || "Курс не найден"}
            </p>
            <Button variant="outline" asChild>
              <Link to="/courses">Вернуться к курсам</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Формируем URL изображения
  const courseImage = courseData.image_upload_path
    ? (courseData.image_upload_path.startsWith('/uploads/')
      ? courseData.image_upload_path
      : `/uploads/courses/${courseData.image_upload_path}`)
    : courseData.image_url || "";

  const courseImageUrl = courseImage.startsWith('http')
    ? courseImage
    : `${baseUrl}${courseImage}`;

  // Получаем минимальную цену курса для JSON-LD
  const minPrice = Array.isArray(courseData.tariffs) && courseData.tariffs.length > 0
    ? Math.min(...courseData.tariffs.map((t: any) => t.price || Infinity))
    : undefined;

  // Формируем URL изображения преподавателя
  const instructorImage = courseData.instructor?.image_upload_path
    ? `/uploads/team/${courseData.instructor.image_upload_path}`
    : courseData.instructor?.image_url || "";

  const courseDataFormatted = {
    id: courseData.slug,
    title: courseData.title,
    subtitle: courseData.subtitle,
    description: courseData.description,
    image: courseImage,
    duration: courseData.duration,
    lessons: Array.isArray(courseData.modules) ? courseData.modules.reduce(
      (sum: number, m: any) => sum + (m.lessons_count || (Array.isArray(m.lessons) ? m.lessons.length : 0) || 0),
      0
    ) : 0,
    students: courseData.students || 0,
    rating: courseData.rating || 0,
    reviews: courseData.reviews || 0,
    level: levelLabels[courseData.level] || courseData.level,
    includes: Array.isArray(courseData.includes) ? courseData.includes : [],
    modules: Array.isArray(courseData.modules) ? courseData.modules : [],
    tariffs: Array.isArray(courseData.tariffs) ? courseData.tariffs : [],
    instructor: courseData.instructor
      ? {
        name: courseData.instructor.name,
        role: courseData.instructor.role,
        image: instructorImage,
      }
      : null,
    materials: Array.isArray(courseData.materials) ? courseData.materials : [],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>{courseData.title} | NailArt Academy</title>
        <meta name="description" content={courseData.description || courseData.subtitle || courseData.title} />
        <meta name="keywords" content={`курс маникюра, ${courseData.title}, обучение маникюру, ${courseData.category || ''}`} />
        <meta property="og:title" content={`${courseData.title} | NailArt Academy`} />
        <meta property="og:description" content={courseData.description || courseData.subtitle || courseData.title} />
        <meta property="og:type" content="product" />
        {courseImageUrl && <meta property="og:image" content={courseImageUrl} />}
        <meta property="og:url" content={`${baseUrl}/courses/${id}`} />
        <link rel="canonical" href={`${baseUrl}/courses/${id}`} />
      </Helmet>
      {minPrice && (
        <StructuredData
          type="course"
          data={createCourseSchema(
            {
              title: courseData.title,
              description: courseData.description || courseData.subtitle || courseData.title,
              price: minPrice,
              currency: 'EUR',
            },
            baseUrl
          )}
        />
      )}
      <Header />

      {/* Breadcrumb */}
      <div className="border-b bg-secondary/30 py-4">
        <div className="container">
          <Link
            to="/courses"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к курсам
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="gradient-hero py-12 lg:py-16">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <Badge variant="secondary" className="px-4 py-1.5">
                {courseDataFormatted.level}
              </Badge>

              <h1 className="font-display text-4xl font-bold lg:text-5xl">
                {courseDataFormatted.title}
              </h1>

              <p className="text-xl text-muted-foreground">
                {courseDataFormatted.subtitle}
              </p>

              <p className="text-muted-foreground">{courseDataFormatted.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{courseDataFormatted.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  <span>{courseDataFormatted.lessons} уроков</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{courseDataFormatted.students.toLocaleString("ru-RU")} учеников</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-highlight text-highlight" />
                  <span>
                    {courseDataFormatted.rating} ({courseDataFormatted.reviews} отзывов)
                  </span>
                </div>
              </div>

              {/* Instructor */}
              {courseDataFormatted.instructor && (
                <div className="flex items-center gap-4 rounded-xl bg-card/50 p-4 backdrop-blur">
                  <img
                    src={courseDataFormatted.instructor.image}
                    alt={courseDataFormatted.instructor.name}
                    loading="lazy"
                    decoding="async"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{courseDataFormatted.instructor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {courseDataFormatted.instructor.role}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl shadow-elevated">
                <img
                  src={courseDataFormatted.image}
                  alt={courseDataFormatted.title}
                  loading="lazy"
                  decoding="async"
                  className="aspect-video w-full object-cover"
                />
                {courseData.video_preview_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                    <Button
                      variant="gold"
                      size="xl"
                      className="rounded-full"
                      onClick={() => window.open(courseData.video_preview_url, '_blank')}
                    >
                      <PlayCircle className="mr-2 h-6 w-6" />
                      Смотреть превью
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <FadeInOnScroll>
            <h2 className="mb-8 font-display text-3xl font-bold">
              Что входит в курс
            </h2>
          </FadeInOnScroll>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courseDataFormatted.includes.map((item: string, index: number) => (
              <FadeInOnScroll key={index} delay={index * 50}>
                <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Program */}
      <section className="bg-secondary/30 py-12 lg:py-16">
        <div className="container">
          <FadeInOnScroll>
            <h2 className="mb-8 font-display text-3xl font-bold">
              Программа курса
            </h2>
          </FadeInOnScroll>
          <Accordion type="single" collapsible className="space-y-4">
            {Array.isArray(courseDataFormatted.modules) && courseDataFormatted.modules.map((module: any, index: number) => (
              <FadeInOnScroll key={module.id || index} delay={index * 100}>
                <AccordionItem
                  key={module.id || index}
                  value={`module-${module.id || index}`}
                  className="overflow-hidden rounded-xl border bg-card"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-4 text-left">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
                        {index + 1}
                      </span>
                      <span className="font-display text-lg font-semibold">
                        {module.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <ul className="ml-14 space-y-2">
                      {Array.isArray(module.lessons) ? module.lessons.map((lesson: any, lessonIndex: number) => (
                        <li
                          key={lesson.id || lessonIndex}
                          className="flex items-center gap-3 text-muted-foreground"
                        >
                          <PlayCircle className="h-4 w-4 shrink-0" />
                          <span>{lesson.title}</span>
                          {lesson.duration && <span className="text-xs text-muted-foreground ml-auto">{Math.ceil(lesson.duration / 60)} мин</span>}
                        </li>
                      )) : <li className="text-muted-foreground text-sm">Нет уроков</li>}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </FadeInOnScroll>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Tariffs */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <FadeInOnScroll>
            <h2 className="mb-4 text-center font-display text-3xl font-bold">
              Выберите тариф
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
              Все тарифы включают бессрочный доступ к материалам курса
            </p>
          </FadeInOnScroll>

          <div className="grid gap-6 lg:grid-cols-3">
            {Array.isArray(courseDataFormatted.tariffs) && courseDataFormatted.tariffs.map((tariff: any, index: number) => (
              <FadeInOnScroll key={tariff.id} delay={index * 100}>
                <Card
                  key={tariff.id}
                  variant={tariff.popular ? "elevated" : "default"}
                  className={`relative ${tariff.popular ? "border-primary lg:scale-105" : ""
                    }`}
                >
                  {tariff.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary px-4 py-1">Популярный</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="font-display text-2xl">
                      {tariff.name}
                    </CardTitle>
                    <div className="mt-4">
                      <span className="font-display text-4xl font-bold text-primary">
                        {tariff.price?.toLocaleString("de-DE")} €
                      </span>
                      {tariff.old_price && (
                        <span className="ml-2 text-lg text-muted-foreground line-through">
                          {tariff.old_price.toLocaleString("de-DE")} €
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {Array.isArray(tariff.features) && tariff.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                      {Array.isArray(tariff.not_included) && tariff.not_included.map((feature: string, index: number) => (
                        <li
                          key={`not-${index}`}
                          className="flex items-start gap-3 text-muted-foreground"
                        >
                          <span className="mt-0.5 h-5 w-5 shrink-0 text-center">
                            —
                          </span>
                          <span className="text-sm line-through">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={tariff.popular ? "hero" : "outline"}
                      size="lg"
                      className="w-full"
                      onClick={() => handlePurchase(tariff)}
                      disabled={purchasing === tariff.id}
                    >
                      {purchasing === tariff.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Обработка...
                        </>
                      ) : (
                        "Выбрать тариф"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="bg-secondary/30 py-12 lg:py-16">
        <div className="container">
          <FadeInOnScroll>
            <h2 className="mb-8 font-display text-3xl font-bold">
              Необходимые материалы
            </h2>
          </FadeInOnScroll>
          <FadeInOnScroll delay={100}>
            <Card>
              <CardContent className="p-6">
                <p className="mb-6 text-muted-foreground">
                  Для прохождения курса вам понадобятся следующие материалы и
                  инструменты:
                </p>
                <ul className="grid gap-3 md:grid-cols-2">
                  {courseDataFormatted.materials.map((material: any, index: number) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <span>
                        {material.name}
                        {material.price_info && ` ${material.price_info}`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-muted-foreground">
                  * После оплаты вы получите детальный список с рекомендациями по
                  брендам и ссылками на магазины
                </p>
              </CardContent>
            </Card>
          </FadeInOnScroll>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <FadeInOnScroll>
            <div className="overflow-hidden rounded-3xl gradient-accent p-8 text-center lg:p-12">
              <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground">
                Остались вопросы?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
                Свяжитесь с нами, и мы поможем выбрать подходящий курс и тариф
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="gold" size="lg">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Написать в Telegram
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
