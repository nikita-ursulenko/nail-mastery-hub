import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  User,
  Video,
  Sparkles,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FadeInOnScroll } from "@/components/FadeInOnScroll";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import instructorImage from "@/assets/instructor.jpg";
import courseArt from "@/assets/course-art.jpg";

interface Event {
  id: string;
  title: string;
  description: string;
  type: "webinar" | "workshop" | "masterclass";
  date: string;
  time: string;
  duration: string;
  instructor: string;
  instructorAvatar?: string;
  image?: string;
  registered: number;
  maxParticipants?: number;
  isFree: boolean;
  price?: number;
  link?: string;
  status: "upcoming" | "live" | "recorded";
}

const events: Event[] = [
  {
    id: "webinar-1",
    title: "Бесплатный вебинар: Как начать карьеру nail-мастера",
    description:
      "Узнайте, с чего начать свой путь в профессии, какие навыки нужны и как быстро найти первых клиентов. Ответы на все вопросы от опытных мастеров.",
    type: "webinar",
    date: "25 января 2024",
    time: "19:00",
    duration: "1.5 часа",
    instructor: "Анна Петрова",
    instructorAvatar: instructorImage,
    registered: 1247,
    maxParticipants: 2000,
    isFree: true,
    status: "upcoming",
  },
  {
    id: "workshop-1",
    title: "Мастер-класс: Современные техники дизайна ногтей",
    description:
      "Практический мастер-класс по созданию актуальных дизайнов. Изучите техники градиента, стемпинга и объёмного декора на практике.",
    type: "workshop",
    date: "28 января 2024",
    time: "14:00",
    duration: "3 часа",
    instructor: "Мария Соколова",
    instructorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    image: courseArt,
    registered: 89,
    maxParticipants: 100,
    isFree: false,
    price: 25,
    status: "upcoming",
  },
  {
    id: "masterclass-1",
    title: "VIP мастер-класс: Наращивание гелем от А до Я",
    description:
      "Эксклюзивный мастер-класс для продвинутых мастеров. Разберём все тонкости работы с гелем, создание идеального апекса и работу с проблемными ногтями.",
    type: "masterclass",
    date: "2 февраля 2024",
    time: "11:00",
    duration: "4 часа",
    instructor: "Елена Новикова",
    instructorAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    registered: 45,
    maxParticipants: 50,
    isFree: false,
    price: 50,
    status: "upcoming",
  },
  {
    id: "webinar-2",
    title: "Вебинар: Бизнес в nail-индустрии",
    description:
      "Как открыть свой кабинет, привлечь клиентов и построить успешный бизнес. Практические советы от владельцев салонов.",
    type: "webinar",
    date: "5 февраля 2024",
    time: "18:00",
    duration: "2 часа",
    instructor: "Анна Петрова",
    instructorAvatar: instructorImage,
    registered: 892,
    maxParticipants: 2000,
    isFree: true,
    status: "upcoming",
  },
  {
    id: "workshop-2",
    title: "Интенсив: Аппаратный маникюр для начинающих",
    description:
      "Полный курс по работе с аппаратом. Выбор фрез, техники работы, безопасность. Практика на моделях.",
    type: "workshop",
    date: "10 февраля 2024",
    time: "10:00",
    duration: "5 часов",
    instructor: "Анна Петрова",
    instructorAvatar: instructorImage,
    registered: 67,
    maxParticipants: 80,
    isFree: false,
    price: 35,
    status: "upcoming",
  },
  {
    id: "webinar-3",
    title: "Вебинар: Тренды весеннего маникюра 2024",
    description:
      "Обзор актуальных трендов и цветовых палитр для весеннего сезона. Идеи для дизайна и вдохновение от топовых мастеров.",
    type: "webinar",
    date: "15 февраля 2024",
    time: "19:30",
    duration: "1 час",
    instructor: "Мария Соколова",
    instructorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    registered: 1156,
    maxParticipants: 2000,
    isFree: true,
    status: "upcoming",
  },
  {
    id: "recorded-1",
    title: "Запись: Новогодний маникюр — техники и идеи",
    description:
      "Запись популярного вебинара о создании праздничных дизайнов. Доступна для просмотра в любое время.",
    type: "webinar",
    date: "20 декабря 2023",
    time: "19:00",
    duration: "1.5 часа",
    instructor: "Анна Петрова",
    instructorAvatar: instructorImage,
    registered: 0,
    isFree: true,
    status: "recorded",
  },
];

const eventTypes = [
  { id: "all", label: "Все события" },
  { id: "webinar", label: "Вебинары" },
  { id: "workshop", label: "Мастер-классы" },
  { id: "masterclass", label: "VIP мастер-классы" },
];

const statusLabels = {
  upcoming: "Предстоящее",
  live: "Идёт сейчас",
  recorded: "Запись",
};

const typeLabels = {
  webinar: "Вебинар",
  workshop: "Мастер-класс",
  masterclass: "VIP мастер-класс",
};

