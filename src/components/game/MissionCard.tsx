import React from 'react';
import { Coins, Sparkles, Check, Clock } from 'lucide-react';
import { Mission, RANK_COLORS, getMissionTypeIcon, Rank } from '../../utils/missionLogic';

interface MissionCardProps {
    mission: Mission;
    status: 'pending' | 'completed' | 'expired';
    onComplete: () => void;
    isLoading?: boolean;
}

export const MissionCard: React.FC<MissionCardProps> = ({
    mission,
    status,
    onComplete,
    isLoading = false,
}) => {
    const rankColor = RANK_COLORS[mission.rank as Rank] || RANK_COLORS.F;
    const typeIcon = getMissionTypeIcon(mission.mission_type);
    const isCompleted = status === 'completed';

    return (
        <div
            className={`relative bg-gradient-to-br from-[#f5e6c8] to-[#e6d5ac] rounded-lg p-3 border-2 shadow-md transition-all ${isCompleted
                    ? 'border-green-500/50 opacity-75'
                    : 'border-[#8b6c42] hover:border-[#c8a95c]'
                }`}
        >
            {/* Rank Badge */}
            <div
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-rpg font-bold text-sm shadow-lg border-2 border-white"
                style={{ backgroundColor: rankColor }}
            >
                {mission.rank}
            </div>

            {/* Mission Type Icon */}
            <div className="text-2xl mb-1">{typeIcon}</div>

            {/* Title */}
            <h4 className="font-rpg font-bold text-[#3e2723] text-sm leading-tight mb-1 pr-6">
                {mission.title}
            </h4>

            {/* Description */}
            {mission.description && (
                <p className="text-[10px] text-[#5c4033]/70 mb-2 leading-tight">
                    {mission.description}
                </p>
            )}

            {/* Rewards */}
            <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1 text-xs">
                    <Sparkles size={12} className="text-purple-600" />
                    <span className="font-rpg text-[#5c4033]">{mission.xp_reward} XP</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                    <Coins size={12} className="text-yellow-600" />
                    <span className="font-rpg text-[#5c4033]">{mission.gold_reward}</span>
                </div>
            </div>

            {/* Action Button */}
            {isCompleted ? (
                <div className="flex items-center justify-center gap-1 bg-green-600/20 text-green-700 py-1.5 rounded font-rpg text-xs">
                    <Check size={14} />
                    Concluída
                </div>
            ) : (
                <button
                    onClick={onComplete}
                    disabled={isLoading}
                    className="w-full bg-[#8a1c1c] hover:bg-[#a52a2a] disabled:bg-gray-400 text-white py-1.5 rounded font-rpg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                    {isLoading ? (
                        <>
                            <Clock size={12} className="animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        'Completar'
                    )}
                </button>
            )}
        </div>
    );
};
