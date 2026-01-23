// --- MISSION TYPES ---
export interface Mission {
    id: string;
    title: string;
    description: string | null;
    rank: string;
    gold_reward: number;
    mission_type: 'manual' | 'strava' | 'spotify' | 'study';
    is_active: boolean;
}

export interface UserMission {
    id: string;
    user_id: string;
    mission_id: string;
    status: 'pending' | 'completed' | 'expired';
    assigned_at: string;
    completed_at: string | null;
    expires_at: string | null;
    mission?: Mission;
}

// --- RANK CONSTANTS ---
export const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S'] as const;
export type Rank = typeof RANKS[number];

export const RANK_COLORS: Record<Rank, string> = {
    'F': '#4a4a4a',
    'E': '#cd7f32',
    'D': '#a8a8a8',
    'C': '#ffd700',
    'B': '#4169e1',
    'A': '#9932cc',
    'S': '#ff4500',
};

export const RANK_BG_COLORS: Record<Rank, string> = {
    'F': 'bg-gray-600',
    'E': 'bg-amber-700',
    'D': 'bg-gray-400',
    'C': 'bg-yellow-500',
    'B': 'bg-blue-600',
    'A': 'bg-purple-600',
    'S': 'bg-red-600',
};

// --- MISSION SELECTION LOGIC ---

/**
 * Get valid ranks for mission selection based on user rank
 * Returns ranks from (userRank - 2) to (userRank + 1)
 */
export function getValidRanksForUser(userRank: Rank): Rank[] {
    const userRankIndex = RANKS.indexOf(userRank);
    const minIndex = Math.max(0, userRankIndex - 2);
    const maxIndex = Math.min(RANKS.length - 1, userRankIndex + 1);

    return RANKS.slice(minIndex, maxIndex + 1) as Rank[];
}

/**
 * Select missions for a user, ensuring at least 2 are from their current rank
 */
export function selectMissionsForUser(
    allMissions: Mission[],
    userRank: Rank,
    count: number = 5
): Mission[] {
    const validRanks = getValidRanksForUser(userRank);

    // Filter missions by valid ranks
    const validMissions = allMissions.filter(m => validRanks.includes(m.rank as Rank));

    // Get missions from user's current rank
    const currentRankMissions = validMissions.filter(m => m.rank === userRank);

    // Get missions from other valid ranks
    const otherRankMissions = validMissions.filter(m => m.rank !== userRank);

    // Shuffle arrays
    const shuffledCurrent = shuffleArray([...currentRankMissions]);
    const shuffledOther = shuffleArray([...otherRankMissions]);

    // Ensure at least 2 from current rank (or all if less than 2 available)
    const fromCurrent = shuffledCurrent.slice(0, Math.min(2, shuffledCurrent.length));
    const remaining = count - fromCurrent.length;

    // Fill the rest from other ranks
    const fromOther = shuffledOther.slice(0, remaining);

    // Combine and shuffle final result
    return shuffleArray([...fromCurrent, ...fromOther]);
}

/**
 * Check if today is a weekend (Saturday or Sunday)
 */
export function isWeekend(): boolean {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get XP required to reach the next level (from gameLogic)
 */
export function getXpForNextLevel(level: number): number {
    return 50 * (level * level);
}

/**
 * Get XP required to go FROM current level TO next level
 */
export function getXpToNextLevel(currentLevel: number): number {
    return getXpForNextLevel(currentLevel) - getXpForNextLevel(currentLevel - 1);
}

/**
 * Get rank multiplier based on mission rank vs user rank
 * -2 ranks: 0.50x | -1 rank: 0.75x | same: 1.00x | +1 rank: 1.25x
 */
export function getRankMultiplier(missionRank: Rank, userRank: Rank): number {
    const missionIndex = RANKS.indexOf(missionRank);
    const userIndex = RANKS.indexOf(userRank);
    const diff = missionIndex - userIndex;

    if (diff <= -2) return 0.50;
    if (diff === -1) return 0.75;
    if (diff === 0) return 1.00;
    return 1.25; // +1 or higher
}

/**
 * Calculate dynamic XP reward for a mission
 * Base: 2% of XP needed for next level
 * Adjusted by: rank multiplier and weekend bonus
 */
export function calculateDynamicReward(
    userLevel: number,
    missionRank: Rank,
    userRank: Rank
): { xp: number; baseXP: number; multiplier: number; isWeekend: boolean; bonuses: string[] } {
    // Base XP = 2% of XP needed for next level
    const xpToNext = getXpToNextLevel(userLevel);
    const baseXP = Math.max(1, Math.floor(xpToNext * 0.02));

    // Get rank multiplier
    const rankMultiplier = getRankMultiplier(missionRank, userRank);

    // Check weekend bonus
    const weekend = isWeekend();
    const weekendMultiplier = weekend ? 1.50 : 1.00;

    // Calculate total multiplier
    const totalMultiplier = rankMultiplier * weekendMultiplier;

    // Build bonuses list for display
    const bonuses: string[] = [];
    if (rankMultiplier < 1) {
        bonuses.push(`${Math.round(rankMultiplier * 100)}% Rank`);
    } else if (rankMultiplier > 1) {
        bonuses.push(`+${Math.round((rankMultiplier - 1) * 100)}% Rank`);
    }
    if (weekend) {
        bonuses.push('+50% FDS');
    }

    // Final XP
    const xp = Math.max(1, Math.floor(baseXP * totalMultiplier));

    return {
        xp,
        baseXP,
        multiplier: totalMultiplier,
        isWeekend: weekend,
        bonuses
    };
}

/**
 * Get mission type icon emoji
 */
export function getMissionTypeIcon(type: string): string {
    switch (type) {
        case 'strava': return '🏃';
        case 'spotify': return '🎵';
        case 'study': return '📚';
        default: return '✅';
    }
}

// --- HELPER ---
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
