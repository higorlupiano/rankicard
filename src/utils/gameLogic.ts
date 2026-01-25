// --- GAME CONSTANTS ---
export const XP_PER_METER_RUN = 0.27;   // Caminhada/Corrida
export const XP_PER_METER_BIKE = 0.09;  // Bike (1/3 do esforço)
export const STUDY_DAILY_CAP = 1500;
export const XP_PER_MINUTE_STUDY = 7;
export const SESSION_SHORT_MIN = 25;
export const SESSION_LONG_MIN = 50;

// --- LEVEL & RANK FUNCTIONS ---
export const getXpForNextLevel = (level: number): number => 50 * (level * level);

export const getXpProgress = (totalXP: number, currentLevel: number) => {
    const xpForNext = getXpForNextLevel(currentLevel);
    const xpForCurrent = getXpForNextLevel(currentLevel - 1);
    const xpInLevel = totalXP - xpForCurrent;
    const xpRequired = xpForNext - xpForCurrent;
    const percent = Math.min(100, Math.max(0, (xpInLevel / xpRequired) * 100));

    return { xpInLevel, xpRequired, percent, xpForNext };
};

export const getRank = (level: number): string => {
    if (level >= 65) return 'S';
    if (level >= 50) return 'A';
    if (level >= 40) return 'B';
    if (level >= 30) return 'C';
    if (level >= 20) return 'D';
    if (level >= 10) return 'E';
    return 'F';
};

export const getTitle = (level: number): string => {
    if (level >= 65) return 'Lendário';
    if (level >= 50) return 'Mestre';
    if (level >= 40) return 'Elite';
    if (level >= 30) return 'Veterano';
    if (level >= 20) return 'Confirmado';
    if (level >= 10) return 'Aprendiz';
    return 'Novato';
};

export const RANK_COLORS: Record<string, string> = {
    'F': '#333333',
    'E': '#cd7f32',
    'D': '#7f8c8d',
    'C': '#f1c40f',
    'B': '#2980b9',
    'A': '#8b0000',
    'S': '#8b0000',
};

// --- TIMER FORMAT ---
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// --- STREAK SYSTEM ---
export const getStreakBonus = (streakDays: number): number => {
    // Returns XP multiplier bonus (e.g., 0.05 = 5% bonus)
    if (streakDays >= 30) return 0.25; // 25% bonus
    if (streakDays >= 14) return 0.20; // 20% bonus
    if (streakDays >= 7) return 0.15;  // 15% bonus
    if (streakDays >= 3) return 0.10;  // 10% bonus
    if (streakDays >= 1) return 0.05;  // 5% bonus
    return 0;
};

export const getStreakLabel = (streakDays: number): string => {
    if (streakDays >= 30) return '🔥 Lendário';
    if (streakDays >= 14) return '🔥 Épico';
    if (streakDays >= 7) return '🔥 Semana';
    if (streakDays >= 3) return '🔥 Trio';
    return '🔥';
};
