import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useThemes, Theme } from '../../hooks/useThemes';
import { Palette, Check, Lock, Loader2, Coins } from 'lucide-react';

export const ThemesView = () => {
    const { user, profile, refreshProfile } = useGame();
    const {
        allThemes,
        activeTheme,
        isOwned,
        purchaseTheme,
        activateTheme,
        loading
    } = useThemes(user);

    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [activating, setActivating] = useState<string | null>(null);

    if (!user) return null;

    const userLevel = profile?.current_level || 1;
    const userGold = profile?.gold || 0;

    const handlePurchase = async (theme: Theme) => {
        setPurchasing(theme.id);
        const success = await purchaseTheme(theme.id, theme.price);
        if (success) {
            refreshProfile();
        }
        setPurchasing(null);
    };

    const handleActivate = async (themeId: string) => {
        setActivating(themeId);
        await activateTheme(themeId);
        setActivating(null);
    };

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center h-[480px] text-yellow-100">
                <Loader2 className="animate-spin mr-2" />
                <span>Carregando temas...</span>
            </div>
        );
    }

    return (
        <div className="w-full animate-fade-in h-[480px] overflow-y-auto custom-scrollbar landscape-content">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-yellow-100">
                    <Palette size={24} />
                    <span className="font-rpg text-lg">Temas</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-sm">
                    <Coins size={16} />
                    <span className="font-rpg">{userGold}</span>
                </div>
            </div>

            {/* Active Theme Preview */}
            <div className="mb-4 p-3 rounded-lg border-2 border-yellow-500/50" style={{ background: activeTheme.background_gradient }}>
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{activeTheme.icon}</span>
                    <div>
                        <h3 className="font-rpg font-bold" style={{ color: activeTheme.primary_color }}>
                            Tema Ativo: {activeTheme.name}
                        </h3>
                        <p className="text-xs" style={{ color: activeTheme.primary_color, opacity: 0.8 }}>
                            {activeTheme.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-2 gap-3">
                {allThemes.map(theme => {
                    const owned = isOwned(theme.id);
                    const isActive = activeTheme.id === theme.id;
                    const canBuy = userLevel >= theme.min_level && userGold >= theme.price;
                    const levelLocked = userLevel < theme.min_level;

                    return (
                        <div
                            key={theme.id}
                            className={`
                                relative p-3 rounded-lg border-2 transition-all
                                ${isActive
                                    ? 'border-yellow-400 shadow-lg shadow-yellow-500/20'
                                    : 'border-gray-600/50 hover:border-gray-500'
                                }
                            `}
                            style={{ background: theme.background_gradient }}
                        >
                            {/* Active badge */}
                            {isActive && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                    <Check size={14} className="text-black" />
                                </div>
                            )}

                            {/* Level lock overlay */}
                            {levelLocked && (
                                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <Lock size={20} className="mx-auto mb-1 text-gray-400" />
                                        <p className="text-xs text-gray-400">Nível {theme.min_level}</p>
                                    </div>
                                </div>
                            )}

                            {/* Theme info */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{theme.icon}</span>
                                <div>
                                    <h4 className="font-rpg text-sm font-bold" style={{ color: theme.primary_color }}>
                                        {theme.name}
                                    </h4>
                                </div>
                            </div>

                            {/* Action button */}
                            {!levelLocked && (
                                <div className="mt-2">
                                    {isActive ? (
                                        <div className="text-center text-xs py-1.5 rounded bg-yellow-500/20 text-yellow-400 font-rpg">
                                            Ativo
                                        </div>
                                    ) : owned ? (
                                        <button
                                            onClick={() => handleActivate(theme.id)}
                                            disabled={activating === theme.id}
                                            className="w-full py-1.5 rounded bg-blue-600/50 text-blue-200 text-xs font-rpg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                        >
                                            {activating === theme.id ? (
                                                <Loader2 className="animate-spin mx-auto" size={14} />
                                            ) : (
                                                'Ativar'
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handlePurchase(theme)}
                                            disabled={!canBuy || purchasing === theme.id}
                                            className={`
                                                w-full py-1.5 rounded text-xs font-rpg transition-colors flex items-center justify-center gap-1
                                                ${canBuy
                                                    ? 'bg-amber-600/50 text-amber-200 hover:bg-amber-600'
                                                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            {purchasing === theme.id ? (
                                                <Loader2 className="animate-spin" size={14} />
                                            ) : (
                                                <>
                                                    <Coins size={12} />
                                                    {theme.price}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
