import { Pool } from 'pg';
import { getDatabaseConfig } from '../../database/config';

const pool = new Pool(getDatabaseConfig());

interface CreateNotificationParams {
  partnerId: number;
  type: 'registration' | 'purchase' | 'withdrawal_status' | 'system';
  title: string;
  message: string;
  relatedUserId?: number;
  relatedEnrollmentId?: number;
  relatedWithdrawalId?: number;
}

/**
 * Создает уведомление для партнера
 */
export async function createReferralNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO referral_notifications 
       (partner_id, notification_type, title, message, related_user_id, related_enrollment_id, related_withdrawal_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.partnerId,
        params.type,
        params.title,
        params.message,
        params.relatedUserId || null,
        params.relatedEnrollmentId || null,
        params.relatedWithdrawalId || null,
      ]
    );
  } catch (error) {
    console.error('Error creating referral notification:', error);
    // Не прерываем выполнение основной логики при ошибке создания уведомления
  }
}

/**
 * Скрывает часть email для приватности
 */
function maskEmail(email: string): string {
  if (!email) return '';
  
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  // Показываем первые 3 символа
  const visibleChars = Math.min(3, local.length);
  const masked = local.substring(0, visibleChars) + '***';
  
  return `${masked}@${domain}`;
}

/**
 * Создает уведомление о новой регистрации
 */
export async function notifyRegistration(partnerId: number, userId: number, userEmail: string): Promise<void> {
  const maskedEmail = maskEmail(userEmail);
  await createReferralNotification({
    partnerId,
    type: 'registration',
    title: 'Новая регистрация по вашей ссылке',
    message: `По вашей реферальной ссылке зарегистрировался новый пользователь: ${maskedEmail}`,
    relatedUserId: userId,
  });
}

/**
 * Создает уведомление о новой покупке
 */
export async function notifyPurchase(
  partnerId: number,
  userId: number,
  enrollmentId: number,
  amount: number,
  courseTitle?: string
): Promise<void> {
  const courseInfo = courseTitle ? ` по курсу "${courseTitle}"` : '';
  await createReferralNotification({
    partnerId,
    type: 'purchase',
    title: 'Новая покупка по вашей ссылке',
    message: `По вашей реферальной ссылке совершена покупка${courseInfo} на сумму ${amount.toFixed(2)}€`,
    relatedUserId: userId,
    relatedEnrollmentId: enrollmentId,
  });
}

/**
 * Создает уведомление об изменении статуса выплаты
 */
export async function notifyWithdrawalStatusChange(
  partnerId: number,
  withdrawalId: number,
  status: string,
  amount: number
): Promise<void> {
  const statusLabels: Record<string, string> = {
    approved: 'одобрен',
    paid: 'выплачен',
    rejected: 'отклонен',
  };

  const statusLabel = statusLabels[status] || status;
  await createReferralNotification({
    partnerId,
    type: 'withdrawal_status',
    title: `Запрос на вывод ${statusLabel}`,
    message: `Ваш запрос на вывод средств в размере ${amount.toFixed(2)}€ был ${statusLabel}`,
    relatedWithdrawalId: withdrawalId,
  });
}
