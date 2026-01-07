import { Link } from "react-router-dom";
import { FileText, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactInfoSection } from "@/components/contact/ContactInfoSection";

export default function Terms() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero py-16 lg:py-24">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <FileText className="h-4 w-4" />
              <span>Публичная оферта</span>
            </div>
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight lg:text-5xl">
              Договор{" "}
              <span className="text-gradient">публичной оферты</span>
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Условия предоставления образовательных услуг онлайн-школой маникюра
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Дата последнего обновления: {new Date().toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <Card variant="elevated" className="overflow-hidden">
              <CardContent className="p-6 sm:p-8 lg:p-12">
                <div className="prose prose-slate max-w-none dark:prose-invert">
                  {/* 1. Общие положения */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      1. Общие положения
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        1.1. Настоящий документ является публичной офертой (далее — "Оферта") в адрес физических лиц (далее — "Пользователь") о заключении договора на оказание образовательных услуг на условиях, изложенных ниже.
                      </p>
                      <p>
                        1.2. В соответствии с пунктом 2 статьи 437 Гражданского кодекса Российской Федерации, в случае принятия изложенных ниже условий и оплаты услуг лицо, производящее акцепт этой оферты, становится Заказчиком (акцепт оферты равносилен заключению договора на условиях, изложенных в оферте).
                      </p>
                      <p>
                        1.3. Моментом полного и безоговорочного принятия Пользователем настоящей Оферты (акцептом) считается факт оплаты услуг, что означает полное согласие Пользователя с условиями настоящей Оферты.
                      </p>
                      <p>
                        1.4. Исполнитель оставляет за собой право вносить изменения в настоящую Оферту без уведомления Пользователя. Новая редакция Оферты вступает в силу с момента её размещения на сайте.
                      </p>
                    </div>
                  </div>

                  {/* 2. Термины и определения */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      2. Термины и определения
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Исполнитель</strong> — ООО "NailArt Academy" (или иное юридическое лицо, указанное на сайте), предоставляющее образовательные услуги.
                      </p>
                      <p>
                        <strong className="text-foreground">Заказчик</strong> — физическое лицо, заключившее договор на оказание образовательных услуг на условиях настоящей Оферты.
                      </p>
                      <p>
                        <strong className="text-foreground">Сайт</strong> — интернет-сайт, расположенный по адресу nailart-academy.com и его поддомены.
                      </p>
                      <p>
                        <strong className="text-foreground">Курс</strong> — образовательная программа, размещенная на Сайте, включающая в себя видеоматериалы, текстовые материалы, практические задания и иные образовательные материалы.
                      </p>
                      <p>
                        <strong className="text-foreground">Личный кабинет</strong> — персональный раздел Сайта, доступ к которому предоставляется Заказчику после регистрации и оплаты Курса.
                      </p>
                    </div>
                  </div>

                  {/* 3. Предмет договора */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      3. Предмет договора
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        3.1. Исполнитель обязуется предоставить Заказчику доступ к образовательным материалам выбранного Курса в соответствии с программой обучения, размещенной на Сайте.
                      </p>
                      <p>
                        3.2. Заказчик обязуется оплатить услуги Исполнителя в размере и порядке, указанных на Сайте.
                      </p>
                      <p>
                        3.3. Образовательные услуги предоставляются в дистанционной форме посредством доступа к материалам Курса в Личном кабинете.
                      </p>
                    </div>
                  </div>

                  {/* 4. Порядок оказания услуг */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      4. Порядок оказания услуг
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        4.1. После оплаты Курса Заказчику предоставляется доступ к Личному кабинету и материалам Курса.
                      </p>
                      <p>
                        4.2. Доступ к материалам Курса предоставляется на неограниченный срок с момента оплаты.
                      </p>
                      <p>
                        4.3. Заказчик получает возможность просматривать видеоматериалы, изучать текстовые материалы, выполнять практические задания и получать обратную связь от куратора в соответствии с программой Курса.
                      </p>
                      <p>
                        4.4. Исполнитель обязуется обеспечить техническую доступность Сайта и Личного кабинета в течение срока действия договора.
                      </p>
                    </div>
                  </div>

                  {/* 5. Стоимость услуг и порядок оплаты */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      5. Стоимость услуг и порядок оплаты
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        5.1. Стоимость Курса указана на Сайте в разделе соответствующего Курса.
                      </p>
                      <p>
                        5.2. Оплата производится путем перечисления денежных средств на расчетный счет Исполнителя или через платежные системы, указанные на Сайте.
                      </p>
                      <p>
                        5.3. Моментом оплаты считается поступление денежных средств на счет Исполнителя.
                      </p>
                      <p>
                        5.4. Исполнитель вправе предоставлять скидки и проводить акции на свои услуги. Размер скидки и условия акций определяются Исполнителем самостоятельно.
                      </p>
                    </div>
                  </div>

                  {/* 6. Права и обязанности сторон */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      6. Права и обязанности сторон
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <p className="mb-2 font-semibold text-foreground">6.1. Исполнитель обязуется:</p>
                        <ul className="ml-6 list-disc space-y-2">
                          <li>Предоставить доступ к материалам Курса в соответствии с программой обучения</li>
                          <li>Обеспечить техническую поддержку и доступность Личного кабинета</li>
                          <li>Предоставлять обратную связь по выполненным практическим заданиям</li>
                          <li>Выдать сертификат об окончании Курса при успешном выполнении всех заданий</li>
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 font-semibold text-foreground">6.2. Заказчик обязуется:</p>
                        <ul className="ml-6 list-disc space-y-2">
                          <li>Своевременно оплатить услуги Исполнителя</li>
                          <li>Не передавать доступ к Личному кабинету третьим лицам</li>
                          <li>Не копировать, не распространять и не использовать материалы Курса в коммерческих целях без письменного разрешения Исполнителя</li>
                          <li>Соблюдать правила использования Сайта и Личного кабинета</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 7. Возврат средств */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      7. Возврат средств
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        7.1. Заказчик вправе отказаться от услуг Исполнителя в течение 14 (четырнадцати) календарных дней с момента оплаты, если доступ к материалам Курса не был предоставлен.
                      </p>
                      <p>
                        7.2. В случае, если доступ к материалам Курса был предоставлен, возврат средств возможен только в течение 14 (четырнадцати) календарных дней с момента оплаты при условии, что Заказчик не просмотрел более 20% материалов Курса.
                      </p>
                      <p>
                        7.3. Для возврата средств Заказчик должен направить письменное заявление на электронную почту Исполнителя с указанием причины возврата.
                      </p>
                      <p>
                        7.4. Возврат средств производится тем же способом, которым была произведена оплата, в течение 10 (десяти) рабочих дней с момента получения заявления.
                      </p>
                    </div>
                  </div>

                  {/* 8. Интеллектуальная собственность */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      8. Интеллектуальная собственность
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        8.1. Все материалы Курса, включая видеоматериалы, текстовые материалы, изображения, графические элементы, являются объектами интеллектуальной собственности Исполнителя и защищены законодательством об интеллектуальной собственности.
                      </p>
                      <p>
                        8.2. Заказчик получает право на использование материалов Курса исключительно в личных образовательных целях.
                      </p>
                      <p>
                        8.3. Запрещается копирование, распространение, публикация, передача третьим лицам материалов Курса без письменного разрешения Исполнителя.
                      </p>
                    </div>
                  </div>

                  {/* 9. Ответственность сторон */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      9. Ответственность сторон
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        9.1. Исполнитель не несет ответственности за невозможность использования Сайта и Личного кабинета по причинам, не зависящим от Исполнителя (технические сбои, действия третьих лиц, форс-мажорные обстоятельства).
                      </p>
                      <p>
                        9.2. Исполнитель не гарантирует достижение Заказчиком каких-либо конкретных результатов в результате прохождения Курса.
                      </p>
                      <p>
                        9.3. Заказчик несет полную ответственность за сохранность данных для доступа к Личному кабинету.
                      </p>
                    </div>
                  </div>

                  {/* 10. Конфиденциальность */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      10. Конфиденциальность
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        10.1. Исполнитель обязуется не разглашать персональные данные Заказчика третьим лицам, за исключением случаев, предусмотренных законодательством Российской Федерации.
                      </p>
                      <p>
                        10.2. Обработка персональных данных Заказчика осуществляется в соответствии с Политикой конфиденциальности, размещенной на Сайте.
                      </p>
                    </div>
                  </div>

                  {/* 11. Разрешение споров */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      11. Разрешение споров
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        11.1. Все споры и разногласия, возникающие между сторонами, решаются путем переговоров.
                      </p>
                      <p>
                        11.2. В случае невозможности разрешения спора путем переговоров, споры подлежат рассмотрению в суде по месту нахождения Исполнителя в соответствии с законодательством Российской Федерации.
                      </p>
                    </div>
                  </div>

                  {/* 12. Заключительные положения */}
                  <div className="mb-8">
                    <h2 className="mb-4 font-display text-2xl font-bold text-foreground lg:text-3xl">
                      12. Заключительные положения
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        12.1. Настоящая Оферта вступает в силу с момента её размещения на Сайте и действует до момента её отзыва Исполнителем.
                      </p>
                      <p>
                        12.2. Исполнитель вправе в любое время изменить условия настоящей Оферты без уведомления Заказчика. Новая редакция Оферты вступает в силу с момента её размещения на Сайте.
                      </p>
                      <p>
                        12.3. По всем вопросам, связанным с оказанием услуг, Заказчик может обращаться к Исполнителю по контактным данным, указанным на Сайте.
                      </p>
                      <p>
                        12.4. Настоящая Оферта регулируется законодательством Российской Федерации.
                      </p>
                    </div>
                  </div>

                  {/* Реквизиты */}
                  <div className="mt-12 rounded-lg border bg-muted/50 p-6">
                    <h3 className="mb-4 font-display text-xl font-bold text-foreground">
                      Реквизиты Исполнителя
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong className="text-foreground">Наименование:</strong> ООО "NailArt Academy"</p>
                      <p><strong className="text-foreground">ИНН:</strong> 1234567890</p>
                      <p><strong className="text-foreground">ОГРН:</strong> 1234567890123</p>
                      <p><strong className="text-foreground">Адрес:</strong> г. Москва, ул. Примерная, д. 1</p>
                      <p><strong className="text-foreground">Email:</strong> info@nailart-academy.com</p>
                      <p><strong className="text-foreground">Телефон:</strong> +7 900 123-45-67</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactInfoSection
        title="Остались вопросы?"
        description="Свяжитесь с нами, и мы ответим на все ваши вопросы об условиях предоставления услуг"
      />

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

