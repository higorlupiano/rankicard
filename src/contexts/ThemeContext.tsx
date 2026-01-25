import React, { createContext, useContext, ReactNode } from 'react';
import { Theme, DEFAULT_THEME, useThemes } from '../hooks/useThemes';
import { useGame } from './GameContext';

interface ThemeContextType {
    activeTheme: Theme;
    allThemes: Theme[];
    isOwned: (themeId: string) => boolean;
    purchaseTheme: (themeId: string, price: number) => Promise<boolean>;
    activateTheme: (themeId: string) => Promise<boolean>;
    loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { user } = useGame();
    const {
        activeTheme,
        allThemes,
        isOwned,
        purchaseTheme,
        activateTheme,
        loading,
    } = useThemes(user);

    return (
        <ThemeContext.Provider value={{
            activeTheme,
            allThemes,
            isOwned,
            purchaseTheme,
            activateTheme,
            loading,
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        // Return default theme if not in provider
        return {
            activeTheme: DEFAULT_THEME,
            allThemes: [],
            isOwned: () => false,
            purchaseTheme: async () => false,
            activateTheme: async () => false,
            loading: false,
        };
    }
    return context;
}
