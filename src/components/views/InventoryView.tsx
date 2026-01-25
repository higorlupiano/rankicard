import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useShop } from '../../hooks/useShop';
import { Package, Check, Clock, Sparkles, Crown, Loader2 } from 'lucide-react';
import { UserItem } from '../../lib/supabase';
import { ViewContainer } from '../ui';

export const InventoryView = () => {
    const { user, profile, refreshProfile } = useGame();
    const {
        userItems,
        loading,
        toggleEquip,
        getActiveBoost,
        getEquippedBadges,
        getEquippedTitle,
        refreshItems
    } = useShop(user, profile);

    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    if (!user || !profile) return null;

    const categories = [
        { key: 'all', label: 'Todos', icon: '📦' },
        { key: 'boost', label: 'Boosts', icon: '⚡' },
        { key: 'cosmetic', label: 'Badges', icon: '🎨' },
        { key: 'title', label: 'Títulos', icon: '📜' },
    ];

    const filteredItems = selectedCategory === 'all'
        ? userItems
        : userItems.filter(ui => ui.item?.category === selectedCategory);

    const activeBoost = getActiveBoost();
    const equippedBadges = getEquippedBadges();
    const equippedTitle = getEquippedTitle();

    const handleToggleEquip = async (item: UserItem) => {
        const success = await toggleEquip(item.id, item.equipped);
        if (success) {
            refreshProfile();
        }
    };

    const isExpired = (expiresAt: string | null): boolean => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    const getTimeRemaining = (expiresAt: string): string => {
        const now = new Date();
        const exp = new Date(expiresAt);
        const diff = exp.getTime() - now.getTime();

        if (diff <= 0) return 'Expirado';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) return `${hours}h ${mins}min`;
        return `${mins}min`;
    };

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center h-[480px] text-yellow-100">
                <Loader2 className="animate-spin mr-2" />
                <span>Carregando inventário...</span>
            </div>
        );
    }

    return (
        <ViewContainer>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-yellow-100">
                    <Package size={24} />
                    <span className="font-rpg text-lg">Inventário</span>
                </div>
                <div className="text-sm text-yellow-200/70">
                    {userItems.length} itens
                </div>
            </div>

            {/* Currently Equipped Section */}
            <div className="bg-black/30 rounded-lg p-3 mb-4 border border-yellow-600/30">
                <h3 className="text-sm font-rpg text-yellow-100 mb-2 flex items-center gap-2">
                    <Sparkles size={16} />
                    Equipados Atualmente
                </h3>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    {/* Active Boost */}
                    <div className="bg-purple-900/30 rounded-lg p-2">
                        <p className="text-purple-300 text-xs mb-1">Boost Ativo</p>
                        {activeBoost ? (
                            <div>
                                <span className="text-purple-100 font-bold">{activeBoost.multiplier}x XP</span>
                                <p className="text-purple-400 text-xs flex items-center gap-1">
                                    <Clock size={10} />
                                    {getTimeRemaining(activeBoost.expiresAt.toISOString())}
                                </p>
                            </div>
                        ) : (
                            <span className="text-gray-500">Nenhum</span>
                        )}
                    </div>

                    {/* Equipped Title */}
                    <div className="bg-amber-900/30 rounded-lg p-2">
                        <p className="text-amber-300 text-xs mb-1">Título</p>
                        {equippedTitle ? (
                            <span className="text-amber-100 font-bold flex items-center gap-1">
                                <Crown size={14} />
                                {equippedTitle}
                            </span>
                        ) : (
                            <span className="text-gray-500">Nenhum</span>
                        )}
                    </div>
                </div>

                {/* Equipped Badges */}
                {equippedBadges.length > 0 && (
                    <div className="mt-2 bg-pink-900/30 rounded-lg p-2">
                        <p className="text-pink-300 text-xs mb-1">Badges</p>
                        <div className="flex gap-2">
                            {equippedBadges.map(badge => (
                                <span key={badge.id} className="text-2xl">
                                    {badge.item?.icon}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
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

            {/* Items List */}
            <div className="space-y-2">
                {filteredItems.map(userItem => {
                    const item = userItem.item;
                    if (!item) return null;

                    const expired = isExpired(userItem.expires_at);
                    const isBoost = item.category === 'boost';
                    const canEquip = !isBoost && !expired;

                    return (
                        <div
                            key={userItem.id}
                            className={`
                                flex items-center justify-between p-3 rounded-lg border transition-all
                                ${expired
                                    ? 'bg-gray-900/50 border-gray-700/30 opacity-50'
                                    : userItem.equipped
                                        ? 'bg-yellow-900/30 border-yellow-500/50'
                                        : 'bg-black/30 border-gray-600/30'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                {/* Icon */}
                                <span className={`text-3xl ${expired ? 'grayscale' : ''}`}>
                                    {item.icon}
                                </span>

                                {/* Info */}
                                <div>
                                    <h4 className="font-rpg text-sm text-yellow-100">
                                        {item.name}
                                    </h4>
                                    <p className="text-xs text-gray-400">
                                        {item.description}
                                    </p>

                                    {/* Expiration for boosts */}
                                    {userItem.expires_at && (
                                        <p className={`text-xs mt-1 flex items-center gap-1 ${expired ? 'text-red-400' : 'text-purple-300'}`}>
                                            <Clock size={10} />
                                            {expired ? 'Expirado' : getTimeRemaining(userItem.expires_at)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Equip Button */}
                            {canEquip && (
                                <button
                                    onClick={() => handleToggleEquip(userItem)}
                                    className={`
                                        px-3 py-1.5 rounded-lg text-sm font-rpg transition-all flex items-center gap-1
                                        ${userItem.equipped
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                        }
                                    `}
                                >
                                    {userItem.equipped ? (
                                        <>
                                            <Check size={14} />
                                            Equipado
                                        </>
                                    ) : (
                                        'Equipar'
                                    )}
                                </button>
                            )}

                            {/* Status for boosts */}
                            {isBoost && !expired && (
                                <div className="text-purple-300 text-sm flex items-center gap-1">
                                    <Sparkles size={14} />
                                    Ativo
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty state */}
            {filteredItems.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum item nesta categoria</p>
                    <p className="text-sm mt-1">Visite a Loja para comprar itens!</p>
                </div>
            )}
        </ViewContainer>
    );
};
