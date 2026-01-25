import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { useActivityLog } from '../../hooks/useActivityLog';
import { History, Loader2, Star, Coins } from 'lucide-react';

export const ActivityHistoryView = () => {
    const { user } = useGame();
    const {
        activities,
        loading,
        getActionIcon,
        getActionColor,
        formatTimeAgo
    } = useActivityLog(user);

    if (!user) return null;

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center h-[480px] text-yellow-100">
                <Loader2 className="animate-spin mr-2" />
                <span>Carregando histórico...</span>
            </div>
        );
    }

    return (
        <div className="w-full animate-fade-in overflow-y-auto custom-scrollbar landscape-content">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-yellow-100">
                    <History size={24} />
                    <span className="font-rpg text-lg">Histórico</span>
                </div>
                <div className="text-sm text-yellow-200/70">
                    {activities.length} atividades
                </div>
            </div>

            {/* Activity list */}
            <div className="space-y-2">
                {activities.map((activity) => (
                    <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-black/30 border border-gray-700/30"
                    >
                        {/* Icon */}
                        <div className={`
                            text-2xl flex-shrink-0 w-10 h-10 rounded-full 
                            flex items-center justify-center bg-black/50
                        `}>
                            {getActionIcon(activity.action_type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${getActionColor(activity.action_type)}`}>
                                {activity.description}
                            </p>

                            {/* XP/Gold amounts */}
                            <div className="flex items-center gap-3 mt-1">
                                {activity.xp_amount > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-yellow-400">
                                        <Star size={12} />
                                        +{activity.xp_amount} XP
                                    </span>
                                )}
                                {activity.gold_amount > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-amber-400">
                                        <Coins size={12} />
                                        +{activity.gold_amount} Gold
                                    </span>
                                )}
                                {activity.gold_amount < 0 && (
                                    <span className="flex items-center gap-1 text-xs text-red-400">
                                        <Coins size={12} />
                                        {activity.gold_amount} Gold
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Timestamp */}
                        <div className="text-xs text-gray-500 flex-shrink-0">
                            {formatTimeAgo(activity.created_at)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {activities.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    <History size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhuma atividade registrada</p>
                    <p className="text-sm mt-1">Suas ações aparecerão aqui!</p>
                </div>
            )}
        </div>
    );
};
