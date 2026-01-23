import React, { useState, useEffect } from 'react';
import { ShoppingBag, Scroll, LogOut, Coins } from 'lucide-react';
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
import { StudyTimer, StravaPanel, SpotifyPanel, MissionsPanel } from './src/components/game';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { profile, loading: profileLoading, addStudyXP, addXP, updateProfile, refreshProfile } = useProfile(user);

  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [logMsg, setLogMsg] = useState('Bem-vindo, Aventureiro!');
  const [syncMsg, setSyncMsg] = useState('');
  const [spotifySyncMsg, setSpotifySyncMsg] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Timer state (elevated to persist across tab changes)
  const [isStudying, setIsStudying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);

  // Strava sync cooldown state (15 minutes = 900 seconds)
  const STRAVA_COOLDOWN_SECONDS = 15 * 60;
  const [stravaCooldownRemaining, setStravaCooldownRemaining] = useState(0);

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

  // Strava cooldown timer effect - load from localStorage and countdown
  useEffect(() => {
    // Load cooldown from localStorage on mount
    const savedCooldownEnd = localStorage.getItem('stravaSyncCooldownEnd');
    if (savedCooldownEnd) {
      const endTime = parseInt(savedCooldownEnd, 10);
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      setStravaCooldownRemaining(remaining);
    }

    // Set up interval to countdown
    const interval = setInterval(() => {
      setStravaCooldownRemaining((prev) => {
        if (prev <= 1) {
          localStorage.removeItem('stravaSyncCooldownEnd');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  // Handle Strava/Spotify OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && user) {
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);

      // Determine which service the callback is for
      if (state === 'spotify') {
        handleSpotifyCallback(code);
      } else {
        // Default to Strava for backwards compatibility
        handleStravaCallback(code);
      }
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

      // Activate cooldown IMMEDIATELY after API request (to respect rate limits)
      const cooldownEnd = Date.now() + STRAVA_COOLDOWN_SECONDS * 1000;
      localStorage.setItem('stravaSyncCooldownEnd', cooldownEnd.toString());
      setStravaCooldownRemaining(STRAVA_COOLDOWN_SECONDS);

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

  // Spotify handlers
  const handleSpotifyConnect = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = window.location.origin;
    const scope = 'user-read-recently-played';

    if (!clientId) {
      setLogMsg('⚠️ Configure VITE_SPOTIFY_CLIENT_ID no .env.local');
      return;
    }

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=spotify`;
    window.location.href = authUrl;
  };

  const handleSpotifyCallback = async (code: string) => {
    setLogMsg('🔄 Vinculando Spotify...');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/spotify-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (data.refresh_token) {
        await updateProfile({
          spotify_refresh_token: data.refresh_token,
          spotify_access_token: data.access_token,
          spotify_expires_at: data.expires_at,
        });
        refreshProfile();
        setLogMsg('✅ Spotify conectado com sucesso!');
      } else {
        setLogMsg('❌ Erro ao vincular Spotify');
        console.error('Spotify error:', data);
      }
    } catch (error) {
      console.error('Spotify callback error:', error);
      setLogMsg('❌ Erro de conexão com Spotify');
    }
  };

  const handleSpotifySync = async () => {
    if (!profile || !user) return;

    setSpotifySyncMsg('⏳ Buscando músicas recentes...');

    try {
      // Check if token needs refresh
      let accessToken = profile.spotify_access_token;
      const expiresAt = profile.spotify_expires_at || 0;
      const now = Math.floor(Date.now() / 1000);

      if (now >= expiresAt && profile.spotify_refresh_token) {
        // Refresh token
        const tokenRes = await fetch(`${SUPABASE_URL}/functions/v1/spotify-auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: profile.spotify_refresh_token }),
        });
        const tokenData = await tokenRes.json();

        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          await updateProfile({
            spotify_access_token: tokenData.access_token,
            spotify_refresh_token: tokenData.refresh_token || profile.spotify_refresh_token,
            spotify_expires_at: tokenData.expires_at,
          });
        } else {
          setSpotifySyncMsg('❌ Erro ao renovar token');
          return;
        }
      }

      if (!accessToken) {
        setSpotifySyncMsg('❌ Token não disponível');
        return;
      }

      // Fetch recently played tracks
      const lastSync = profile.spotify_last_sync || 0;
      const afterTimestamp = lastSync > 0 ? lastSync : undefined;

      let url = 'https://api.spotify.com/v1/me/player/recently-played?limit=50';
      if (afterTimestamp) {
        url += `&after=${afterTimestamp}`;
      }

      const tracksRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!tracksRes.ok) {
        setSpotifySyncMsg('❌ Erro ao buscar músicas');
        return;
      }

      const tracksData = await tracksRes.json();
      const items = tracksData.items || [];

      if (items.length === 0) {
        setSpotifySyncMsg('✅ Nenhuma música nova');
        return;
      }

      // Calculate XP - 1 XP per minute of music
      let totalDurationMs = 0;
      let latestTimestamp = lastSync;

      items.forEach((item: any) => {
        const track = item.track;
        const playedAt = new Date(item.played_at).getTime();

        // Only count tracks played after last sync
        if (playedAt > lastSync) {
          totalDurationMs += track.duration_ms;
        }

        if (playedAt > latestTimestamp) {
          latestTimestamp = playedAt;
        }
      });

      const totalMinutes = Math.floor(totalDurationMs / 60000);
      const xpGained = totalMinutes; // 1 XP per minute

      // Update last sync timestamp
      await updateProfile({ spotify_last_sync: latestTimestamp });

      if (xpGained > 0) {
        await addXP(xpGained);
        setSpotifySyncMsg(`🎵 +${xpGained} XP (${totalMinutes} min de música)`);
        setLogMsg(`+${xpGained} XP do Spotify!`);
      } else {
        setSpotifySyncMsg('✅ Sem XP elegível nas músicas');
      }

      refreshProfile();

    } catch (error) {
      console.error('Spotify sync error:', error);
      setSpotifySyncMsg('❌ Erro na sincronização');
    }
  };

  const handleSpotifyDisconnect = async () => {
    if (!confirm('Desvincular Spotify?')) return;
    await updateProfile({
      spotify_refresh_token: null,
      spotify_access_token: null,
      spotify_expires_at: null,
    });
    setSpotifySyncMsg('');
    setLogMsg('Spotify desvinculado.');
  };

  // Study handler
  const handleStudyComplete = async (xp: number) => {
    const success = await addStudyXP(xp);
    if (!success) {
      setLogMsg('🛑 Limite diário atingido!');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black flex items-start justify-center p-2 sm:p-4 overflow-auto relative landscape-container">
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
        className="absolute top-10 right-6 z-50 text-yellow-600 hover:text-yellow-400 transition-colors bg-black/60 p-2 rounded-full border border-yellow-900/50 shadow-lg backdrop-blur-sm"
        title="Sair"
      >
        <LogOut size={20} />
      </button>

      {/* --- THE CARD --- */}
      <div className="relative w-full max-w-[420px] shadow-2xl z-10 my-2 landscape-card">

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
        <div className="relative z-20 flex flex-col pt-16 pb-24 px-4 sm:px-8 landscape-header">

          {/* Header Banner - Always visible */}
          <HeaderBanner title={`${title} - Rank ${rank}`} />

          {/* PROFILE TAB - Shows full profile with stats, avatar, progress, and logout */}
          {activeTab === 'stats' && (
            <div className="animate-fade-in h-[480px] overflow-y-auto overflow-x-hidden custom-scrollbar landscape-content">
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

              {/* Logout Button removed as requested */}
            </div>
          )}

          {/* SHOP TAB - Full screen content */}
          {activeTab === 'shop' && (
            <div className="w-full flex flex-col items-center justify-center animate-fade-in text-[#5c4033] h-[480px] overflow-y-auto custom-scrollbar landscape-content">
              {/* Gold Balance */}
              <div className="flex items-center gap-2 mb-6 bg-gradient-to-r from-yellow-600 to-yellow-500 px-6 py-3 rounded-full shadow-lg">
                <Coins size={28} className="text-yellow-100" />
                <span className="font-rpg text-2xl font-bold text-white">
                  {profile?.gold || 0}
                </span>
              </div>

              <ShoppingBag size={48} className="mb-4 opacity-50" />
              <p className="font-rpg text-lg">Loja em breve...</p>
              <p className="font-rpg text-sm opacity-70 mt-2">Itens e upgrades estarão disponíveis aqui</p>
            </div>
          )}

          {/* MISSIONS TAB - Full screen content */}
          {activeTab === 'missions' && (
            <div className="w-full animate-fade-in h-[480px] overflow-y-auto custom-scrollbar landscape-content">
              <MissionsPanel
                userRank={rank}
                userLevel={currentLevel}
                userId={user.id}
                onMissionComplete={async (xp, gold) => {
                  await addXP(xp);
                  await updateProfile({ gold: (profile?.gold || 0) + gold });
                  refreshProfile();
                }}
                onLog={setLogMsg}
              />
            </div>
          )}

          {/* INTEGRATIONS TAB - Full screen content */}
          {activeTab === 'integrations' && (
            <div className="w-full animate-fade-in space-y-4 h-[480px] overflow-y-auto custom-scrollbar landscape-content landscape-integrations">
              <h2 className="font-rpg text-xl text-[#5c4033] text-center mb-4">Integrações</h2>
              <StravaPanel
                connected={!!profile?.strava_refresh_token}
                syncMessage={syncMsg}
                onConnect={handleStravaConnect}
                onSync={handleStravaSync}
                onDisconnect={handleStravaDisconnect}
                isSyncDisabled={stravaCooldownRemaining > 0}
                cooldownRemaining={stravaCooldownRemaining}
              />
              <SpotifyPanel
                connected={!!profile?.spotify_refresh_token}
                syncMessage={spotifySyncMsg}
                onConnect={handleSpotifyConnect}
                onSync={handleSpotifySync}
                onDisconnect={handleSpotifyDisconnect}
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
            <div className="w-full flex flex-col items-center justify-center animate-fade-in h-[480px] overflow-y-auto custom-scrollbar landscape-content">
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

          {/* ADMIN TAB - Only visible for admin users */}
          {activeTab === 'admin' && profile?.is_admin && (
            <div className="w-full animate-fade-in h-[480px] overflow-y-auto custom-scrollbar landscape-content">
              <div className="bg-gradient-to-b from-[#e6d5ac] to-[#d4c196] rounded-lg p-4 border-2 border-purple-600 shadow-lg">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-purple-600/30">
                  <span className="text-2xl">👑</span>
                  <h3 className="font-rpg font-bold text-purple-800 text-lg">Painel Admin</h3>
                </div>

                <div className="space-y-3">
                  <div className="bg-white/50 rounded-lg p-3">
                    <h4 className="font-rpg font-bold text-[#3e2723] text-sm mb-2">Gerenciar Missões</h4>
                    <p className="text-xs text-[#5c4033]/70 mb-2">Adicione, edite ou remova missões</p>
                    <a
                      href="https://supabase.com/dashboard/project/utwohjqwuxousqpexrvd/editor"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-rpg py-2 px-3 rounded transition-colors"
                    >
                      Abrir Supabase →
                    </a>
                  </div>

                  <div className="bg-white/50 rounded-lg p-3">
                    <h4 className="font-rpg font-bold text-[#3e2723] text-sm mb-2">Estatísticas</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#5c4033]/10 rounded p-2 text-center">
                        <p className="text-[#5c4033]/70">Seu Ouro</p>
                        <p className="font-rpg font-bold text-yellow-600">{profile?.gold || 0}</p>
                      </div>
                      <div className="bg-[#5c4033]/10 rounded p-2 text-center">
                        <p className="text-[#5c4033]/70">Total XP</p>
                        <p className="font-rpg font-bold text-purple-600">{profile?.total_xp || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/50 rounded-lg p-3">
                    <h4 className="font-rpg font-bold text-[#3e2723] text-sm mb-1">ID do Usuário</h4>
                    <p className="text-[10px] text-[#5c4033]/70 font-mono break-all">{user.id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <FooterNav activeTab={activeTab} onTabChange={setActiveTab} isAdmin={profile?.is_admin || false} />

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