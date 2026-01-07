import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQSectionProps {
  title?: string;
  description?: string;
  items?: FAQItem[];
  className?: string;
  showHeader?: boolean;
  wrapperClassName?: string;
}

const defaultFAQItems: FAQItem[] = [
  {
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
    question: "Можно ли оплатить курс в рассрочку?",
    answer:
      "Да, мы предлагаем рассрочку на все курсы. Подробности уточняйте у наших менеджеров по телефону или через форму обратной связи.",
  },
  {
    question: "Выдаете ли вы сертификаты?",
    answer:
      "Да, после успешного завершения курса вы получите официальный сертификат установленного образца, который подтверждает вашу квалификацию.",
  },
  {
    question: "Есть ли поддержка после окончания курса?",
    answer:
      "Да, мы предоставляем поддержку выпускникам в течение 6 месяцев после окончания курса. Вы можете задавать вопросы куратору и получать консультации.",
  },
  {
    question: "Как проходит обучение?",
    answer:
      "Обучение проходит в онлайн-формате. Вы получаете доступ к видео-урокам, практическим заданиям и можете общаться с куратором в личном кабинете. Все материалы доступны в любое время.",
  },
  {
    question: "Нужны ли специальные инструменты для обучения?",
    answer:
      "Для базовых курсов достаточно минимального набора инструментов. Список необходимых материалов вы получите после записи на курс. Для продвинутых курсов список инструментов более расширенный.",
  },
];

export function FAQSection({
  title = "Часто задаваемые вопросы",
  description = "Возможно, ответ на ваш вопрос уже есть здесь",
  items = defaultFAQItems,
  className = "",
  showHeader = true,
  wrapperClassName = "",
}: FAQSectionProps) {
  const content = (
    <div className={`mx-auto  ${wrapperClassName}`}>
      {showHeader && (
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
            {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      )}

      <Card variant="elevated" className="overflow-hidden">
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-border/50 last:border-b-0 transition-colors hover:bg-muted/30"
            >
              <AccordionTrigger className="px-6 py-5 text-left font-semibold text-foreground hover:no-underline">
                <span className="pr-4">{item.question}</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-muted-foreground">
                <div className="leading-relaxed text-sm">{item.answer}</div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );

  if (className.includes("py-0") || !className.includes("py-")) {
    return <div className={className}>{content}</div>;
  }

  return (
    <section className={`py-16 lg:py-24 ${className}`}>
      <div className="container">
        {content}
      </div>
    </section>
  );
}

