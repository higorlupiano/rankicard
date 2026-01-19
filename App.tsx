import React, { useState, useEffect } from 'react';
import { ShoppingBag, Scroll, LogOut } from 'lucide-react';
import QRCode from 'react-qr-code';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Types
import { Tab } from './src/types';

// Hooks
import { useAuth } from './src/hooks/useAuth';
import { useProfile } from './src/hooks/useProfile';

// Utils
import { getXpProgress, getRank, getTitle, STUDY_DAILY_CAP } from './src/utils/gameLogic';

// Components
import { StatBox, ProgressBar } from './src/components/ui';
import { HeaderBanner, FooterNav } from './src/components/layout';
import { AvatarFrame } from './src/components/player';
import { LoginScreen } from './src/components/auth';
import { StudyTimer, StravaPanel } from './src/components/game';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { profile, loading: profileLoading, addStudyXP, addXP, updateProfile, refreshProfile } = useProfile(user);

  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [logMsg, setLogMsg] = useState('Bem-vindo, Aventureiro!');
  const [syncMsg, setSyncMsg] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Timer state (elevated to persist across tab changes)
  const [isStudying, setIsStudying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);

  // Handle OAuth redirect from web to native app (when accessed via mobile browser)
  useEffect(() => {
    // Skip if running in native app
    if (Capacitor.isNativePlatform()) return;

    // Check if there are OAuth tokens in the URL hash
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // Check if this is a mobile browser (Android or iOS)
      const isMobileWeb = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobileWeb) {
        // Redirect to native app with the OAuth tokens
        const appUrl = `com.rankicard.app://auth/callback${hash}`;
        console.log('Redirecting to native app:', appUrl);
        window.location.href = appUrl;
        return;
      }
    }
  }, []);

  // Timer countdown effect - runs in App.tsx so it persists
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStudying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isStudying && timeLeft === 0) {
      // Timer completed
      setIsStudying(false);
      addStudyXP(sessionXP);
      setLogMsg(`✅ +${sessionXP} XP de Estudos!`);
    }

    return () => clearInterval(interval);
  }, [isStudying, timeLeft, sessionXP, addStudyXP]);

  // Handle deep link for OAuth callback (Android)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Handle app opened via deep link
    CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      console.log('Deep link received:', url);

      // Check if this is our OAuth callback (any URL with our scheme)
      if (url.startsWith('com.rankicard.app://')) {
        // The URL contains the auth tokens in the fragment (after #)
        // Extract the fragment (everything after #)
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1) {
          const fragment = url.substring(hashIndex + 1);
          // Convert fragment to URL params format for Supabase to handle
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('Setting session from deep link');
            // Let Supabase handle the session
            const { supabase } = await import('./src/lib/supabase');
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            // Close the browser after successful auth
            const { Browser } = await import('@capacitor/browser');
            await Browser.close();
          }
        }
      }
    });

    // Check if app was opened with a URL (cold start)
    CapacitorApp.getLaunchUrl().then(async (result) => {
      if (result?.url) {
        console.log('App launched with URL:', result.url);

        if (result.url.startsWith('com.rankicard.app://')) {
          const hashIndex = result.url.indexOf('#');
          if (hashIndex !== -1) {
            const fragment = result.url.substring(hashIndex + 1);
            const params = new URLSearchParams(fragment);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              console.log('Setting session from launch URL');
              const { supabase } = await import('./src/lib/supabase');
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              // Close the browser after successful auth
              const { Browser } = await import('@capacitor/browser');
              await Browser.close();
            }
          }
        }
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  // Handle Strava OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && user) {
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);

      // Exchange code for tokens
      handleStravaCallback(code);
    }
  }, [user]);

  const handleStravaCallback = async (code: string) => {
    setLogMsg('🔄 Vinculando Strava...');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/strava-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (data.refresh_token) {
        await updateProfile({
          strava_refresh_token: data.refresh_token,
          strava_access_token: data.access_token,
          strava_expires_at: data.expires_at,
        });
        refreshProfile();
        setLogMsg('✅ Strava conectado com sucesso!');
      } else {
        setLogMsg('❌ Erro ao vincular Strava');
        console.error('Strava error:', data);
      }
    } catch (error) {
      console.error('Strava callback error:', error);
      setLogMsg('❌ Erro de conexão com Strava');
    }
  };

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-yellow-100 font-rpg text-xl animate-pulse">
          Carregando Guilda...
        </p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <LoginScreen onLogin={signInWithGoogle} />;
  }

  // Calculate game stats
  const totalXP = profile?.total_xp || 0;
  const currentLevel = profile?.current_level || 1;
  const todayStudyXP = profile?.today_study_xp || 0;
  const currentAvatarUrl = avatarUrl || profile?.avatar_url;
  const { xpInLevel, xpRequired, percent } = getXpProgress(totalXP, currentLevel);
  const rank = getRank(currentLevel);
  const title = getTitle(currentLevel);

  // Strava handlers
  const handleStravaConnect = () => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const redirectUri = window.location.origin;
    const scope = 'activity:read_all';

    if (!clientId) {
      setLogMsg('⚠️ Configure VITE_STRAVA_CLIENT_ID no .env.local');
      return;
    }

    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;
  };

  const handleStravaSync = async () => {
    if (!profile || !user) return;

    setSyncMsg('⏳ Buscando atividades...');

    try {
      // Check if token needs refresh
      let accessToken = profile.strava_access_token;
      const expiresAt = profile.strava_expires_at || 0;
      const now = Math.floor(Date.now() / 1000);

      if (now >= expiresAt && profile.strava_refresh_token) {
        // Refresh token
        const tokenRes = await fetch(`${SUPABASE_URL}/functions/v1/strava-auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: profile.strava_refresh_token }),
        });
        const tokenData = await tokenRes.json();

        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          await updateProfile({
            strava_access_token: tokenData.access_token,
            strava_refresh_token: tokenData.refresh_token,
            strava_expires_at: tokenData.expires_at,
          });
        } else {
          setSyncMsg('❌ Erro ao renovar token');
          return;
        }
      }

      if (!accessToken) {
        setSyncMsg('❌ Token não disponível');
        return;
      }

      // Fetch activities
      const lastSync = profile.strava_last_sync || 0;
      const activitiesRes = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${lastSync}&per_page=10`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!activitiesRes.ok) {
        setSyncMsg('❌ Erro ao buscar atividades');
        return;
      }

      const activities = await activitiesRes.json();

      if (!Array.isArray(activities) || activities.length === 0) {
        setSyncMsg('✅ Nenhuma atividade nova');
        return;
      }

      // XP Constants
      const XP_PER_METER_RUN = 0.27;
      const XP_PER_METER_BIKE = 0.09;

      // Calculate XP with anti-cheat
      let totalXpGained = 0;
      let newActivitiesCount = 0;
      let latestDate = lastSync;
      let manualIgnored = 0;

      activities.forEach((act: any) => {
        // ANTI-CHEAT: Ignore manual activities
        if (act.manual) {
          manualIgnored++;
          const actDate = new Date(act.start_date).getTime() / 1000;
          if (actDate > latestDate) latestDate = actDate;
          return;
        }

        let xpForThis = 0;

        // Running/Walking/Hiking
        if (['Run', 'Walk', 'Hike'].includes(act.type)) {
          xpForThis = Math.floor(act.distance * XP_PER_METER_RUN);
        }
        // Cycling
        else if (['Ride', 'VirtualRide', 'EBikeRide'].includes(act.type)) {
          xpForThis = Math.floor(act.distance * XP_PER_METER_BIKE);
        }

        if (xpForThis > 0) {
          totalXpGained += xpForThis;
          newActivitiesCount++;
        }

        const actDate = new Date(act.start_date).getTime() / 1000;
        if (actDate > latestDate) latestDate = actDate;
      });

      // Update last sync timestamp
      await updateProfile({ strava_last_sync: latestDate });

      if (totalXpGained > 0) {
        await addXP(totalXpGained);
        setSyncMsg(`🔥 +${totalXpGained} XP (${newActivitiesCount} atividades)`);
        setLogMsg(`+${totalXpGained} XP do Strava!`);
      } else if (manualIgnored > 0) {
        setSyncMsg(`⚠️ ${manualIgnored} atividades manuais ignoradas`);
      } else {
        setSyncMsg('✅ Sem XP elegível nas atividades');
      }

      refreshProfile();

    } catch (error) {
      console.error('Sync error:', error);
      setSyncMsg('❌ Erro na sincronização');
    }
  };

  const handleStravaDisconnect = async () => {
    if (!confirm('Desvincular Strava?')) return;
    // Note: NÃO resetamos strava_last_sync para evitar reprocessar atividades antigas
    await updateProfile({
      strava_refresh_token: null,
      strava_access_token: null,
      strava_expires_at: null,
    });
    setSyncMsg('');
    setLogMsg('Strava desvinculado.');
  };

  // Study handler
  const handleStudyComplete = async (xp: number) => {
    const success = await addStudyXP(xp);
    if (!success) {
      setLogMsg('🛑 Limite diário atingido!');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black flex items-start justify-center p-2 sm:p-4 overflow-auto relative">
      {/* Global Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <img
          src="https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2574&auto=format&fit=crop"
          alt="Dungeon Background"
          className="w-full h-full object-cover grayscale brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      {/* Logout Button */}
      <button
        onClick={signOut}
        className="absolute top-4 right-4 z-50 text-yellow-600/50 hover:text-yellow-400 transition-colors"
        title="Sair"
      >
        <LogOut size={20} />
      </button>

      {/* --- THE CARD --- */}
      <div className="relative w-full max-w-[420px] shadow-2xl z-10 my-2">

        {/* Layer 1: The Parchment Background */}
        <div className="absolute inset-1 sm:inset-2 bg-[#e6d5ac] rounded-sm -z-10">
          <div
            className="absolute inset-0 opacity-60 mix-blend-multiply"
            style={{
              backgroundImage: `url('https://www.transparenttextures.com/patterns/aged-paper.png')`,
              backgroundSize: '200px'
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#3e2723_100%)] opacity-40" />
        </div>

        {/* Layer 2: The Content Container */}
        <div className="relative z-20 flex flex-col pt-6 pb-24 px-4 sm:px-8">

          {/* Header Banner - Always visible */}
          <HeaderBanner title={`${title} - Rank ${rank}`} />

          {/* PROFILE TAB - Shows full profile with stats, avatar, progress, and logout */}
          {activeTab === 'stats' && (
            <div className="animate-fade-in min-h-[420px] overflow-y-auto">
              {/* Player Name */}
              <div className="text-center mb-4">
                <h2 className="text-4xl md:text-5xl font-rpg font-black text-transparent bg-clip-text bg-gradient-to-b from-[#5c4033] to-[#2c1810] drop-shadow-sm mb-1">
                  {profile?.display_name?.split(' ')[0] || user.email?.split('@')[0] || 'Aventureiro'}
                </h2>
                <p className="font-rpg font-bold text-[#8a1c1c] tracking-widest text-sm opacity-80">
                  ID: {user.id.slice(0, 8).toUpperCase()}
                </p>
              </div>

              {/* Stats + Avatar Section */}
              <div className="flex items-center justify-between mb-3">
                {/* Stats Column */}
                <div className="flex flex-col gap-4 w-1/3 pt-2">
                  <StatBox label="NÍVEL ATUAL" value={currentLevel} delay={100} />
                  <StatBox label="TOTAL XP" value={Math.floor(totalXP)} delay={200} />
                  <StatBox label="FADIGA" value={`${todayStudyXP}/${STUDY_DAILY_CAP}`} delay={300} />
                </div>

                {/* Avatar Column */}
                <div className="w-2/3 pl-4 pt-2 relative">
                  <AvatarFrame
                    avatarUrl={currentAvatarUrl}
                    rank={rank}
                    userId={user.id}
                    onAvatarChange={setAvatarUrl}
                  />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="text-center mb-4">
                <p className="font-rpg text-[#5c4033] mb-2">Progresso do Nível</p>
                <ProgressBar current={xpInLevel} max={xpRequired} />
              </div>

              {/* Log Message */}
              <div className="bg-black/80 text-green-400 p-2 rounded font-mono text-xs border border-gray-700 text-center mb-4">
                {logMsg}
              </div>

              {/* Logout Button */}
              <button
                onClick={signOut}
                className="w-full py-2 px-4 bg-[#8a1c1c]/20 hover:bg-[#8a1c1c]/40 text-[#8a1c1c] font-rpg text-sm rounded border border-[#8a1c1c]/30 transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sair da Conta
              </button>
            </div>
          )}

          {/* SHOP TAB - Full screen content */}
          {activeTab === 'shop' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in text-[#5c4033] min-h-[420px]">
              <ShoppingBag size={64} className="mb-4 opacity-50" />
              <p className="font-rpg text-lg">Loja em breve...</p>
              <p className="font-rpg text-sm opacity-70 mt-2">Itens e upgrades estarão disponíveis aqui</p>
            </div>
          )}

          {/* INTEGRATIONS TAB - Full screen content */}
          {activeTab === 'integrations' && (
            <div className="flex-1 animate-fade-in space-y-4 min-h-[420px] overflow-y-auto">
              <h2 className="font-rpg text-xl text-[#5c4033] text-center mb-4">Integrações</h2>
              <StravaPanel
                connected={!!profile?.strava_refresh_token}
                syncMessage={syncMsg}
                onConnect={handleStravaConnect}
                onSync={handleStravaSync}
                onDisconnect={handleStravaDisconnect}
              />
              <StudyTimer
                todayStudyXP={todayStudyXP}
                onComplete={handleStudyComplete}
                onLog={setLogMsg}
                isStudying={isStudying}
                setIsStudying={setIsStudying}
                timeLeft={timeLeft}
                setTimeLeft={setTimeLeft}
                sessionXP={sessionXP}
                setSessionXP={setSessionXP}
              />
            </div>
          )}

          {/* QR CODE TAB - Full screen content */}
          {activeTab === 'qr' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in min-h-[420px]">
              <h2 className="font-rpg text-xl text-[#5c4033] mb-6">Seu QR Code</h2>
              <div className="bg-white p-6 rounded-lg border-4 border-[#8a1c1c] shadow-lg">
                <QRCode
                  value={user.id.slice(0, 8).toUpperCase()}
                  size={160}
                  level="H"
                />
              </div>
              <p className="font-rpg text-sm mt-4 text-[#5c4033]">
                ID: <span className="font-bold">{user.id.slice(0, 8).toUpperCase()}</span>
              </p>
              <p className="font-rpg text-xs mt-2 text-[#5c4033]/70">
                Use este código para identificação
              </p>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <FooterNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Layer 3: The Golden Frame Overlay */}
        <div className="absolute inset-0 pointer-events-none z-40">
          <svg className="absolute top-0 left-0 w-full h-full text-[#c8a95c]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f2d888" />
                <stop offset="50%" stopColor="#c8a95c" />
                <stop offset="100%" stopColor="#8b6c42" />
              </linearGradient>
              <filter id="goldGlow">
                <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#ffd700" floodOpacity="0.5" />
              </filter>
            </defs>

            <path d="M10,100 L10,10 Q10,0 20,0 L100,0 L100,10 L20,10 L20,100 Z" fill="url(#goldGrad)" filter="url(#goldGlow)" />
            <path d="M0,0 L40,0 L0,40 Z" fill="#8a1c1c" />
          </svg>

          <div className="absolute top-0 left-10 right-10 h-2 bg-gradient-to-r from-transparent via-[#c8a95c] to-transparent opacity-80" />
          <div className="absolute bottom-0 left-10 right-10 h-2 bg-gradient-to-r from-transparent via-[#c8a95c] to-transparent opacity-80" />
          <div className="absolute left-0 top-10 bottom-10 w-2 bg-gradient-to-b from-transparent via-[#c8a95c] to-transparent opacity-80" />
          <div className="absolute right-0 top-10 bottom-10 w-2 bg-gradient-to-b from-transparent via-[#c8a95c] to-transparent opacity-80" />
        </div>
      </div>
    </div>
  );
}