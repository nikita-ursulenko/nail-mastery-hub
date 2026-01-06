import { Link } from "react-router-dom";
import { Instagram, Send, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container py-12 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold text-primary">
                NailArt
              </span>
              <span className="font-display text-lg text-muted-foreground">
                Academy
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Онлайн-школа маникюра для начинающих и профессионалов. Обучаем с
              2018 года.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Send className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Courses */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Курсы</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/courses" className="hover:text-primary">
                  Базовый маникюр
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-primary">
                  Гель-лак
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-primary">
                  Наращивание
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-primary">
                  Дизайн ногтей
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Поддержка</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/faq" className="hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary">
                  О нас
                </Link>
              </li>
              <li>
                <Link to="/contacts" className="hover:text-primary">
                  Контакты
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary">
                  Оферта
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Контакты</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@nailart.academy" className="hover:text-primary">
                  info@nailart.academy
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+79001234567" className="hover:text-primary">
                  +7 900 123-45-67
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 NailArt Academy. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
