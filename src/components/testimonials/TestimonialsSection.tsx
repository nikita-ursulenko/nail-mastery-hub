import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TestimonialCard } from "./TestimonialCard";
import { api } from "@/lib/api";

interface Testimonial {
  id?: number;
  name: string;
  role: string;
  avatar?: string | null;
  text: string;
  rating: number;
  beforeImage?: string;
  afterImage?: string;
}

interface TestimonialsSectionProps {
  title?: string;
  description?: string;
  className?: string;
  variant?: "default" | "secondary";
}

export function TestimonialsSection({
  title = "Отзывы наших учениц",
  description = "Реальные истории успеха от выпускниц нашей школы",
  className = "",
  variant = "default",
}: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const backgroundClass =
    variant === "secondary" ? "bg-secondary/30" : "";

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const data = await api.getPublicTestimonials();
      setTestimonials(data);
    } catch (error) {
      console.error("Failed to load testimonials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={`${backgroundClass} py-16 lg:py-24 ${className}`}>
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {description}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Загрузка отзывов...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Отзывов пока нет</p>
          </div>
        ) : (
          <div className="relative px-8 lg:px-16">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {testimonials.map((testimonial) => (
                  <CarouselItem
                    key={testimonial.id || testimonial.name}
                    className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    <TestimonialCard
                      name={testimonial.name}
                      role={testimonial.role}
                      avatar={testimonial.avatar || ""}
                      text={testimonial.text}
                      rating={testimonial.rating}
                      beforeImage={testimonial.beforeImage}
                      afterImage={testimonial.afterImage}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden lg:flex" />
              <CarouselNext className="hidden lg:flex" />
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
}

