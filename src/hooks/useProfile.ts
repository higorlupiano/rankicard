import { useState, useEffect, useCallback } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useProfile(user: User | null) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // Load profile when user changes
    useEffect(() => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        loadProfile(user.id);
    }, [user]);

    const loadProfile = async (userId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error loading profile:', error);
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            const updates: Partial<Profile> = {};
            let profileData = { ...data };

            // Check for daily reset of study XP
            if (data.last_date !== today) {
                updates.today_study_xp = 0;
                updates.last_date = today;
                profileData.today_study_xp = 0;
                profileData.last_date = today;
            }

            // Check and update streak
            const streakLastDate = data.streak_last_date;
            if (streakLastDate !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (streakLastDate === yesterdayStr) {
                    // User logged in yesterday - increment streak
                    updates.streak_count = (data.streak_count || 0) + 1;
                    updates.streak_last_date = today;
                    profileData.streak_count = updates.streak_count;
                    profileData.streak_last_date = today;
                } else if (!streakLastDate) {
                    // First time - start streak at 1
                    updates.streak_count = 1;
                    updates.streak_last_date = today;
                    profileData.streak_count = 1;
                    profileData.streak_last_date = today;
                } else {
                    // Missed a day - reset streak to 1
                    updates.streak_count = 1;
                    updates.streak_last_date = today;
                    profileData.streak_count = 1;
                    profileData.streak_last_date = today;
                }
            }

            // Apply updates if any
            if (Object.keys(updates).length > 0) {
                await updateProfile(updates);
            }

            setProfile(profileData);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = useCallback(async (updates: Partial<Profile>) => {
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) {
            console.error('Error updating profile:', error);
            return;
        }

        setProfile((prev) => prev ? { ...prev, ...updates } : null);
    }, [user]);

    const addXP = useCallback(async (amount: number) => {
        if (!user) return;

        const { data, error } = await supabase.rpc('add_xp', { amount });

        if (error) {
            console.error('Error adding XP:', error);
            return;
        }

        if (data && profile) {
            setProfile({
                ...profile,
                total_xp: data.newTotalXP,
                current_level: data.newLevel
            });
            return data;
        }
    }, [user, profile]);

    const addStudyXP = useCallback(async (amount: number) => {
        if (!user) return false;

        const { data, error } = await supabase.rpc('add_study_xp', { amount });

        if (error) {
            console.error('Error adding study XP:', error);
            return false;
        }

        if (data === true) {
            // Refresh to sync local state with server state (daily cap, last date, etc)
            loadProfile(user.id);
            return true;
        }
        return false;
    }, [user]);

    return {
        profile,
        loading,
        updateProfile,
        addXP,
        addStudyXP,
        refreshProfile: () => user && loadProfile(user.id),
    };
}
