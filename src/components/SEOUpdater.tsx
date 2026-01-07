import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Компонент для обновления SEO мета-тегов при навигации в SPA
 * Работает в development и production
 */
export function SEOUpdater() {
  const location = useLocation();

  useEffect(() => {
    // Небольшая задержка, чтобы не блокировать первый рендер
    const timeoutId = setTimeout(() => {
      const updateSEO = async () => {
        try {
          // Получаем SEO данные для текущего пути
          const path = location.pathname;
          const response = await fetch(`/api/public/seo${path}`, {
            signal: AbortSignal.timeout(2000), // Таймаут 2 секунды
          });
          
          if (!response.ok) {
            return;
          }

          const seo = await response.json();

          // Обновляем title
          if (seo.title) {
            document.title = seo.title;
          }

          // Функция для обновления или создания meta тега
          const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
            if (!content) return;
            
            let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
            if (!element) {
              element = document.createElement('meta');
              element.setAttribute(attribute, name);
              document.head.appendChild(element);
            }
            element.setAttribute('content', content);
          };

          // Обновляем meta теги
          updateMetaTag('description', seo.description || '');
          updateMetaTag('keywords', seo.keywords || '');
          updateMetaTag('robots', seo.robots || 'index, follow');

          // Open Graph
          updateMetaTag('og:title', seo.og_title || seo.title || '', 'property');
          updateMetaTag('og:description', seo.og_description || seo.description || '', 'property');
          updateMetaTag('og:image', seo.og_image || '', 'property');
          updateMetaTag('og:type', seo.og_type || 'website', 'property');
          updateMetaTag('og:url', seo.og_url || window.location.href, 'property');

          // Twitter Card
          updateMetaTag('twitter:card', seo.twitter_card || 'summary_large_image');
          updateMetaTag('twitter:title', seo.twitter_title || seo.og_title || seo.title || '');
          updateMetaTag('twitter:description', seo.twitter_description || seo.og_description || seo.description || '');
          updateMetaTag('twitter:image', seo.twitter_image || seo.og_image || '');

          // Canonical URL
          let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
          if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
          }
          canonical.setAttribute('href', seo.canonical_url || window.location.href);

        } catch (error) {
          // Игнорируем ошибки - не критично для работы сайта
        }
      };

      updateSEO();
    }, 100); // Задержка 100мс, чтобы не блокировать первый рендер

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return null; // Компонент не рендерит ничего
}