export default function Schedule() {
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "upcoming" | "live" | "recorded">("all");

  const filteredEvents = events.filter((event) => {
    const matchesType = selectedType === "all" || event.type === selectedType;
    const matchesStatus = selectedStatus === "all" || event.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  const upcomingEvents = events.filter((e) => e.status === "upcoming");
  const recordedEvents = events.filter((e) => e.status === "recorded");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container relative z-10 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Расписание событий</span>
            </div>
            <h1 className="mb-6 font-display text-4xl font-bold leading-tight lg:text-6xl">
              Вебинары и{" "}
              <span className="text-gradient">мастер-классы</span> от
              профессионалов
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Присоединяйтесь к онлайн-мероприятиям, учитесь у лучших мастеров и
              развивайте свои навыки
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-card py-8">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { value: upcomingEvents.length, label: "Предстоящих событий" },
              { value: recordedEvents.length, label: "Доступных записей" },
              { value: events.reduce((sum, e) => sum + e.registered, 0).toLocaleString("ru-RU"), label: "Участников всего" },
            ].map((stat, index) => (
              <FadeInOnScroll key={index} delay={index * 100}>
            <div className="text-center">
              <p className="mb-2 font-display text-3xl font-bold text-primary">
                    {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">
                    {stat.label}
              </p>
            </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b bg-secondary/30 py-6">
        <div className="container">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              Тип:
            </span>
            {eventTypes.map((type) => (
              <Badge
                key={type.id}
                variant={selectedType === type.id ? "default" : "outline"}
                className="cursor-pointer px-4 py-1.5 text-sm transition-colors"
                onClick={() => setSelectedType(type.id)}
              >
                {type.label}
              </Badge>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Статус:
              </span>
              <Badge
                variant={selectedStatus === "all" ? "default" : "outline"}
                className="cursor-pointer px-3 py-1 text-xs transition-colors"
                onClick={() => setSelectedStatus("all")}
              >
                Все
              </Badge>
              <Badge
                variant={selectedStatus === "upcoming" ? "default" : "outline"}
                className="cursor-pointer px-3 py-1 text-xs transition-colors"
                onClick={() => setSelectedStatus("upcoming")}
              >
                Предстоящие
              </Badge>
              <Badge
                variant={selectedStatus === "recorded" ? "default" : "outline"}
                className="cursor-pointer px-3 py-1 text-xs transition-colors"
                onClick={() => setSelectedStatus("recorded")}
              >
                Записи
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="flex-1 py-12 lg:py-16">
        <div className="container">
          {filteredEvents.length > 0 ? (
            <div className="space-y-6">
              {filteredEvents.map((event, index) => (
                <FadeInOnScroll key={event.id} delay={index * 100}>
                <Card
                  variant="elevated"
                  className="group overflow-hidden transition-all duration-300 hover:shadow-elevated"
                >
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Image */}
                    {event.image && (
                      <div className="relative hidden overflow-hidden lg:block">
                        <img
                          src={event.image}
                          alt={event.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
                      </div>
                    )}

                    {/* Content */}
                    <div
                      className={`space-y-4 p-6 ${
                        event.image ? "lg:col-span-2" : "lg:col-span-3"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                event.status === "live"
                                  ? "default"
                                  : event.status === "recorded"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {statusLabels[event.status]}
                            </Badge>
                            <Badge variant="secondary">
                              {typeLabels[event.type]}
                            </Badge>
                            {event.isFree && (
                              <Badge className="bg-primary text-primary-foreground">
                                Бесплатно
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="mb-2 text-2xl lg:text-3xl">
                            {event.title}
                          </CardTitle>
                          <p className="text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>
                            {event.time} • {event.duration}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4 text-primary" />
                          <span>
                            {event.registered.toLocaleString("ru-RU")}
                            {event.maxParticipants &&
                              ` / ${event.maxParticipants.toLocaleString("ru-RU")}`}{" "}
                            участников
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4 text-primary" />
                          <span>{event.instructor}</span>
                        </div>
                      </div>

                      {/* Instructor */}
                      <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                        {event.instructorAvatar && (
                          <img
                            src={event.instructorAvatar}
                            alt={event.instructor}
                            loading="lazy"
                            decoding="async"
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{event.instructor}</p>
                          <p className="text-xs text-muted-foreground">
                            Преподаватель
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-4">
                        {event.status === "upcoming" && (
                          <Button
                            variant={event.isFree ? "hero" : "default"}
                            size="lg"
                            asChild
                          >
                            <Link to={`/schedule/${event.id}`}>
                              {event.isFree ? (
                                <>
                                  Записаться бесплатно
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  Записаться за {event.price?.toLocaleString("de-DE")} €
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                              )}
                            </Link>
                          </Button>
                        )}
                        {event.status === "recorded" && (
                          <Button variant="outline" size="lg" asChild>
                            <Link to={`/schedule/${event.id}`}>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Смотреть запись
                            </Link>
                          </Button>
                        )}
                        {event.status === "live" && (
                          <Button variant="hero" size="lg" asChild>
                            <Link to={`/schedule/${event.id}`}>
                              <Video className="mr-2 h-4 w-4" />
                              Присоединиться
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          Добавить в календарь
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
                </FadeInOnScroll>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="mb-4 text-xl font-medium">События не найдены</p>
              <p className="mb-6 text-muted-foreground">
                Попробуйте изменить фильтры
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedType("all");
                  setSelectedStatus("all");
                }}
              >
                Сбросить фильтры
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary/30 py-16 lg:py-24">
        <div className="container">
          <div className="overflow-hidden rounded-3xl gradient-accent p-8 text-center lg:p-16">
            <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground lg:text-4xl">
              Не нашли подходящее событие?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">
              Подпишитесь на рассылку и получайте уведомления о новых вебинарах и
              мастер-классах
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="gold" size="lg">
                Подписаться на рассылку
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                asChild
              >
                <Link to="/courses">Посмотреть курсы</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

