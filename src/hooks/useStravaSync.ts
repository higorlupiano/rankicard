import { useState, useCallback } from 'react';
import { Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface UseStravaSyncProps {
    user: User | null;
    profile: Profile | null;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    addXP: (amount: number) => Promise<any>;
    refreshProfile: () => void;
}

export function useStravaSync({ user, profile, updateProfile, addXP, refreshProfile }: UseStravaSyncProps) {
    const [syncMsg, setSyncMsg] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(() => {
        const savedEnd = localStorage.getItem('stravaSyncCooldownEnd');
        if (savedEnd) {
            const remaining = Math.max(0, Math.ceil((parseInt(savedEnd, 10) - Date.now()) / 1000));
            return remaining;
        }
        return 0;
    });

    const COOLDOWN_SECONDS = 15 * 60; // 15 minutes

    const processCallback = useCallback(async (code: string): Promise<boolean> => {
        try {
            const res = await fetch(`${SUPABASE_URL}/functions/v1/strava-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            if (!res.ok) return false;

            const data = await res.json();
            if (data.refresh_token) {
                await updateProfile({
                    strava_refresh_token: data.refresh_token,
                    strava_access_token: data.access_token,
                    strava_expires_at: data.expires_at,
                });
                refreshProfile();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Strava callback error:', error);
            return false;
        }
    }, [updateProfile, refreshProfile]);

    const connect = useCallback(() => {
        const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
        const redirectUri = window.location.origin;
        const scope = 'activity:read_all';

        if (!clientId) {
            setSyncMsg('⚠️ Configure VITE_STRAVA_CLIENT_ID');
            return;
        }

        window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;
    }, []);

    const sync = useCallback(async (): Promise<{ xpGained: number; activitiesCount: number } | null> => {
        if (!profile || !user || isSyncing) return null;

        setIsSyncing(true);
        setSyncMsg('⏳ Buscando atividades...');

        try {
            let accessToken = profile.strava_access_token;
            const expiresAt = profile.strava_expires_at || 0;
            const now = Math.floor(Date.now() / 1000);

            // Refresh token if expired
            if (now >= expiresAt && profile.strava_refresh_token) {
                const tokenRes = await fetch(`${SUPABASE_URL}/functions/v1/strava-auth`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: profile.strava_refresh_token }),
                });

                if (!tokenRes.ok) {
                    setSyncMsg('❌ Erro ao renovar token');
                    return null;
                }

                const tokenData = await tokenRes.json();
                if (tokenData.access_token) {
                    accessToken = tokenData.access_token;
                    await updateProfile({
                        strava_access_token: tokenData.access_token,
                        strava_refresh_token: tokenData.refresh_token,
                        strava_expires_at: tokenData.expires_at,
                    });
                }
            }

            if (!accessToken) {
                setSyncMsg('❌ Token não disponível');
                return null;
            }

            const lastSync = profile.strava_last_sync || 0;
            const activitiesRes = await fetch(
                `https://www.strava.com/api/v3/athlete/activities?after=${lastSync}&per_page=10`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );

            // Set cooldown
            const cooldownEnd = Date.now() + COOLDOWN_SECONDS * 1000;
            localStorage.setItem('stravaSyncCooldownEnd', cooldownEnd.toString());
            setCooldownRemaining(COOLDOWN_SECONDS);

            if (!activitiesRes.ok) {
                setSyncMsg('❌ Erro ao buscar atividades');
                return null;
            }

            const activities = await activitiesRes.json();
            if (!Array.isArray(activities) || activities.length === 0) {
                setSyncMsg('✅ Nenhuma atividade nova');
                return { xpGained: 0, activitiesCount: 0 };
            }

            // Calculate XP
            const XP_PER_METER_RUN = 0.27;
            const XP_PER_METER_BIKE = 0.09;

            let totalXpGained = 0;
            let newActivitiesCount = 0;
            let latestDate = lastSync;

            activities.forEach((act: any) => {
                if (act.manual) {
                    const actDate = new Date(act.start_date).getTime() / 1000;
                    if (actDate > latestDate) latestDate = actDate;
                    return;
                }

                let xpForThis = 0;
                if (['Run', 'Walk', 'Hike'].includes(act.type)) {
                    xpForThis = Math.floor(act.distance * XP_PER_METER_RUN);
                } else if (['Ride', 'VirtualRide', 'EBikeRide'].includes(act.type)) {
                    xpForThis = Math.floor(act.distance * XP_PER_METER_BIKE);
                }

                if (xpForThis > 0) {
                    totalXpGained += xpForThis;
                    newActivitiesCount++;
                }

                const actDate = new Date(act.start_date).getTime() / 1000;
                if (actDate > latestDate) latestDate = actDate;
            });

            await updateProfile({ strava_last_sync: latestDate });

            if (totalXpGained > 0) {
                await addXP(totalXpGained);
                setSyncMsg(`🔥 +${totalXpGained} XP (${newActivitiesCount} atividades)`);
            } else {
                setSyncMsg('✅ Sem XP elegível');
            }

            refreshProfile();
            return { xpGained: totalXpGained, activitiesCount: newActivitiesCount };

        } catch (error) {
            console.error('Strava sync error:', error);
            setSyncMsg('❌ Erro na sincronização');
            return null;
        } finally {
            setIsSyncing(false);
        }
    }, [profile, user, isSyncing, updateProfile, addXP, refreshProfile]);

    const disconnect = useCallback(async () => {
        await updateProfile({
            strava_refresh_token: null,
            strava_access_token: null,
            strava_expires_at: null,
        });
        setSyncMsg('');
    }, [updateProfile]);

    // Decrease cooldown every second
    const decrementCooldown = useCallback(() => {
        setCooldownRemaining(prev => {
            if (prev <= 1) {
                localStorage.removeItem('stravaSyncCooldownEnd');
                return 0;
            }
            return prev - 1;
        });
    }, []);

    return {
        syncMsg,
        isSyncing,
        cooldownRemaining,
        connect,
        sync,
        disconnect,
        processCallback,
        decrementCooldown,
    };
}
