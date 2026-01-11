import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Компонент для отслеживания реферальных ссылок
 * Сохраняет код в localStorage и cookie, отправляет запрос на сервер
 */
export function ReferralTracker() {
  const location = useLocation();

  useEffect(() => {
    // Пропускаем отслеживание для админских страниц и страниц рефералов
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/referral')) {
      return;
    }

    // Получаем реферальный код из URL параметров
    const urlParams = new URLSearchParams(location.search);
    const referralCode = urlParams.get('ref');

    if (!referralCode) {
      return;
    }

    // Валидация формата кода (8 символов, буквы и цифры)
    const codeRegex = /^[A-Z0-9]{8}$/;
    if (!codeRegex.test(referralCode)) {
      return;
    }

    // Проверяем, не отправляли ли уже запрос для этого кода
    const lastTrackedCode = localStorage.getItem('referral_code_tracked');
    if (lastTrackedCode === referralCode) {
      return; // Уже отслеживали этот код
    }

    // Сохраняем код в localStorage
    localStorage.setItem('referral_code', referralCode);
    localStorage.setItem('referral_code_tracked', referralCode);

    // Сохраняем код в cookie (30 дней)
    const expires = new Date();
    expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 дней
    document.cookie = `referral_code=${referralCode}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

    // Отправляем запрос на сервер для отслеживания посещения
    const trackVisit = async () => {
      try {
        // Получаем IP и User-Agent (они будут получены на сервере из заголовков)
        const response = await fetch('/api/referral/tracking/track-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referral_code: referralCode,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Referral visit tracked:', data);
        }
      } catch (error) {
        // Не показываем ошибку пользователю, просто логируем
        console.error('Error tracking referral visit:', error);
      }
    };

    trackVisit();
  }, [location]);

  return null; // Компонент не рендерит ничего
}
