import { useCallback } from 'react';
import ReactGA from 'react-ga4';
import ReactPixel from 'react-facebook-pixel';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID || '';

export const useAnalytics = () => {
  const isDev = import.meta.env.DEV;
  const hasGA = GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== '' && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';
  const hasFB = FB_PIXEL_ID && FB_PIXEL_ID !== '' && FB_PIXEL_ID !== 'YOUR_PIXEL_ID';

  // Трекинг покупки
  const trackPurchase = useCallback((data: {
    transactionId: string;
    value: number;
    currency: string;
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
    }>;
  }) => {
    if (!hasGA && !hasFB) {
      if (isDev) {
        console.log('📊 [Analytics] trackPurchase вызван, но ID не настроены:', data);
      }
      return;
    }

    if (isDev) {
      console.log('📊 [Analytics] trackPurchase:', data);
    }

    // Google Analytics Purchase
    if (hasGA) {
      ReactGA.event('purchase', {
        transaction_id: data.transactionId,
        value: data.value,
        currency: data.currency,
        items: data.items,
      });
      if (isDev) console.log('  → Отправлено в Google Analytics');
    }

    // Facebook Pixel Purchase
    if (hasFB) {
      ReactPixel.track('Purchase', {
        value: data.value,
        currency: data.currency,
        content_name: data.items.map(i => i.item_name).join(', '),
        content_ids: data.items.map(i => i.item_id),
        num_items: data.items.length,
      });
      if (isDev) console.log('  → Отправлено в Facebook Pixel');
    }
  }, [hasGA, hasFB, isDev]);

  // Трекинг регистрации
  const trackSignUp = useCallback((method: string = 'email') => {
    if (!hasGA && !hasFB) {
      if (isDev) {
        console.log('📊 [Analytics] trackSignUp вызван, но ID не настроены:', { method });
      }
      return;
    }

    if (isDev) {
      console.log('📊 [Analytics] trackSignUp:', { method });
    }

    if (hasGA) {
      ReactGA.event('sign_up', {
        method: method,
      });
      if (isDev) console.log('  → Отправлено в Google Analytics');
    }

    if (hasFB) {
      ReactPixel.track('CompleteRegistration', {
        method: method,
      });
      if (isDev) console.log('  → Отправлено в Facebook Pixel');
    }
  }, [hasGA, hasFB, isDev]);

  // Трекинг просмотра курса
  const trackViewCourse = useCallback((courseId: string, courseName: string, price?: number) => {
    if (!hasGA && !hasFB) {
      if (isDev) {
        console.log('📊 [Analytics] trackViewCourse вызван, но ID не настроены:', { courseId, courseName, price });
      }
      return;
    }

    if (isDev) {
      console.log('📊 [Analytics] trackViewCourse:', { courseId, courseName, price });
    }

    if (hasGA) {
      ReactGA.event('view_item', {
        items: [{
          item_id: courseId,
          item_name: courseName,
          price: price || 0,
          quantity: 1,
        }],
        value: price,
        currency: 'EUR',
      });
      if (isDev) console.log('  → Отправлено в Google Analytics');
    }

    if (hasFB) {
      ReactPixel.track('ViewContent', {
        content_name: courseName,
        content_ids: [courseId],
        value: price,
        currency: 'EUR',
      });
      if (isDev) console.log('  → Отправлено в Facebook Pixel');
    }
  }, [hasGA, hasFB, isDev]);

  // Трекинг начала покупки
  const trackInitiateCheckout = useCallback((courseId: string, courseName: string, price: number) => {
    if (!hasGA && !hasFB) {
      if (isDev) {
        console.log('📊 [Analytics] trackInitiateCheckout вызван, но ID не настроены:', { courseId, courseName, price });
      }
      return;
    }

    if (isDev) {
      console.log('📊 [Analytics] trackInitiateCheckout:', { courseId, courseName, price });
    }

    if (hasGA) {
      ReactGA.event('begin_checkout', {
        items: [{
          item_id: courseId,
          item_name: courseName,
          price: price,
          quantity: 1,
        }],
        value: price,
        currency: 'EUR',
      });
      if (isDev) console.log('  → Отправлено в Google Analytics');
    }

    if (hasFB) {
      ReactPixel.track('InitiateCheckout', {
        content_name: courseName,
        content_ids: [courseId],
        value: price,
        currency: 'EUR',
      });
      if (isDev) console.log('  → Отправлено в Facebook Pixel');
    }
  }, [hasGA, hasFB, isDev]);

  // Трекинг добавления в корзину (если будет)
  const trackAddToCart = useCallback((courseId: string, courseName: string, price: number) => {
    if (!hasGA && !hasFB) {
      if (isDev) {
        console.log('📊 [Analytics] trackAddToCart вызван, но ID не настроены:', { courseId, courseName, price });
      }
      return;
    }

    if (isDev) {
      console.log('📊 [Analytics] trackAddToCart:', { courseId, courseName, price });
    }

    if (hasGA) {
      ReactGA.event('add_to_cart', {
        items: [{
          item_id: courseId,
          item_name: courseName,
          price: price,
          quantity: 1,
        }],
        value: price,
        currency: 'EUR',
      });
      if (isDev) console.log('  → Отправлено в Google Analytics');
    }

    if (hasFB) {
      ReactPixel.track('AddToCart', {
        content_name: courseName,
        content_ids: [courseId],
        value: price,
        currency: 'EUR',
      });
      if (isDev) console.log('  → Отправлено в Facebook Pixel');
    }
  }, [hasGA, hasFB, isDev]);

  // Трекинг поиска
  const trackSearch = useCallback((searchTerm: string) => {
    if (!hasGA && !hasFB) {
      if (isDev) {
        console.log('📊 [Analytics] trackSearch вызван, но ID не настроены:', { searchTerm });
      }
      return;
    }

    if (isDev) {
      console.log('📊 [Analytics] trackSearch:', { searchTerm });
    }

    if (hasGA) {
      ReactGA.event('search', {
        search_term: searchTerm,
      });
      if (isDev) console.log('  → Отправлено в Google Analytics');
    }

    if (hasFB) {
      ReactPixel.track('Search', {
        search_string: searchTerm,
      });
      if (isDev) console.log('  → Отправлено в Facebook Pixel');
    }
  }, [hasGA, hasFB, isDev]);

  return {
    trackPurchase,
    trackSignUp,
    trackViewCourse,
    trackInitiateCheckout,
    trackAddToCart,
    trackSearch,
  };
};
