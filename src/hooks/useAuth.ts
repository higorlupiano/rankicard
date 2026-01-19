import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

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
        // Always redirect to web URL
        // The web app will detect mobile browser and redirect to native app
        const redirectUrl = 'https://rankicard.vercel.app';

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
