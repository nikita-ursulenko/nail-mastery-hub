import { useEffect, useRef, useState, ReactNode } from "react";

interface FadeInOnScrollProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "fade";
}

export function FadeInOnScroll({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: FadeInOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
            // Отключаем наблюдение после появления
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [delay]);

  const getTransformClass = () => {
    if (!isVisible) {
      switch (direction) {
        case "up":
          return "translate-y-20 opacity-0";
        case "down":
          return "-translate-y-20 opacity-0";
        case "left":
          return "translate-x-32 opacity-0 rotate-6 scale-95";
        case "right":
          return "-translate-x-32 opacity-0 -rotate-6 scale-95";
        case "fade":
          return "opacity-0";
        default:
          return "translate-y-20 opacity-0";
      }
    }
    return "translate-y-0 translate-x-0 opacity-100 rotate-0 scale-100";
  };

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${getTransformClass()} ${className}`}
      style={{
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      {children}
    </div>
  );
}
