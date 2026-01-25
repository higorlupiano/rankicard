import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    });

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuthState({
                user: session?.user ?? null,
                session,
                loading: false,
            });
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setAuthState({
                    user: session?.user ?? null,
                    session,
                    loading: false,
                });
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = useCallback(async () => {
        // Use native deep link for mobile platforms, web URL for browser
        const isNative = Capacitor.isNativePlatform();
        const redirectUrl = isNative
            ? 'com.rankicard.app://auth/callback'
            : 'https://rankicard.vercel.app';

        if (isNative) {
            // On native platforms, use Capacitor Browser to open OAuth flow
            // This allows the system to intercept the deep link redirect
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true, // Don't auto-redirect, we'll handle it
                },
            });

            if (error) {
                console.error('Error signing in:', error);
                throw error;
            }

            if (data?.url) {
                // Open the OAuth URL in the system browser
                await Browser.open({ url: data.url });
            }
        } else {
            // On web, use standard OAuth flow
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                },
            });

            if (error) {
                console.error('Error signing in:', error);
                throw error;
            }
        }
    }, []);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }, []);

    return {
        user: authState.user,
        session: authState.session,
        loading: authState.loading,
        signInWithGoogle,
        signOut,
    };
}
