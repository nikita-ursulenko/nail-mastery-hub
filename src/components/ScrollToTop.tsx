import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    // Скроллим вверх только если pathname изменился (навигация),
    // а не при первом рендере (обновление страницы)
    if (prevPathnameRef.current !== pathname) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  return null;
}

