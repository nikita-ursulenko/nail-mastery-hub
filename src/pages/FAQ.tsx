import { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ArrowRight, BookOpen, CreditCard, GraduationCap, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FAQSection } from "@/components/faq/FAQSection";
import { ContactInfoSection } from "@/components/contact/ContactInfoSection";
import { FadeInOnScroll } from "@/components/FadeInOnScroll";

type FAQCategory = "general" | "learning" | "payment" | "career" | "support";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
  category: FAQCategory;
}

const faqItems: FAQItem[] = [
  // Общие вопросы
  {
    category: "general",
    question: "Как записаться на курс?",
    answer: (
      <>
        Выберите интересующий курс на странице{" "}
        <Link to="/courses" className="text-primary hover:underline font-medium">
          Курсы
        </Link>
        , нажмите "Записаться" и следуйте инструкциям. Также вы можете
        связаться с нами по телефону или через форму обратной связи.
      </>
    ),
  },
  {
    category: "general",
    question: "Выдаете ли вы сертификаты?",
    answer:
      "Да, после успешного завершения курса вы получите официальный сертификат установленного образца, который подтверждает вашу квалификацию.",
  },
  {
    category: "general",
    question: "Есть ли поддержка после окончания курса?",
    answer:
      "Да, мы предоставляем поддержку выпускникам в течение 6 месяцев после окончания курса. Вы можете задавать вопросы куратору и получать консультации.",
  },
  // Обучение
  {
    category: "learning",
    question: "Как проходит обучение?",
    answer:
      "Обучение проходит в онлайн-формате. Вы получаете доступ к видео-урокам, практическим заданиям и можете общаться с куратором в личном кабинете. Все материалы доступны в любое время.",
  },
  {
    category: "learning",
    question: "Нужны ли специальные инструменты для обучения?",
    answer:
      "Для базовых курсов достаточно минимального набора инструментов. Список необходимых материалов вы получите после записи на курс. Для продвинутых курсов список инструментов более расширенный.",
  },
  {
    category: "learning",
    question: "Сколько времени занимает обучение?",
    answer:
      "Длительность курсов варьируется от 2 до 8 недель в зависимости от программы. Вы можете изучать материалы в своем темпе, но рекомендуем придерживаться предложенного графика для лучшего результата.",
  },
  {
    category: "learning",
    question: "Можно ли получить доступ к материалам после окончания курса?",
    answer:
      "Да, все материалы курса остаются доступными в вашем личном кабинете навсегда. Вы можете возвращаться к урокам в любое время.",
  },
  {
    category: "learning",
    question: "Есть ли домашние задания?",
    answer:
      "Да, каждый курс включает практические задания, которые проверяются куратором. Вы получите обратную связь и рекомендации по улучшению ваших работ.",
  },
  // Оплата и возврат
  {
    category: "payment",
    question: "Можно ли оплатить курс в рассрочку?",
    answer:
      "Да, мы предлагаем рассрочку на все курсы. Подробности уточняйте у наших менеджеров по телефону или через форму обратной связи.",
  },
  {
    category: "payment",
    question: "Какие способы оплаты доступны?",
    answer:
      "Мы принимаем оплату банковскими картами, через электронные кошельки и банковские переводы. Также доступна оплата в рассрочку.",
  },
  {
    category: "payment",
    question: "Можно ли вернуть деньги, если курс не подошел?",
    answer:
      "Да, мы предоставляем гарантию возврата средств в течение 14 дней с момента начала обучения, если курс не соответствует вашим ожиданиям.",
  },
  {
    category: "payment",
    question: "Действуют ли скидки на курсы?",
    answer:
      "Да, мы регулярно проводим акции и предоставляем скидки. Подпишитесь на нашу рассылку или следите за новостями в социальных сетях, чтобы не пропустить выгодные предложения.",
  },
  // Карьера и развитие
  {
    category: "career",
    question: "Помогаете ли вы с трудоустройством после обучения?",
    answer:
      "Мы предоставляем информацию о вакансиях в нашей закрытой группе выпускников, а также проводим мастер-классы по поиску работы и развитию карьеры в индустрии красоты.",
  },
  {
    category: "career",
    question: "Можно ли начать работать сразу после окончания курса?",
    answer:
      "Да, многие наши выпускники начинают работать уже во время обучения, выполняя первые заказы. Мы рекомендуем набраться опыта на практике и постепенно увеличивать сложность работ.",
  },
  // Технические вопросы
  {
    category: "support",
    question: "На каких устройствах можно проходить обучение?",
    answer:
      "Вы можете проходить обучение на любом устройстве: компьютере, планшете или смартфоне. Наш сайт адаптирован для всех экранов и операционных систем.",
  },
  {
    category: "support",
    question: "Что делать, если не могу войти в личный кабинет?",
    answer:
      "Если у вас возникли проблемы с входом, проверьте правильность ввода email и пароля. Если проблема сохраняется, свяжитесь с нашей службой поддержки по телефону или email.",
  },
  {
    category: "support",
    question: "Нужно ли устанавливать специальное программное обеспечение?",
    answer:
      "Нет, для прохождения курсов не требуется установка дополнительного ПО. Все материалы доступны через браузер. Для просмотра видео рекомендуется стабильное интернет-соединение.",
  },
];

