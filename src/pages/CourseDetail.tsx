import { Link, useParams } from "react-router-dom";
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
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import courseBasic from "@/assets/course-basic.jpg";
import instructorImage from "@/assets/instructor.jpg";

const courseData = {
  id: "basic-manicure",
  title: "Базовый курс маникюра",
  subtitle: "От новичка до профессионала за 4 недели",
  description:
    "Комплексная программа обучения для тех, кто хочет освоить профессию nail-мастера с нуля. Вы научитесь выполнять классический и аппаратный маникюр, работать с гель-лаком и создавать идеальное покрытие.",
  image: courseBasic,
  duration: "4 недели",
  lessons: 32,
  students: 2847,
  rating: 4.9,
  reviews: 456,
  level: "Для начинающих",
  includes: [
    "32 видеоурока в HD качестве",
    "Проверка домашних заданий куратором",
    "Сертификат о прохождении курса",
    "Бессрочный доступ к материалам",
    "Закрытый чат с участниками",
    "Список материалов для работы",
  ],
  modules: [
    {
      title: "Модуль 1. Введение в профессию",
      lessons: [
        "Обзор профессии nail-мастера",
        "Организация рабочего места",
        "Инструменты и материалы",
        "Санитарные нормы и стерилизация",
      ],
    },
    {
      title: "Модуль 2. Классический маникюр",
      lessons: [
        "Строение ногтя",
        "Опил ногтевой пластины",
        "Техника обрезного маникюра",
        "Работа с кутикулой",
      ],
    },
    {
      title: "Модуль 3. Аппаратный маникюр",
      lessons: [
        "Выбор аппарата и фрез",
        "Техники работы с аппаратом",
        "Комбинированная техника",
        "Работа с проблемными ногтями",
      ],
    },
    {
      title: "Модуль 4. Покрытие гель-лаком",
      lessons: [
        "Подготовка ногтя к покрытию",
        "Нанесение базы и цвета",
        "Идеальные торцы и блики",
        "Снятие покрытия",
      ],
    },
  ],
  tariffs: [
    {
      id: "self",
      name: "Самостоятельный",
      price: 129,
      oldPrice: 199,
      features: [
        "Доступ ко всем урокам",
        "Бессрочный доступ",
        "Закрытый чат",
        "Сертификат",
      ],
      notIncluded: ["Проверка ДЗ", "Обратная связь"],
    },
    {
      id: "curator",
      name: "С куратором",
      price: 199,
      oldPrice: 299,
      popular: true,
      features: [
        "Всё из тарифа 'Самостоятельный'",
        "Проверка 16 домашних заданий",
        "Обратная связь в течение 24 часов",
        "2 месяца поддержки куратора",
      ],
    },
    {
      id: "vip",
      name: "VIP",
      price: 349,
      oldPrice: 499,
      features: [
        "Всё из тарифа 'С куратором'",
        "Индивидуальные созвоны с экспертом",
        "Помощь в поиске первых клиентов",
        "Пожизненная поддержка",
        "Бонусные мастер-классы",
      ],
    },
  ],
  instructor: {
    name: "Анна Петрова",
    role: "Основатель школы, международный судья",
    image: instructorImage,
    experience: "12 лет опыта",
  },
  materials: [
    "Аппарат для маникюра (от 100 €)",
    "Набор фрез (от 20 €)",
    "Лампа для сушки (от 30 €)",
    "База, топ, гель-лаки (от 50 €)",
    "Инструменты (от 30 €)",
  ],
};

export default function CourseDetail() {
  const { id } = useParams();

  return (
    <div className="flex min-h-screen flex-col">
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
                {courseData.level}
              </Badge>

              <h1 className="font-display text-4xl font-bold lg:text-5xl">
                {courseData.title}
              </h1>

              <p className="text-xl text-muted-foreground">
                {courseData.subtitle}
              </p>

              <p className="text-muted-foreground">{courseData.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{courseData.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  <span>{courseData.lessons} уроков</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{courseData.students.toLocaleString("ru-RU")} учеников</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-highlight text-highlight" />
                  <span>
                    {courseData.rating} ({courseData.reviews} отзывов)
                  </span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-4 rounded-xl bg-card/50 p-4 backdrop-blur">
                <img
                  src={courseData.instructor.image}
                  alt={courseData.instructor.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{courseData.instructor.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {courseData.instructor.role}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl shadow-elevated">
                <img
                  src={courseData.image}
                  alt={courseData.title}
                  className="aspect-video w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                  <Button
                    variant="gold"
                    size="xl"
                    className="rounded-full"
                  >
                    <PlayCircle className="mr-2 h-6 w-6" />
                    Смотреть превью
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <h2 className="mb-8 font-display text-3xl font-bold">
            Что входит в курс
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courseData.includes.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg bg-secondary/50 p-4"
              >
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program */}
      <section className="bg-secondary/30 py-12 lg:py-16">
        <div className="container">
          <h2 className="mb-8 font-display text-3xl font-bold">
            Программа курса
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            {courseData.modules.map((module, index) => (
              <AccordionItem
                key={index}
                value={`module-${index}`}
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
                    {module.lessons.map((lesson, lessonIndex) => (
                      <li
                        key={lessonIndex}
                        className="flex items-center gap-3 text-muted-foreground"
                      >
                        <PlayCircle className="h-4 w-4 shrink-0" />
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Tariffs */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <h2 className="mb-4 text-center font-display text-3xl font-bold">
            Выберите тариф
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            Все тарифы включают бессрочный доступ к материалам курса
          </p>

          <div className="grid gap-6 lg:grid-cols-3">
            {courseData.tariffs.map((tariff) => (
              <Card
                key={tariff.id}
                variant={tariff.popular ? "elevated" : "default"}
                className={`relative ${
                  tariff.popular ? "border-primary lg:scale-105" : ""
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
                      {tariff.price.toLocaleString("de-DE")} €
                    </span>
                    {tariff.oldPrice && (
                      <span className="ml-2 text-lg text-muted-foreground line-through">
                        {tariff.oldPrice.toLocaleString("de-DE")} €
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tariff.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {tariff.notIncluded?.map((feature, index) => (
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
                  >
                    Выбрать тариф
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="bg-secondary/30 py-12 lg:py-16">
        <div className="container">
          <h2 className="mb-8 font-display text-3xl font-bold">
            Необходимые материалы
          </h2>
          <Card>
            <CardContent className="p-6">
              <p className="mb-6 text-muted-foreground">
                Для прохождения курса вам понадобятся следующие материалы и
                инструменты:
              </p>
              <ul className="grid gap-3 md:grid-cols-2">
                {courseData.materials.map((material, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <span>{material}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground">
                * После оплаты вы получите детальный список с рекомендациями по
                брендам и ссылками на магазины
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 lg:py-16">
        <div className="container">
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
        </div>
      </section>

      <Footer />
    </div>
  );
}
