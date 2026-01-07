import { useEffect, useState, useRef, useCallback } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUserInteractingRef = useRef<boolean>(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const backgroundClass =
    variant === "secondary" ? "bg-secondary/30" : "";

  const loadTestimonials = async () => {
    try {
      const data = await api.getPublicTestimonials();
      setTestimonials(data);
    } catch (error) {
      console.error("Failed to load testimonials:", error);
      setTestimonials([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Очистка таймеров
  const clearTimers = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);

  // Запуск автослайда
  const startAutoplay = useCallback(() => {
    clearTimers();
    
    if (!carouselApi || isHovered || isPaused) {
      return;
    }

    autoplayTimerRef.current = setInterval(() => {
      if (!isHovered && !isPaused && carouselApi) {
        carouselApi.scrollNext();
      }
    }, 3000); // 3 секунды
  }, [carouselApi, isHovered, isPaused, clearTimers]);

  // Обработчик ручного переключения
  const handleUserScroll = useCallback(() => {
    isUserInteractingRef.current = true;
    
    // Ставим на паузу на 6 секунд
    setIsPaused(true);
    clearTimers();
    
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }
    
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      isUserInteractingRef.current = false;
      // Запускаем автослайд снова, если не наведена мышь
      if (!isHovered) {
        startAutoplay();
      }
    }, 6000); // 6 секунд
  }, [clearTimers, isHovered, startAutoplay]);

  // Отслеживание свайпов и перетаскиваний
  useEffect(() => {
    if (!carouselApi || !carouselRef.current) {
      return;
    }

    const carouselElement = carouselRef.current;
    let pointerDownTime = 0;
    let hasMoved = false;

    const handlePointerDown = () => {
      pointerDownTime = Date.now();
      hasMoved = false;
    };

    const handlePointerMove = () => {
      hasMoved = true;
    };

    const handlePointerUp = () => {
      // Если был свайп (движение), считаем это ручным взаимодействием
      if (hasMoved) {
        handleUserScroll();
      }
    };

    // Отслеживаем события pointer для определения свайпов
    carouselElement.addEventListener("pointerdown", handlePointerDown);
    carouselElement.addEventListener("pointermove", handlePointerMove);
    carouselElement.addEventListener("pointerup", handlePointerUp);
    carouselElement.addEventListener("pointercancel", handlePointerUp);

    return () => {
      carouselElement.removeEventListener("pointerdown", handlePointerDown);
      carouselElement.removeEventListener("pointermove", handlePointerMove);
      carouselElement.removeEventListener("pointerup", handlePointerUp);
      carouselElement.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [carouselApi, handleUserScroll]);

  // Управление автослайдом при изменении состояния
  useEffect(() => {
    if (carouselApi && !isHovered && !isPaused) {
      startAutoplay();
    } else {
      clearTimers();
    }
    return () => {
      clearTimers();
    };
  }, [carouselApi, isHovered, isPaused, startAutoplay, clearTimers]);

  // Обработчики наведения мыши
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    clearTimers();
  }, [clearTimers]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    // Запускаем автослайд снова, если не на паузе
    if (!isPaused) {
      startAutoplay();
    }
  }, [isPaused, startAutoplay]);

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
          <div 
            ref={carouselRef}
            className="relative px-8 lg:px-16"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Carousel
              setApi={setCarouselApi}
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
              <CarouselPrevious 
                className="hidden lg:flex"
                onClick={handleUserScroll}
              />
              <CarouselNext 
                className="hidden lg:flex"
                onClick={handleUserScroll}
              />
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
}

