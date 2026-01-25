import { useState, useEffect, useCallback } from 'react';
import { supabase, Achievement, UserAchievement, Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAchievements(user: User | null, profile: Profile | null) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUnlock, setNewUnlock] = useState<Achievement | null>(null);

    // Load achievements
    useEffect(() => {
        loadAchievements();
    }, []);

    // Load user achievements when user changes
    useEffect(() => {
        if (user) {
            loadUserAchievements(user.id);
        } else {
            setUserAchievements([]);
        }
    }, [user]);

    // Check for new achievements when profile changes
    useEffect(() => {
        if (user && profile && achievements.length > 0) {
            checkAndUnlockAchievements(profile);
        }
    }, [profile?.total_xp, profile?.current_level, profile?.streak_count, profile?.gold]);

    const loadAchievements = async () => {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .order('requirement_value', { ascending: true });

        if (!error && data) {
            setAchievements(data);
        }
        setLoading(false);
    };

    const loadUserAchievements = async (userId: string) => {
        const { data, error } = await supabase
            .from('user_achievements')
            .select('*, achievement:achievements(*)')
            .eq('user_id', userId);

        if (!error && data) {
            setUserAchievements(data);
        }
    };

    const checkAndUnlockAchievements = useCallback(async (profile: Profile) => {
        if (!user) return;

        const unlockedCodes = new Set(userAchievements.map(ua => ua.achievement?.code));

        for (const achievement of achievements) {
            if (unlockedCodes.has(achievement.code)) continue;

            let shouldUnlock = false;

            switch (achievement.requirement_type) {
                case 'total_xp':
                    shouldUnlock = profile.total_xp >= achievement.requirement_value;
                    break;
                case 'level':
                    shouldUnlock = profile.current_level >= achievement.requirement_value;
                    break;
                case 'streak':
                    shouldUnlock = profile.streak_count >= achievement.requirement_value;
                    break;
                case 'gold':
                    shouldUnlock = profile.gold >= achievement.requirement_value;
                    break;
                case 'strava_connected':
                    shouldUnlock = !!profile.strava_refresh_token;
                    break;
                case 'study_sessions':
                    shouldUnlock = profile.today_study_xp > 0;
                    break;
            }

            if (shouldUnlock) {
                await unlockAchievement(achievement);
            }
        }
    }, [user, achievements, userAchievements]);

    const unlockAchievement = async (achievement: Achievement) => {
        if (!user) return;

        const { error } = await supabase
            .from('user_achievements')
            .insert({
                user_id: user.id,
                achievement_id: achievement.id
            });

        if (!error) {
            // Add gold reward if any
            if (achievement.gold_reward > 0) {
                await supabase.rpc('add_gold', { amount: achievement.gold_reward });
            }

            setNewUnlock(achievement);
            setTimeout(() => setNewUnlock(null), 3000);

            // Reload user achievements
            loadUserAchievements(user.id);
        }
    };

    const isUnlocked = (achievementId: string): boolean => {
        return userAchievements.some(ua => ua.achievement_id === achievementId);
    };

    const getProgress = (achievement: Achievement, profile: Profile | null): number => {
        if (!profile) return 0;

        let current = 0;
        switch (achievement.requirement_type) {
            case 'total_xp':
                current = profile.total_xp;
                break;
            case 'level':
                current = profile.current_level;
                break;
            case 'streak':
                current = profile.streak_count;
                break;
            case 'gold':
                current = profile.gold;
                break;
            case 'strava_connected':
                current = profile.strava_refresh_token ? 1 : 0;
                break;
            case 'study_sessions':
                current = profile.today_study_xp > 0 ? 1 : 0;
                break;
        }

        return Math.min(100, (current / achievement.requirement_value) * 100);
    };

    return {
        achievements,
        userAchievements,
        loading,
        newUnlock,
        isUnlocked,
        getProgress,
        unlockedCount: userAchievements.length,
        totalCount: achievements.length,
    };
}
