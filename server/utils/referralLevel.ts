/**
 * Уровни партнеров и их критерии
 */
export interface LevelCriteria {
  referralsCount: { min: number; max: number | null };
  totalEarnings: { min: number; max: number | null };
}

export const PARTNER_LEVELS: Record<string, LevelCriteria> = {
  novice: {
    referralsCount: { min: 0, max: 5 },
    totalEarnings: { min: 0, max: 100 },
  },
  active: {
    referralsCount: { min: 6, max: 20 },
    totalEarnings: { min: 101, max: 500 },
  },
  professional: {
    referralsCount: { min: 21, max: 50 },
    totalEarnings: { min: 501, max: 2000 },
  },
  expert: {
    referralsCount: { min: 51, max: null },
    totalEarnings: { min: 2001, max: null },
  },
};

export const LEVEL_LABELS: Record<string, string> = {
  novice: 'Новичок',
  active: 'Активный',
  professional: 'Профессионал',
  expert: 'Эксперт',
};

/**
 * Определяет уровень партнера на основе количества рефералов и общего заработка
 * @param referralsCount - Количество зарегистрированных рефералов
 * @param totalEarnings - Общий заработок в EUR
 * @returns Уровень партнера: 'novice' | 'active' | 'professional' | 'expert'
 */
export function calculatePartnerLevel(
  referralsCount: number,
  totalEarnings: number
): string {
  // Проверяем от высшего уровня к низшему
  const levels = ['expert', 'professional', 'active', 'novice'] as const;
  
  for (const level of levels) {
    const criteria = PARTNER_LEVELS[level];
    
    const referralsMatch =
      referralsCount >= criteria.referralsCount.min &&
      (criteria.referralsCount.max === null || referralsCount <= criteria.referralsCount.max);
    
    const earningsMatch =
      totalEarnings >= criteria.totalEarnings.min &&
      (criteria.totalEarnings.max === null || totalEarnings <= criteria.totalEarnings.max);
    
    if (referralsMatch && earningsMatch) {
      return level;
    }
  }
  
  // По умолчанию возвращаем 'novice'
  return 'novice';
}

/**
 * Получает метку уровня партнера на русском языке
 * @param level - Уровень партнера
 * @returns Метка уровня
 */
export function getLevelLabel(level: string): string {
  return LEVEL_LABELS[level] || 'Новичок';
}

/**
 * Вычисляет прогресс до следующего уровня
 * @param currentLevel - Текущий уровень
 * @param referralsCount - Текущее количество рефералов
 * @param totalEarnings - Текущий заработок
 * @returns Объект с информацией о прогрессе
 */
export function getNextLevelProgress(
  currentLevel: string,
  referralsCount: number,
  totalEarnings: number
): {
  nextLevel: string | null;
  progressReferrals: number;
  progressEarnings: number;
  needsReferrals: number | null;
  needsEarnings: number | null;
} {
  if (currentLevel === 'expert') {
    return {
      nextLevel: null,
      progressReferrals: 100,
      progressEarnings: 100,
      needsReferrals: null,
      needsEarnings: null,
    };
  }
  
  const levels = ['novice', 'active', 'professional', 'expert'] as const;
  const currentIndex = levels.indexOf(currentLevel as any);
  const nextLevel = levels[currentIndex + 1];
  
  if (!nextLevel) {
    return {
      nextLevel: null,
      progressReferrals: 100,
      progressEarnings: 100,
      needsReferrals: null,
      needsEarnings: null,
    };
  }
  
  const nextCriteria = PARTNER_LEVELS[nextLevel];
  const currentCriteria = PARTNER_LEVELS[currentLevel];
  
  // Прогресс по рефералам
  const referralsRange = nextCriteria.referralsCount.min - currentCriteria.referralsCount.min;
  const referralsProgress = referralsRange > 0
    ? Math.min(100, ((referralsCount - currentCriteria.referralsCount.min) / referralsRange) * 100)
    : 100;
  
  // Прогресс по заработку
  const earningsRange = nextCriteria.totalEarnings.min - currentCriteria.totalEarnings.min;
  const earningsProgress = earningsRange > 0
    ? Math.min(100, ((totalEarnings - currentCriteria.totalEarnings.min) / earningsRange) * 100)
    : 100;
  
  const needsReferrals = Math.max(0, nextCriteria.referralsCount.min - referralsCount);
  const needsEarnings = Math.max(0, nextCriteria.totalEarnings.min - totalEarnings);
  
  return {
    nextLevel,
    progressReferrals: Math.max(0, Math.min(100, referralsProgress)),
    progressEarnings: Math.max(0, Math.min(100, earningsProgress)),
    needsReferrals: needsReferrals > 0 ? needsReferrals : null,
    needsEarnings: needsEarnings > 0 ? needsEarnings : null,
  };
}
