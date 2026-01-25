import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useShop } from '../../hooks/useShop';
import { ShopItemCard } from '../game/ShopItemCard';
import { ShoppingBag, Coins, Loader2, Package } from 'lucide-react';
import { ViewContainer } from '../ui';

export const ShopView = () => {
    const { user, profile, refreshProfile } = useGame();
    const {
        shopItems,
        userItems,
        loading,
        purchaseMessage,
        purchaseItem,
        ownsItem,
        getEquippedBadges,
        getEquippedTitle,
        getActiveBoost
    } = useShop(user, profile);

    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    if (!user || !profile) return null;

    const categories = [
        { key: 'all', label: 'Todos', icon: '🛒' },
        { key: 'boost', label: 'Boosts', icon: '⚡' },
        { key: 'cosmetic', label: 'Cosméticos', icon: '🎨' },
        { key: 'title', label: 'Títulos', icon: '📜' },
    ];

    const filteredItems = selectedCategory === 'all'
        ? shopItems
        : shopItems.filter(item => item.category === selectedCategory);

    const handlePurchase = async (item: any) => {
        const success = await purchaseItem(item);
        if (success) {
            refreshProfile();
        }
    };

    const activeBoost = getActiveBoost();
    const equippedBadges = getEquippedBadges();
    const equippedTitle = getEquippedTitle();

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center h-[480px] text-yellow-100">
                <Loader2 className="animate-spin mr-2" />
                <span>Carregando loja...</span>
            </div>
        );
    }

    return (
        <ViewContainer>
            {/* Purchase message notification */}
            {purchaseMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-lg shadow-xl">
                    {purchaseMessage}
                </div>
            )}

            {/* Header with gold balance */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-yellow-100">
                    <ShoppingBag size={24} />
                    <span className="font-rpg text-lg">Loja</span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 px-4 py-2 rounded-full shadow-lg">
                    <Coins size={20} className="text-yellow-100" />
                    <span className="font-rpg text-lg font-bold text-white">
                        {profile.gold || 0}
                    </span>
                </div>
            </div>

            {/* Active boost indicator */}
            {activeBoost && (
                <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">⚡</span>
                            <div>
                                <p className="text-purple-200 font-bold">Boost {activeBoost.multiplier}x XP Ativo!</p>
                                <p className="text-purple-300/70 text-xs">
                                    Expira em: {activeBoost.expiresAt.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User inventory summary */}
            {userItems.length > 0 && (
                <div className="bg-black/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Package size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-300">Seu Inventário: {userItems.length} itens</span>
                    </div>
                    {equippedBadges.length > 0 && (
                        <div className="text-xs text-gray-400">
                            Badges: {equippedBadges.map(b => b.item?.icon).join(' ')}
                        </div>
                    )}
                    {equippedTitle && (
                        <div className="text-xs text-amber-400">
                            Título: {equippedTitle}
                        </div>
                    )}
                </div>
            )}

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

            {/* Shop items grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map(item => (
                    <ShopItemCard
                        key={item.id}
                        item={item}
                        userLevel={profile.current_level}
                        userGold={profile.gold}
                        owned={ownsItem(item.id)}
                        onPurchase={() => handlePurchase(item)}
                    />
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    <ShoppingBag size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum item disponível nesta categoria</p>
                </div>
            )}
        </ViewContainer>
    );
};