const categories = [
  {
    id: "general" as FAQCategory,
    icon: HelpCircle,
    title: "Общие вопросы",
    description: "Основная информация о курсах и школе",
  },
  {
    id: "learning" as FAQCategory,
    icon: BookOpen,
    title: "Обучение",
    description: "Вопросы о процессе обучения и материалах",
  },
  {
    id: "payment" as FAQCategory,
    icon: CreditCard,
    title: "Оплата",
    description: "Способы оплаты, рассрочка и возврат средств",
  },
  {
    id: "career" as FAQCategory,
    icon: GraduationCap,
    title: "Карьера",
    description: "Трудоустройство и развитие в профессии",
  },
  {
    id: "support" as FAQCategory,
    icon: Settings,
    title: "Поддержка",
    description: "Техническая поддержка и помощь",
  },
];

const getCategoryItems = (category: FAQCategory) => {
  return faqItems.filter((item) => item.category === category);
};

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>("general");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero py-16 lg:py-24">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <HelpCircle className="h-4 w-4" />
              <span>Помощь и поддержка</span>
            </div>
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight lg:text-5xl">
              Часто задаваемые{" "}
              <span className="text-gradient">вопросы</span>
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Нашли ответы на самые популярные вопросы о наших курсах, обучении и поддержке
            </p>
          </div>
        </div>
      </section>

      {/* Categories and FAQ Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <FadeInOnScroll>
            <div className="mb-8 text-center lg:mb-12">
              <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
                Категории вопросов
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Выберите интересующую категорию для быстрого поиска
              </p>
            </div>
          </FadeInOnScroll>

          {/* Mobile: Horizontal Scrollable Categories */}
          <div className="mb-8 lg:hidden">
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-3 min-w-max">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const itemsCount = getCategoryItems(category.id).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex min-w-[120px] flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                        activeCategory === category.id
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        activeCategory === category.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10"
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          activeCategory === category.id ? "text-primary-foreground" : "text-primary"
                        }`} />
                      </div>
                      <span className={`text-xs font-semibold ${
                        activeCategory === category.id ? "text-primary" : "text-foreground"
                      }`}>
                        {category.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {itemsCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop: Full Category Cards */}
          <div className="mb-16 hidden grid-cols-2 gap-6 lg:grid lg:grid-cols-5">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const itemsCount = getCategoryItems(category.id).length;
              return (
                <FadeInOnScroll key={category.id} delay={index * 100} className="h-full">
                  <Card 
                    variant="elevated" 
                    className={`group transition-all cursor-pointer border-2 h-full flex flex-col ${
                      activeCategory === category.id 
                        ? "ring-2 ring-primary shadow-lg border-primary" 
                        : "border-border hover:border-primary/50 hover:shadow-lg"
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                  <CardContent className="p-6 text-center flex flex-col flex-1">
                    <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${
                      activeCategory === category.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-primary/10 group-hover:bg-primary/20"
                    }`}>
                      <Icon className={`h-7 w-7 transition-transform group-hover:scale-110 ${
                        activeCategory === category.id ? "text-primary-foreground" : "text-primary"
                      }`} />
                    </div>
                    <h3 className={`mb-2 font-display text-xl font-semibold transition-colors ${
                      activeCategory === category.id 
                        ? "text-primary" 
                        : "group-hover:text-primary"
                    }`}>
                      {category.title}
                    </h3>
                    <p className="mb-3 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    <p className="text-xs text-primary font-medium">
                      {itemsCount} {itemsCount === 1 ? "вопрос" : itemsCount < 5 ? "вопроса" : "вопросов"}
                    </p>
                  </CardContent>
                </Card>
                </FadeInOnScroll>
              );
            })}
          </div>

          {/* FAQ Content */}
          <div className="mx-auto max-w-3xl">
            <FAQSection
              title={categories.find(c => c.id === activeCategory)?.title || "Вопросы"}
              description={categories.find(c => c.id === activeCategory)?.description || ""}
              items={getCategoryItems(activeCategory)}
              className="py-0"
              showHeader={true}
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactInfoSection
        title="Не нашли ответ?"
        description="Свяжитесь с нами, и мы поможем вам найти решение"
      />

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <FadeInOnScroll>
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
          </FadeInOnScroll>
        </div>
      </section>

      <Footer />
    </div>
  );
}

