import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { useLeaderboard, LeaderboardFilter } from '../../hooks/useLeaderboard';
import { Trophy, Loader2, Crown, Flame, Star } from 'lucide-react';
import { getRank } from '../../utils/gameLogic';
import { ViewContainer } from '../ui';

export const LeaderboardView = () => {
    const { user } = useGame();
    const {
        entries,
        loading,
        filter,
        setFilter,
        userRank,
        getRankEmoji,
        getRankColor
    } = useLeaderboard(user?.id || null);

    if (!user) return null;

    const filters: { key: LeaderboardFilter; label: string; icon: string }[] = [
        { key: 'all_time', label: 'Total XP', icon: '⭐' },
        { key: 'by_level', label: 'Por Nível', icon: '📊' },
    ];

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center h-[480px] text-yellow-100">
                <Loader2 className="animate-spin mr-2" />
                <span>Carregando ranking...</span>
            </div>
        );
    }

    return (
        <ViewContainer>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-yellow-100">
                    <Trophy size={24} />
                    <span className="font-rpg text-lg">Ranking</span>
                </div>
                {userRank && (
                    <div className="text-sm bg-yellow-600/30 px-3 py-1 rounded-full text-yellow-200">
                        Sua posição: #{userRank}
                    </div>
                )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-4">
                {filters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`
                            flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all
                            ${filter === f.key
                                ? 'bg-yellow-600 text-white'
                                : 'bg-black/30 text-gray-300 hover:bg-black/50'
                            }
                        `}
                    >
                        <span>{f.icon}</span>
                        <span>{f.label}</span>
                    </button>
                ))}
            </div>

            {/* Leaderboard entries */}
            <div className="space-y-2">
                {entries.slice(0, 10).map((entry) => {
                    const isCurrentUser = entry.id === user.id;
                    const rank = getRank(entry.current_level);

                    return (
                        <div
                            key={entry.id}
                            className={`
                                flex items-center gap-3 p-3 rounded-lg border transition-all
                                ${isCurrentUser
                                    ? 'bg-yellow-900/40 border-yellow-500/50'
                                    : 'bg-black/30 border-gray-700/30'
                                }
                            `}
                        >
                            {/* Rank position */}
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-rpg font-bold text-lg
                                bg-gradient-to-br ${getRankColor(entry.rank || 0)}
                            `}>
                                {entry.rank! <= 3 ? getRankEmoji(entry.rank!) : entry.rank}
                            </div>

                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-600/50">
                                {entry.avatar_url ? (
                                    <img
                                        src={entry.avatar_url}
                                        alt={entry.display_name || 'Avatar'}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-2xl">
                                        👤
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className={`
                                    font-rpg text-sm font-bold truncate
                                    ${isCurrentUser ? 'text-yellow-100' : 'text-gray-200'}
                                `}>
                                    {entry.display_name || 'Aventureiro'}
                                    {isCurrentUser && <span className="text-xs ml-1">(você)</span>}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Crown size={12} />
                                        Rank {rank}
                                    </span>
                                    {entry.streak_count > 0 && (
                                        <span className="flex items-center gap-1 text-orange-400">
                                            <Flame size={12} />
                                            {entry.streak_count}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-yellow-300 font-rpg font-bold">
                                    <Star size={14} />
                                    {entry.total_xp.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Nível {entry.current_level}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {entries.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    <Trophy size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum jogador encontrado</p>
                </div>
            )}
        </ViewContainer>
    );
};
