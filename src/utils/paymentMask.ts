/**
 * Скрывает часть номера карты/счета для приватности
 * Пример: 1234567890123456 -> ****3456
 */
export function maskPaymentDetails(details: string): string {
  if (!details) return '';
  
  // Если это похоже на номер карты (16 цифр) или длинный номер счета
  const digitsOnly = details.replace(/\D/g, '');
  
  if (digitsOnly.length >= 12) {
    // Показываем последние 4 цифры
    const lastFour = digitsOnly.slice(-4);
    return `****${lastFour}`;
  }
  
  // Для коротких номеров показываем последние 2-3 символа
  if (details.length > 4) {
    const lastThree = details.slice(-3);
    const maskedLength = details.length - 3;
    return '*'.repeat(Math.min(maskedLength, 8)) + lastThree;
  }
  
  return details;
}