import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getRank } from '../../utils/gameLogic';
import { MissionsPanel } from '../game';
import { MissionCompleteAnimation } from '../ui/MissionCompleteAnimation';

interface CompletedMission {
    name: string;
    xp: number;
    gold: number;
}

export const MissionsView = () => {
    const { user, profile, addXP, updateProfile, refreshProfile, setLogMsg } = useGame();
    const [completedMission, setCompletedMission] = useState<CompletedMission | null>(null);

    if (!user) return null;

    const currentLevel = profile?.current_level || 1;
    const rank = getRank(currentLevel);

    const handleMissionComplete = async (xp: number, gold: number, missionName?: string) => {
        await addXP(xp);
        await updateProfile({ gold: (profile?.gold || 0) + gold });
        refreshProfile();

        // Show animation
        setCompletedMission({
            name: missionName || 'Missão',
            xp,
            gold
        });
    };

    return (
        <div className="w-full animate-fade-in h-[480px] overflow-y-auto custom-scrollbar landscape-content">
            {/* Mission Complete Animation */}
            {completedMission && (
                <MissionCompleteAnimation
                    missionName={completedMission.name}
                    xpReward={completedMission.xp}
                    goldReward={completedMission.gold}
                    onComplete={() => setCompletedMission(null)}
                />
            )}

            <MissionsPanel
                userRank={rank}
                userLevel={currentLevel}
                userId={user.id}
                onMissionComplete={handleMissionComplete}
                onLog={setLogMsg}
            />
        </div>
    );
};
