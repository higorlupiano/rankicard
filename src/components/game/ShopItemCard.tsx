import React from 'react';
import { ShopItem } from '../../lib/supabase';
import { Coins, Lock, Check } from 'lucide-react';

interface ShopItemCardProps {
    item: ShopItem;
    userLevel: number;
    userGold: number;
    owned: boolean;
    onPurchase: () => void;
}

export const ShopItemCard: React.FC<ShopItemCardProps> = ({
    item,
    userLevel,
    userGold,
    owned,
    onPurchase
}) => {
    const canAfford = userGold >= item.price;
    const meetsLevel = userLevel >= item.min_level;
    const canBuy = canAfford && meetsLevel && !owned;

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'boost': return 'from-purple-900/40 to-indigo-900/30 border-purple-500/50';
            case 'cosmetic': return 'from-pink-900/40 to-rose-900/30 border-pink-500/50';
            case 'title': return 'from-amber-900/40 to-yellow-900/30 border-amber-500/50';
            default: return 'from-gray-900/40 to-gray-800/30 border-gray-500/50';
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'boost': return '⚡ Boost';
            case 'cosmetic': return '🎨 Cosmético';
            case 'title': return '📜 Título';
            default: return category;
        }
    };

    return (
        <div className={`
            relative p-4 rounded-lg border-2 transition-all
            bg-gradient-to-br ${getCategoryColor(item.category)}
            ${owned ? 'opacity-60' : ''}
        `}>
            {/* Category badge */}
            <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-black/30 text-gray-300">
                {getCategoryLabel(item.category)}
            </div>

            {/* Icon */}
            <div className="text-4xl mb-2">
                {item.icon}
            </div>

            {/* Name */}
            <h4 className="font-rpg text-sm font-bold text-yellow-100 mb-1">
                {item.name}
            </h4>

            {/* Description */}
            <p className="text-xs text-gray-300 mb-3">
                {item.description}
            </p>

            {/* Duration if applicable */}
            {item.effect_duration && (
                <p className="text-xs text-purple-300 mb-2">
                    ⏱️ Duração: {item.effect_duration >= 60
                        ? `${Math.floor(item.effect_duration / 60)}h`
                        : `${item.effect_duration}min`
                    }
                </p>
            )}

            {/* Level requirement if not met */}
            {!meetsLevel && (
                <div className="flex items-center gap-1 text-xs text-red-400 mb-2">
                    <Lock size={12} />
                    <span>Requer nível {item.min_level}</span>
                </div>
            )}

            {/* Price and buy button */}
            <div className="flex items-center justify-between mt-2">
                <div className={`
                    flex items-center gap-1 
                    ${canAfford ? 'text-yellow-300' : 'text-red-400'}
                `}>
                    <Coins size={16} />
                    <span className="font-bold">{item.price}</span>
                </div>

                {owned ? (
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                        <Check size={14} />
                        <span>Adquirido</span>
                    </div>
                ) : (
                    <button
                        onClick={onPurchase}
                        disabled={!canBuy}
                        className={`
                            px-3 py-1 rounded-lg text-sm font-rpg font-bold transition-all
                            ${canBuy
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }
                        `}
                    >
                        Comprar
                    </button>
                )}
            </div>
        </div>
    );
};
