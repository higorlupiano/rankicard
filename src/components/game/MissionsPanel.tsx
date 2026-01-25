import React, { useState, useEffect, useMemo } from 'react';
import { Target, RefreshCw, Flame } from 'lucide-react';
import { MissionCard } from './MissionCard';
import {
    Mission,
    UserMission,
    selectMissionsForUser,
    Rank,
    RANKS,
    calculateDynamicReward,
    isWeekend
} from '../../utils/missionLogic';
import { supabase } from '../../lib/supabase';

interface MissionsPanelProps {
    userRank: string;
    userLevel: number;
    userId: string;
    onMissionComplete: (xp: number, gold: number, missionName?: string) => void;
    onLog: (msg: string) => void;
}

export const MissionsPanel: React.FC<MissionsPanelProps> = ({
    userRank,
    userLevel,
    userId,
    onMissionComplete,
    onLog,
}) => {
    const [missions, setMissions] = useState<(Mission & { userStatus: 'pending' | 'completed' | 'expired' })[]>([]);
    const [loading, setLoading] = useState(true);
    const [completingId, setCompletingId] = useState<string | null>(null);

    // Load missions on mount
    useEffect(() => {
        loadMissions();
    }, [userId, userRank]);

    const loadMissions = async () => {
        setLoading(true);
        try {
            // Get today's date for filtering
            const today = new Date().toISOString().split('T')[0];

            // First, get user's existing missions for today
            const { data: userMissions, error: umError } = await supabase
                .from('user_missions')
                .select('*, mission:missions(*)')
                .eq('user_id', userId)
                .gte('assigned_at', today);

            if (umError) throw umError;

            if (userMissions && userMissions.length > 0) {
                // User already has missions for today
                const mappedMissions = userMissions.map(um => ({
                    ...um.mission,
                    userStatus: um.status as 'pending' | 'completed' | 'expired',
                    userMissionId: um.id,
                }));
                setMissions(mappedMissions);
            } else {
                // Generate new missions for today
                await generateDailyMissions();
            }
        } catch (error) {
            console.error('Error loading missions:', error);
            onLog('❌ Erro ao carregar missões');
        } finally {
            setLoading(false);
        }
    };

    const generateDailyMissions = async () => {
        try {
            // Get all active missions
            const { data: allMissions, error } = await supabase
                .from('missions')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;

            // Select missions for user based on their rank
            const validRank = RANKS.includes(userRank as Rank) ? userRank as Rank : 'F';
            const selectedMissions = selectMissionsForUser(allMissions || [], validRank, 5);

            // Calculate expiration (end of today)
            const expiresAt = new Date();
            expiresAt.setHours(23, 59, 59, 999);

            // Insert user_missions records
            const userMissionRecords = selectedMissions.map(m => ({
                user_id: userId,
                mission_id: m.id,
                status: 'pending',
                expires_at: expiresAt.toISOString(),
            }));

            const { error: insertError } = await supabase
                .from('user_missions')
                .insert(userMissionRecords);

            if (insertError) throw insertError;

            // Set missions with pending status
            setMissions(selectedMissions.map(m => ({ ...m, userStatus: 'pending' as const })));
            onLog('🎯 Novas missões disponíveis!');
        } catch (error) {
            console.error('Error generating missions:', error);
            onLog('❌ Erro ao gerar missões');
        }
    };

    // Calculate dynamic rewards for each mission
    const missionsWithRewards = useMemo(() => {
        const validUserRank = RANKS.includes(userRank as Rank) ? userRank as Rank : 'F';
        return missions.map(mission => {
            const reward = calculateDynamicReward(
                userLevel,
                mission.rank as Rank,
                validUserRank
            );
            return { ...mission, dynamicXP: reward.xp, bonuses: reward.bonuses };
        });
    }, [missions, userLevel, userRank]);

    const handleComplete = async (mission: Mission & { userStatus: string; dynamicXP: number }) => {
        setCompletingId(mission.id);
        try {
            // Get the user_mission record
            const { data: userMission, error: findError } = await supabase
                .from('user_missions')
                .select('id')
                .eq('user_id', userId)
                .eq('mission_id', mission.id)
                .eq('status', 'pending')
                .single();

            if (findError) throw findError;

            // Update to completed
            const { error: updateError } = await supabase
                .from('user_missions')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', userMission.id);

            if (updateError) throw updateError;

            // Update local state
            setMissions(prev =>
                prev.map(m =>
                    m.id === mission.id ? { ...m, userStatus: 'completed' as const } : m
                )
            );

            // Grant dynamic rewards
            onMissionComplete(mission.dynamicXP, mission.gold_reward, mission.title);
            onLog(`🎉 +${mission.dynamicXP} XP e +${mission.gold_reward} Ouro!`);
        } catch (error) {
            console.error('Error completing mission:', error);
            onLog('❌ Erro ao completar missão');
        } finally {
            setCompletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <RefreshCw className="animate-spin text-[#5c4033]" size={24} />
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-b from-[#e6d5ac] to-[#d4c196] rounded-lg p-4 border-2 border-[#8b6c42] shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#8b6c42]/30">
                <div className="flex items-center gap-2">
                    <Target size={20} className="text-[#8a1c1c]" />
                    <h3 className="font-rpg font-bold text-[#3e2723] text-lg">Missões Diárias</h3>
                    {isWeekend() && (
                        <span className="flex items-center gap-1 bg-orange-500 text-white px-2 py-0.5 rounded-full text-[9px] font-rpg font-bold">
                            <Flame size={10} /> +50% FDS
                        </span>
                    )}
                </div>
                <span className="text-xs font-rpg text-[#5c4033]/70">
                    {missions.filter(m => m.userStatus === 'completed').length}/{missions.length}
                </span>
            </div>

            {/* Missions Grid */}
            {missionsWithRewards.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                    {missionsWithRewards.map(mission => (
                        <MissionCard
                            key={mission.id}
                            mission={mission}
                            status={mission.userStatus}
                            onComplete={() => handleComplete(mission)}
                            isLoading={completingId === mission.id}
                            dynamicXP={mission.dynamicXP}
                            bonuses={mission.bonuses}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 text-[#5c4033]/70 font-rpg">
                    Nenhuma missão disponível
                </div>
            )}

            {/* Footer info */}
            <div className="mt-4 pt-2 border-t border-[#8b6c42]/20 text-center">
                <p className="text-[10px] text-[#5c4033]/60 font-rpg">
                    Missões renovam à meia-noite
                </p>
            </div>
        </div>
    );
};
