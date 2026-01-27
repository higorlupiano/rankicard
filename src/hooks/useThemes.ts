import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface Theme {
    id: string;
    code: string;
    name: string;
    description: string | null;
    icon: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_gradient: string;
    text_color: string;
    price: number;
    min_level: number;
    is_default: boolean;
}

export interface UserTheme {
    id: string;
    user_id: string;
    theme_id: string;
    purchased_at: string;
    theme?: Theme;
}

// Default Medieval theme
export const DEFAULT_THEME: Theme = {
    id: 'default',
    code: 'medieval',
    name: 'Medieval',
    description: 'O tema clássico de pergaminho antigo',
    icon: '⚔️',
    primary_color: '#5c4033',
    secondary_color: '#e6d5ac',
    accent_color: '#8b6c42',
    background_gradient: 'linear-gradient(to bottom, #e6d5ac, #d4c196)',
    text_color: '#FFFFFF',
    price: 0,
    min_level: 1,
    is_default: true,
};

// Apply theme colors to CSS variables on document root
export function applyThemeToDocument(theme: Theme): void {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary_color);
    root.style.setProperty('--theme-secondary', theme.secondary_color);
    root.style.setProperty('--theme-accent', theme.accent_color);
    root.style.setProperty('--theme-text', theme.text_color);
    root.style.setProperty('--theme-gradient', theme.background_gradient);
}

export function useThemes(user: User | null) {
    const [allThemes, setAllThemes] = useState<Theme[]>([]);
    const [ownedThemes, setOwnedThemes] = useState<UserTheme[]>([]);
    const [activeTheme, setActiveTheme] = useState<Theme>(DEFAULT_THEME);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load themes
    const loadThemes = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Get all available themes
            const { data: themes, error: themesError } = await supabase
                .from('themes')
                .select('*')
                .eq('is_active', true)
                .order('min_level', { ascending: true });

            if (themesError) throw themesError;
            setAllThemes(themes || []);

            // Get user's owned themes
            const { data: owned, error: ownedError } = await supabase
                .from('user_themes')
                .select('*, theme:themes(*)')
                .eq('user_id', user.id);

            if (ownedError) throw ownedError;
            setOwnedThemes(owned || []);

            // Get user's active theme from profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('active_theme_id')
                .eq('id', user.id)
                .single();

            if (profile?.active_theme_id) {
                const active = themes?.find(t => t.id === profile.active_theme_id);
                if (active) {
                    setActiveTheme(active);
                }
            } else {
                // Set default theme if no active theme
                const defaultTheme = themes?.find(t => t.is_default);
                if (defaultTheme) {
                    setActiveTheme(defaultTheme);
                }
            }

        } catch (err) {
            console.error('Error loading themes:', err);
            setError('Erro ao carregar temas');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadThemes();
    }, [loadThemes]);

    // Apply theme to document whenever activeTheme changes
    useEffect(() => {
        applyThemeToDocument(activeTheme);
    }, [activeTheme]);

    // Purchase a theme
    const purchaseTheme = useCallback(async (themeId: string, price: number): Promise<boolean> => {
        if (!user) return false;

        try {
            // Check if already owned
            const alreadyOwned = ownedThemes.some(ot => ot.theme_id === themeId);
            if (alreadyOwned) {
                setError('Você já possui este tema');
                return false;
            }

            // Deduct gold from profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('gold')
                .eq('id', user.id)
                .single();

            if (!profile || profile.gold < price) {
                setError('Gold insuficiente');
                return false;
            }

            // Update gold
            await supabase
                .from('profiles')
                .update({ gold: profile.gold - price })
                .eq('id', user.id);

            // Add theme to user
            await supabase
                .from('user_themes')
                .insert({
                    user_id: user.id,
                    theme_id: themeId
                });

            await loadThemes();
            return true;
        } catch (err) {
            console.error('Error purchasing theme:', err);
            setError('Erro ao comprar tema');
            return false;
        }
    }, [user, ownedThemes, loadThemes]);

    // Activate a theme
    const activateTheme = useCallback(async (themeId: string): Promise<boolean> => {
        if (!user) return false;

        try {
            // Check if user owns theme
            const owned = ownedThemes.some(ot => ot.theme_id === themeId);
            const theme = allThemes.find(t => t.id === themeId);

            if (!owned && !theme?.is_default) {
                setError('Você não possui este tema');
                return false;
            }

            // Update profile
            await supabase
                .from('profiles')
                .update({ active_theme_id: themeId })
                .eq('id', user.id);

            if (theme) {
                setActiveTheme(theme);
            }

            return true;
        } catch (err) {
            console.error('Error activating theme:', err);
            setError('Erro ao ativar tema');
            return false;
        }
    }, [user, ownedThemes, allThemes]);

    // Check if theme is owned
    const isOwned = useCallback((themeId: string): boolean => {
        const theme = allThemes.find(t => t.id === themeId);
        if (theme?.is_default) return true;
        return ownedThemes.some(ot => ot.theme_id === themeId);
    }, [ownedThemes, allThemes]);

    return {
        allThemes,
        ownedThemes,
        activeTheme,
        loading,
        error,
        purchaseTheme,
        activateTheme,
        isOwned,
        refresh: loadThemes,
    };
}
