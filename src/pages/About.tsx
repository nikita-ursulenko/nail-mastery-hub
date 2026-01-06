import { Link } from "react-router-dom";
import {
  Award,
  Users,
  GraduationCap,
  Heart,
  Target,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TestimonialCard } from "@/components/testimonials/TestimonialCard";

import instructorImage from "@/assets/instructor.jpg";

const stats = [
  { icon: Users, value: "15 000+", label: "Выпускников" },
  { icon: GraduationCap, value: "50+", label: "Курсов" },
  { icon: Award, value: "98%", label: "Довольных учеников" },
  { icon: Heart, value: "6 лет", label: "Опыта работы" },
];

const values = [
  {
    icon: Target,
    title: "Практический подход",
    description:
      "Все курсы основаны на реальном опыте работы в салонах. Мы учим тому, что действительно нужно в работе.",
  },
  {
    icon: Users,
    title: "Индивидуальная поддержка",
    description:
      "Каждый ученик получает персональную обратную связь от куратора и может задавать вопросы в любое время.",
  },
  {
    icon: Award,
    title: "Актуальные знания",
    description:
      "Программы регулярно обновляются с учётом новых трендов и технологий в индустрии красоты.",
  },
  {
    icon: Sparkles,
    title: "Сообщество мастеров",
    description:
      "Присоединяйтесь к закрытому сообществу выпускников, где можно делиться опытом и находить клиентов.",
  },
];

const team = [
  {
    name: "Анна Петрова",
    role: "Основатель и главный преподаватель",
    image: instructorImage,
    bio: "Международный судья, призёр чемпионатов по nail-art. Обучила более 15 000 мастеров по всему миру.",
    achievements: [
      "12 лет опыта в индустрии",
      "Автор уникальных техник",
      "Эксперт beauty-изданий",
    ],
  },
  {
    name: "Мария Соколова",
    role: "Преподаватель дизайна",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    bio: "Специалист по художественному дизайну ногтей. Работает с топовыми салонами Москвы и Санкт-Петербурга.",
    achievements: [
      "8 лет в профессии",
      "Мастер международного класса",
      "Победитель конкурсов дизайна",
    ],
  },
  {
    name: "Елена Новикова",
    role: "Преподаватель наращивания",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
    bio: "Эксперт по наращиванию гелем и акрилом. Помогла сотням мастеров освоить сложные техники.",
    achievements: [
      "10 лет опыта",
      "Сертифицированный тренер",
      "Автор курсов по архитектуре",
    ],
  },
];

const testimonials = [
  {
    name: "Анна Козлова",
    role: "Выпускница базового курса",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    text: "Благодаря курсу я смогла уволиться с нелюбимой работы и открыть свой кабинет. Уже через 3 месяца полностью окупила обучение!",
    rating: 5,
  },
  {
    name: "Мария Соколова",
    role: "Мастер маникюра",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    text: "Курс по дизайну полностью изменил мой подход к работе. Клиенты в восторге, записываются за месяц вперёд!",
    rating: 5,
  },
  {
    name: "Елена Новикова",
    role: "Начинающий мастер",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    text: "Очень понравился формат обучения. Куратор всегда на связи, материалы понятные даже для новичка.",
    rating: 5,
  },
];

const history = [
  {
    year: "2018",
    title: "Основание школы",
    description:
      "Анна Петрова открыла онлайн-школу с целью сделать качественное обучение маникюру доступным для всех.",
  },
  {
    year: "2019",
    title: "Первая тысяча учеников",
    description:
      "Школа достигла отметки в 1000 выпускников и получила первые награды за качество обучения.",
  },
  {
    year: "2021",
    title: "Международное признание",
    description:
      "Курсы стали доступны на нескольких языках, а наши выпускники работают в салонах по всему миру.",
  },
  {
    year: "2024",
    title: "15 000+ выпускников",
    description:
      "Мы продолжаем расти и развиваться, добавляя новые курсы и улучшая программы обучения.",
  },
];

export default function About() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container relative z-10 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>О нашей школе</span>
            </div>
            <h1 className="mb-6 font-display text-4xl font-bold leading-tight lg:text-6xl">
              Мы создаём{" "}
              <span className="text-gradient">профессионалов</span> в индустрии
              красоты
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              С 2018 года мы обучаем мастеров маникюра по всему миру. Наша
              миссия — сделать качественное образование доступным и помочь
              каждому найти своё призвание.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} variant="elevated" className="group">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <stat.icon className="h-7 w-7 text-primary" />
                  </div>
                  <p className="mb-2 font-display text-3xl font-bold text-primary">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="bg-secondary/30 py-16 lg:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
              Наша история
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Путь от маленькой онлайн-школы до признанного лидера в обучении
              маникюру
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 hidden h-full w-0.5 bg-primary/20 lg:block" />

            <div className="space-y-12">
              {history.map((item, index) => (
                <div
                  key={item.year}
                  className="relative flex gap-8 lg:gap-12"
                >
                  {/* Year badge */}
                  <div className="relative z-10 shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-elevated lg:h-20 lg:w-20 lg:text-xl">
                      {item.year}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-12">
                    <Card variant="elevated">
                      <CardContent className="p-6">
                        <h3 className="mb-2 font-display text-xl font-semibold lg:text-2xl">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
              Наши ценности
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Принципы, которыми мы руководствуемся в работе
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card key={value.title} variant="elevated" className="group">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <value.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 font-display text-xl font-semibold">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-secondary/30 py-16 lg:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
              Наша команда
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Опытные преподаватели, которые помогут вам достичь успеха
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <Card key={member.name} variant="elevated" className="group">
                <CardContent className="p-6">
                  <div className="mb-6 overflow-hidden rounded-xl">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mb-1 font-display text-xl font-semibold">
                    {member.name}
                  </h3>
                  <p className="mb-4 text-sm text-primary">{member.role}</p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {member.bio}
                  </p>
                  <ul className="space-y-2">
                    {member.achievements.map((achievement) => (
                      <li
                        key={achievement}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">
                          {achievement}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
              Отзывы наших учениц
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Реальные истории успеха от выпускниц нашей школы
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.name} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-secondary/30 py-16 lg:py-24">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
                Свяжитесь с нами
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                У вас есть вопросы? Мы всегда рады помочь!
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">Email</h3>
                  <a
                    href="mailto:info@nailart.academy"
                    className="text-sm text-primary hover:underline"
                  >
                    info@nailart.academy
                  </a>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">Телефон</h3>
                  <a
                    href="tel:+79001234567"
                    className="text-sm text-primary hover:underline"
                  >
                    +7 900 123-45-67
                  </a>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Instagram className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">Социальные сети</h3>
                  <a
                    href="#"
                    className="text-sm text-primary hover:underline"
                  >
                    @nailart_academy
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="overflow-hidden rounded-3xl gradient-accent p-8 text-center lg:p-16">
            <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground lg:text-4xl">
              Готовы начать обучение?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">
              Присоединяйтесь к тысячам мастеров, которые уже изменили свою
              жизнь благодаря нашим курсам
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="gold" size="xl" asChild>
                <Link to="/courses">
                  Выбрать курс
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                asChild
              >
                <Link to="/schedule">Бесплатный вебинар</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}




