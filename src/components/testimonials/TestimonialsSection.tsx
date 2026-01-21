import { supabase } from "@/lib/supabase";
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
import { FadeInOnScroll } from "@/components/FadeInOnScroll";



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



  // ... existing imports

  const loadTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('rating', { ascending: false });

      if (error) {
        throw error;
      }
      setTestimonials(data || []);
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
    let startX = 0;
    let startY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      // Игнорируем клики на кнопки навигации
      const target = e.target as HTMLElement;
      if (target.closest('button')) {
        return;
      }
      pointerDownTime = Date.now();
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (pointerDownTime === 0) return;
      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);
      // Считаем движением, если перемещение больше 5px
      if (deltaX > 5 || deltaY > 5) {
        hasMoved = true;
      }
    };

    const handlePointerUp = () => {
      // Если был свайп (движение), считаем это ручным взаимодействием
      if (hasMoved && pointerDownTime > 0) {
        handleUserScroll();
      }
      pointerDownTime = 0;
      hasMoved = false;
    };

    // Отслеживаем события pointer для определения свайпов только на контенте карусели
    const carouselContent = carouselElement.querySelector('[role="region"]');
    if (carouselContent) {
      carouselContent.addEventListener("pointerdown", handlePointerDown);
      carouselContent.addEventListener("pointermove", handlePointerMove);
      carouselContent.addEventListener("pointerup", handlePointerUp);
      carouselContent.addEventListener("pointercancel", handlePointerUp);

      return () => {
        carouselContent.removeEventListener("pointerdown", handlePointerDown);
        carouselContent.removeEventListener("pointermove", handlePointerMove);
        carouselContent.removeEventListener("pointerup", handlePointerUp);
        carouselContent.removeEventListener("pointercancel", handlePointerUp);
      };
    }
  }, [carouselApi, handleUserScroll]);

  // Отслеживание кликов на кнопки навигации через события карусели
  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    let isManualScroll = false;

    // Отслеживаем клики на кнопки навигации
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      // Проверяем, что это кнопка навигации карусели
      if (button && (button.getAttribute('aria-label')?.includes('slide') ||
        button.closest('[class*="CarouselPrevious"]') ||
        button.closest('[class*="CarouselNext"]'))) {
        isManualScroll = true;
      }
    };

    // Отслеживаем событие переключения слайда
    const handleSelect = () => {
      if (isManualScroll) {
        isManualScroll = false;
        handleUserScroll();
      }
    };

    if (carouselRef.current) {
      carouselRef.current.addEventListener("click", handleButtonClick, false);
    }
    carouselApi.on("select", handleSelect);

    return () => {
      if (carouselRef.current) {
        carouselRef.current.removeEventListener("click", handleButtonClick, false);
      }
      carouselApi.off("select", handleSelect);
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

  // Обработчики наведения мыши (только на контент карусели)
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
        <FadeInOnScroll duration={500}>
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
              {title}
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {description}
            </p>
          </div>
        </FadeInOnScroll>

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
          <FadeInOnScroll delay={50} duration={500} direction="up">
            <div
              ref={carouselRef}
              className="relative px-8 lg:px-16"
            >
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent
                  className="-ml-2 md:-ml-4"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
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
                />
                <CarouselNext
                  className="hidden lg:flex"
                />
              </Carousel>
            </div>
          </FadeInOnScroll>
        )}
      </div>
    </section>
  );
}

