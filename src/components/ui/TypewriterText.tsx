import { useState, useEffect, useRef } from "react";

interface TypewriterTextProps {
    text: string;
    speed?: number;
    delay?: number;
    className?: string;
    as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
    onComplete?: () => void;
    showCursor?: boolean;
}

export function TypewriterText({
    text,
    speed = 50,
    delay = 0,
    className = "",
    as: Component = "div",
    onComplete,
    showCursor = true,
}: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [startTyping, setStartTyping] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        setStartTyping(true);
                    }, delay);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [delay]);

    useEffect(() => {
        if (!startTyping) return;

        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text[currentIndex]);
                setCurrentIndex((prev) => prev + 1);
            }, speed);

            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, text, speed, startTyping, onComplete]);

    return (
        <Component ref={containerRef as any} className={`${className} inline-block`}>
            {displayedText}
            {showCursor && currentIndex < text.length && (
                <span className="inline-block w-[3px] h-[1em] bg-black dark:bg-white ml-1 animate-pulse align-middle" />
            )}
        </Component>
    );
}
