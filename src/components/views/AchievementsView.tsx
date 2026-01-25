import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useAchievements } from '../../hooks/useAchievements';
import { ViewContainer } from '../ui';
import { AchievementCard } from '../game/AchievementCard';
import { Trophy, Loader2 } from 'lucide-react';

export const AchievementsView = () => {
    const { user, profile } = useGame();
    const {
        achievements,
        loading,
        isUnlocked,
        getProgress,
        unlockedCount,
        totalCount,
        newUnlock
    } = useAchievements(user, profile);

    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    if (!user) return null;

    const categories = [
        { key: 'all', label: 'Todos', icon: '🏆' },
        { key: 'xp', label: 'XP', icon: '⭐' },
        { key: 'level', label: 'Nível', icon: '📈' },
        { key: 'streak', label: 'Streak', icon: '🔥' },
        { key: 'gold', label: 'Gold', icon: '💰' },
        { key: 'strava', label: 'Strava', icon: '🏃' },
        { key: 'study', label: 'Estudo', icon: '📚' },
    ];

    const filteredAchievements = selectedCategory === 'all'
        ? achievements
        : achievements.filter(a => a.category === selectedCategory);

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center h-[480px] text-yellow-100">
                <Loader2 className="animate-spin mr-2" />
                <span>Carregando conquistas...</span>
            </div>
        );
    }

    return (
        <ViewContainer>
            {/* New unlock notification */}
            {newUnlock && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-600 to-amber-500 text-white px-6 py-3 rounded-lg shadow-xl animate-bounce">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{newUnlock.icon}</span>
                        <div>
                            <p className="font-rpg font-bold">Conquista Desbloqueada!</p>
                            <p className="text-sm">{newUnlock.name}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-yellow-100">
                    <Trophy size={24} />
                    <span className="font-rpg text-lg">Conquistas</span>
                </div>
                <div className="text-sm text-yellow-200/70">
                    {unlockedCount}/{totalCount} desbloqueadas
                </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat.key}
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`
                            flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all
                            ${selectedCategory === cat.key
                                ? 'bg-yellow-600 text-white'
                                : 'bg-black/30 text-gray-300 hover:bg-black/50'
                            }
                        `}
                    >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Achievements grid */}
            <div className="grid grid-cols-2 gap-3">
                {filteredAchievements.map(achievement => (
                    <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        unlocked={isUnlocked(achievement.id)}
                        progress={getProgress(achievement, profile)}
                    />
                ))}
            </div>

            {filteredAchievements.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    Nenhuma conquista nesta categoria
                </div>
            )}
        </ViewContainer>
    );
};
