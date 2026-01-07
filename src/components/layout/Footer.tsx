import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Send, Mail, Phone } from "lucide-react";
import { api } from "@/lib/api";

const iconMap: Record<string, any> = {
  Phone,
  Mail,
  Instagram,
};

interface Contact {
  id: number;
  type: string;
  title: string;
  content: string;
  href?: string | null;
  icon: string;
}

export function Footer() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await api.getPublicContacts();
      // Показываем только телефон и email в футере
      const footerContacts = data.filter(
        (contact: Contact) => contact.type === 'phone' || contact.type === 'email'
      );
      setContacts(footerContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

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
              {contacts
                .filter((contact) => contact.type === 'social')
                .map((contact) => {
                  const Icon = iconMap[contact.icon] || Instagram;
                  return (
                    <a
                      key={contact.id}
                      href={contact.href || '#'}
                      target={contact.href?.startsWith('http') ? '_blank' : undefined}
                      rel={contact.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
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
            {contacts.length > 0 ? (
              <ul className="space-y-3 text-sm text-muted-foreground">
                {contacts.map((contact) => {
                  const Icon = iconMap[contact.icon] || Mail;
                  return (
                    <li key={contact.id} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {contact.href ? (
                        <a href={contact.href} className="hover:text-primary">
                          {contact.content}
                        </a>
                      ) : (
                        <span>{contact.content}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Загрузка...</span>
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 NailArt Academy. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
