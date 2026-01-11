/**
 * Скрывает часть email для приватности
 * Пример: abc123@example.com -> abc***@example.com
 */
export function maskEmail(email: string): string {
  if (!email) return '';
  
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  // Показываем первые 3 символа (или меньше, если email короткий)
  const visibleChars = Math.min(3, local.length);
  const masked = local.substring(0, visibleChars) + '***';
  
  return `${masked}@${domain}`;
}

/**
 * Маскирует все email адреса в тексте
 * Пример: "Пользователь user@example.com зарегистрировался" -> "Пользователь use***@example.com зарегистрировался"
 */
export function maskEmailInText(text: string): string {
  if (!text) return '';
  
  // Регулярное выражение для поиска email адресов
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
  
  return text.replace(emailRegex, (match) => maskEmail(match));
}
