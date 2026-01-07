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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TestimonialsSection } from "@/components/testimonials/TestimonialsSection";
import { ContactInfoSection } from "@/components/contact/ContactInfoSection";
import { TeamSection } from "@/components/team/TeamSection";

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
      <TeamSection className="bg-secondary/30" />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Contact Section */}
      <ContactInfoSection className="bg-secondary/30" />

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




