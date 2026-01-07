import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Send,
  MessageSquare,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FAQSection } from "@/components/faq/FAQSection";
import { ContactInfoSection } from "@/components/contact/ContactInfoSection";

export default function Contacts() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Реализовать отправку формы через API
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Спасибо! Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Contact Info Cards */}
      <ContactInfoSection 
        title="Свяжитесь с нами"
        description="Мы всегда рады ответить на ваши вопросы и помочь с выбором курса"
      />

      {/* Contact Form & Map Section */}
      <section className="bg-secondary/30 py-8 sm:py-12 lg:py-16">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            {/* Contact Form */}
            <div>
              <div className="mb-6 sm:mb-8">
                <h2 className="mb-2 text-2xl font-bold sm:mb-4 sm:text-3xl lg:text-4xl font-display">
                  Напишите нам
                </h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Заполните форму, и мы свяжемся с вами в ближайшее время
                </p>
              </div>

              <Card variant="elevated">
                <CardContent className="p-4 sm:p-6">
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="name" className="text-sm">Имя *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                          placeholder="Ваше имя"
                          className="h-10 sm:h-11"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="phone" className="text-sm">Телефон</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+7 900 123-45-67"
                          className="h-10 sm:h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="email" className="text-sm">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                        placeholder="your@email.com"
                        className="h-10 sm:h-11"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="subject" className="text-sm">Тема *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        required
                        placeholder="О чем вы хотите узнать?"
                        className="h-10 sm:h-11"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="message" className="text-sm">Сообщение *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        required
                        rows={5}
                        className="min-h-[120px] sm:min-h-[150px] resize-none"
                        placeholder="Расскажите подробнее о вашем вопросе..."
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 sm:h-12"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Отправка...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Отправить сообщение
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Map & Additional Info */}
            <div className="space-y-4 sm:space-y-6">
              {/* Map Placeholder */}
              <Card variant="elevated" className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative h-48 bg-muted sm:h-64 lg:h-96">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-4">
                        <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
                        <p className="text-xs text-muted-foreground sm:text-sm">
                          Карта будет здесь
                        </p>
                        <p className="mt-1.5 text-[10px] text-muted-foreground sm:mt-2 sm:text-xs">
                          г. Москва, ул. Примерная, д. 1
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Working Hours */}
              <Card variant="elevated">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 sm:h-10 sm:w-10">
                      <Clock className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-base font-semibold sm:text-lg">Часы работы</h3>
                  </div>
                  <div className="space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Понедельник - Пятница</span>
                      <span className="font-medium">9:00 - 21:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Суббота</span>
                      <span className="font-medium">10:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Воскресенье</span>
                      <span className="font-medium">10:00 - 16:00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Contact */}
              <Card variant="elevated">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 sm:h-10 sm:w-10">
                      <MessageSquare className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-base font-semibold sm:text-lg">Быстрая связь</h3>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground sm:mb-4 sm:text-sm">
                    Предпочитаете общаться в мессенджерах? Мы на связи!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-9 text-xs sm:h-10 sm:text-sm" asChild>
                      <a href="https://wa.me/79001234567" target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 text-xs sm:h-10 sm:text-sm" asChild>
                      <a href="https://t.me/nailart_academy" target="_blank" rel="noopener noreferrer">
                        Telegram
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <div className="mx-auto max-w-3xl container">
        <FAQSection />
      </div>

      {/* CTA Section */}
      <section className="bg-secondary/30 py-16 lg:py-24">
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
                <Link to="/courses">Выбрать курс</Link>
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

