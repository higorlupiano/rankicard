import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the database
export interface Profile {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    total_xp: number;
    current_level: number;
    today_study_xp: number;
    last_date: string;
    // Streak system
    streak_count: number;
    streak_last_date: string | null;
    // Strava integration
    strava_refresh_token: string | null;
    strava_access_token: string | null;
    strava_expires_at: number | null;
    strava_last_sync: number;
    // Game economy
    gold: number;
    // Admin
    is_admin: boolean;
    created_at: string;
    updated_at: string;
}

// Achievement types
export interface Achievement {
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    requirement_type: string;
    requirement_value: number;
    gold_reward: number;
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_id: string;
    unlocked_at: string;
    achievement?: Achievement;
}

// Shop types
export interface ShopItem {
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    price: number;
    min_level: number;
    effect_type: string | null;
    effect_value: string | null;
    effect_duration: number | null;
    is_active: boolean;
}

export interface UserItem {
    id: string;
    user_id: string;
    item_id: string;
    quantity: number;
    equipped: boolean;
    expires_at: string | null;
    purchased_at: string;
    item?: ShopItem;
}
