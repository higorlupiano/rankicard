// --- MISSION TYPES ---
export interface Mission {
    id: string;
    title: string;
    description: string | null;
    rank: string;
    xp_reward: number;
    gold_reward: number;
    mission_type: 'manual' | 'strava' | 'spotify' | 'study';
    requirement_value: number | null;
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
 * Calculate bonus multiplier based on mission rank vs user rank
 */
export function calculateBonusMultiplier(missionRank: Rank, userRank: Rank): number {
    const missionIndex = RANKS.indexOf(missionRank);
    const userIndex = RANKS.indexOf(userRank);

    if (missionIndex > userIndex) {
        // Harder mission = 25% bonus
        return 1.25;
    }
    return 1.0;
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
