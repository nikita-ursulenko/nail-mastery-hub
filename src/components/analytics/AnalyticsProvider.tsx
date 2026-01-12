import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import ReactPixel from 'react-facebook-pixel';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID || '';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const location = useLocation();

  useEffect(() => {
    const isDev = import.meta.env.DEV;
    
    // Инициализация Google Analytics
    if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== '' && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      ReactGA.initialize(GA_MEASUREMENT_ID);
      if (isDev) {
        console.log('✅ Google Analytics инициализирован:', GA_MEASUREMENT_ID);
      }
    } else if (isDev) {
      console.log('ℹ️  Google Analytics не настроен (VITE_GA_MEASUREMENT_ID не указан)');
    }

    // Инициализация Facebook Pixel
    if (FB_PIXEL_ID && FB_PIXEL_ID !== '' && FB_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      ReactPixel.init(FB_PIXEL_ID);
      if (isDev) {
        console.log('✅ Facebook Pixel инициализирован:', FB_PIXEL_ID);
      }
    } else if (isDev) {
      console.log('ℹ️  Facebook Pixel не настроен (VITE_FB_PIXEL_ID не указан)');
    }
  }, []);

  // Отслеживание изменений страницы
  useEffect(() => {
    // Пропускаем админские и приватные страницы
    if (location.pathname.startsWith('/admin') || 
        location.pathname.startsWith('/dashboard') ||
        location.pathname.startsWith('/referral')) {
      return;
    }

    if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== '') {
      ReactGA.send({ 
        hitType: 'pageview', 
        page: location.pathname + location.search 
      });
    }
    
    if (FB_PIXEL_ID && FB_PIXEL_ID !== '') {
      ReactPixel.pageView();
    }
  }, [location]);

  return <>{children}</>;
}
