import React from 'react';
import { Achievement } from '../../lib/supabase';

interface AchievementCardProps {
    achievement: Achievement;
    unlocked: boolean;
    progress: number; // 0-100
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
    achievement,
    unlocked,
    progress
}) => {
    return (
        <div className={`
            relative p-3 rounded-lg border-2 transition-all
            ${unlocked
                ? 'bg-gradient-to-br from-yellow-900/40 to-amber-900/30 border-yellow-600/50'
                : 'bg-black/30 border-gray-700/30 opacity-60'
            }
        `}>
            {/* Icon */}
            <div className={`
                text-3xl mb-2 
                ${unlocked ? '' : 'grayscale opacity-50'}
            `}>
                {achievement.icon}
            </div>

            {/* Name */}
            <h4 className={`
                font-rpg text-sm font-bold mb-1
                ${unlocked ? 'text-yellow-100' : 'text-gray-400'}
            `}>
                {achievement.name}
            </h4>

            {/* Description */}
            <p className={`
                text-xs mb-2
                ${unlocked ? 'text-yellow-200/70' : 'text-gray-500'}
            `}>
                {achievement.description}
            </p>

            {/* Progress bar (only show if not unlocked) */}
            {!unlocked && (
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2">
                    <div
                        className="bg-yellow-600/70 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {/* Gold reward badge */}
            {achievement.gold_reward > 0 && (
                <div className={`
                    absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full
                    ${unlocked
                        ? 'bg-yellow-600/30 text-yellow-200'
                        : 'bg-gray-700/30 text-gray-500'
                    }
                `}>
                    💰 {achievement.gold_reward}
                </div>
            )}

            {/* Unlocked badge */}
            {unlocked && (
                <div className="absolute -top-1 -right-1 text-lg">
                    ✅
                </div>
            )}
        </div>
    );
};
