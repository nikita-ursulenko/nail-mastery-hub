import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Instagram } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

interface ContactInfoSectionProps {
  title?: string;
  description?: string;
  variant?: "compact" | "full";
  className?: string;
}

const iconMap: Record<string, any> = {
  Phone,
  Mail,
  MapPin,
  Instagram,
};

interface Contact {
  id: number;
  type: string;
  title: string;
  content: string;
  href?: string | null;
  subtitle?: string | null;
  icon: string;
  display_order: number;
  is_active: boolean;
}

export function ContactInfoSection({
  title = "Свяжитесь с нами",
  description = "У вас есть вопросы? Мы всегда рады помочь!",
  variant = "full",
  className = "",
}: ContactInfoSectionProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await api.getPublicContacts();
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const contactCards = contacts.map((contact) => {
    const Icon = iconMap[contact.icon] || Phone;
    return {
      icon: Icon,
      title: contact.title,
      content: contact.content,
      href: contact.href,
      subtitle: contact.subtitle,
    };
  });

  const cardsToShow = variant === "compact" ? contactCards.slice(0, 3) : contactCards;
  const gridCols = variant === "compact" 
    ? "grid-cols-2 md:grid-cols-3" 
    : "grid-cols-2 md:grid-cols-2 lg:grid-cols-4";

  return (
    <section className={`py-16 lg:py-24 ${className}`}>
      <div className="container">
        <div className="mx-auto">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
              {title}
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {description}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Загрузка контактов...</div>
            </div>
          ) : contactCards.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Контакты не найдены</div>
            </div>
          ) : (
            <div className={`grid gap-3 sm:gap-4 md:gap-6 ${gridCols}`}>
              {cardsToShow.map((card, index) => {
                const Icon = card.icon;
                return (
                  <Card key={index} variant="elevated">
                  <CardContent className="p-4 text-center sm:p-6">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 sm:mb-4 sm:h-12 sm:w-12">
                      <Icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="mb-1.5 text-sm font-semibold sm:mb-2 sm:text-base">{card.title}</h3>
                    {card.href ? (
                      <a
                        href={card.href}
                        target={card.href.startsWith("http") ? "_blank" : undefined}
                        rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-xs text-primary hover:underline sm:text-sm"
                      >
                        {card.content}
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground sm:text-sm">{card.content}</p>
                    )}
                    {card.subtitle && (
                      <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
                        {card.subtitle}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

