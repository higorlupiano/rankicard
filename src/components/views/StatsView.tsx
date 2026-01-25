import React, { useState, useMemo } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getXpProgress, getRank, getTitle, STUDY_DAILY_CAP, getStreakBonus, getStreakLabel } from '../../utils/gameLogic';
import { StatBox, ProgressBar } from '../ui';
import { AvatarFrame } from '../player';
import { Flame, Coins } from 'lucide-react';
import { XPChart } from '../ui/XPChart';
import { useActivityLog } from '../../hooks/useActivityLog';

export const StatsView = () => {
    const { user, profile, logMsg } = useGame();
    const { activities } = useActivityLog(user);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Prepare XP chart data
    const chartData = useMemo(() => {
        if (!activities.length) return [];

        // Group XP by date (last 7 days)
        const xpByDate: Record<string, number> = {};
        const today = new Date();

        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            xpByDate[dateStr] = 0;
        }

        // Add XP from activities
        activities.forEach(act => {
            if (act.xp_change && act.xp_change > 0) {
                const date = new Date(act.created_at);
                const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                if (xpByDate.hasOwnProperty(dateStr)) {
                    xpByDate[dateStr] += act.xp_change;
                }
            }
        });

        return Object.entries(xpByDate).map(([date, xp]) => ({ date, xp }));
    }, [activities]);

    if (!user) return null;

    const totalXP = profile?.total_xp || 0;
    const currentLevel = profile?.current_level || 1;
    const todayStudyXP = profile?.today_study_xp || 0;
    const currentAvatarUrl = avatarUrl || profile?.avatar_url;
    const streakCount = profile?.streak_count || 0;
    const gold = profile?.gold || 0;

    const { xpInLevel, xpRequired } = getXpProgress(totalXP, currentLevel);
    const rank = getRank(currentLevel);
    const streakBonus = getStreakBonus(streakCount);
    const streakLabel = getStreakLabel(streakCount);

    return (
        <div className="animate-fade-in overflow-x-hidden landscape-content">
            {/* Player Name */}
            <div className="text-center mb-4">
                <h2 className="text-4xl md:text-5xl font-rpg font-black text-transparent bg-clip-text bg-gradient-to-b from-[#5c4033] to-[#2c1810] drop-shadow-sm mb-1">
                    {profile?.display_name?.split(' ')[0] || user.email?.split('@')[0] || 'Aventureiro'}
                </h2>
                <p className="font-rpg font-bold text-[#8a1c1c] tracking-widest text-sm opacity-80">
                    ID: {user.id.slice(0, 8).toUpperCase()}
                </p>
            </div>

            {/* Streak & Gold Bar */}
            <div className="flex items-center justify-center gap-4 mb-4">
                {/* Streak */}
                <div className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full 
                    ${streakCount >= 7
                        ? 'bg-gradient-to-r from-orange-600 to-red-500'
                        : streakCount >= 3
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                            : 'bg-gradient-to-r from-gray-600 to-gray-500'
                    }
                `}>
                    <Flame size={18} className="text-white" />
                    <span className="font-rpg font-bold text-white">{streakCount}</span>
                    {streakBonus > 0 && (
                        <span className="text-xs text-white/80">+{Math.round(streakBonus * 100)}% XP</span>
                    )}
                </div>

                {/* Gold */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-600 to-amber-500">
                    <Coins size={18} className="text-yellow-100" />
                    <span className="font-rpg font-bold text-white">{gold}</span>
                </div>
            </div>

            {/* Stats + Avatar Section */}
            <div className="flex items-center justify-between mb-3">
                {/* Stats Column */}
                <div className="flex flex-col gap-4 w-1/3 pt-2">
                    <StatBox label="NÍVEL ATUAL" value={currentLevel} delay={100} />
                    <StatBox label="TOTAL XP" value={Math.floor(totalXP)} delay={200} />
                    <StatBox label="FADIGA" value={`${todayStudyXP}/${STUDY_DAILY_CAP}`} delay={300} />
                </div>

                {/* Avatar Column */}
                <div className="w-2/3 pl-4 pt-2 relative">
                    <AvatarFrame
                        avatarUrl={currentAvatarUrl}
                        rank={rank}
                        userId={user.id}
                        onAvatarChange={setAvatarUrl}
                    />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="text-center mb-4">
                <p className="font-rpg text-[#5c4033] mb-2">Progresso do Nível</p>
                <ProgressBar current={xpInLevel} max={xpRequired} />
            </div>

            {/* XP Chart */}
            {chartData.length > 0 && (
                <div className="mb-4">
                    <XPChart data={chartData} height={100} />
                </div>
            )}

            {/* Log Message */}
            <div className="bg-black/80 text-green-400 p-2 rounded font-mono text-xs border border-gray-700 text-center mb-4">
                {logMsg}
            </div>
        </div>
    );
};
