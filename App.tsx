import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Tab } from './src/types';
import { useGame } from './src/contexts/GameContext';

// Components
import { HeaderBanner, FooterNav } from './src/components/layout';
import { LoginScreen } from './src/components/auth';
import { StatsView } from './src/components/views/StatsView';
import { ShopView } from './src/components/views/ShopView';
import { MissionsView } from './src/components/views/MissionsView';
import { IntegrationsView } from './src/components/views/IntegrationsView';
import { QrCodeView } from './src/components/views/QrCodeView';
import { AdminView } from './src/components/views/AdminView';
import { AchievementsView } from './src/components/views/AchievementsView';

export default function App() {
  const { user, profile, authLoading, profileLoading, signInWithGoogle, signOut, getTitle, getRank } = useGame();
  // Wait, getTitle/getRank are utils, not in context. Use utils directly or context?
  // Context didn't export getTitle/getRank. It exported profile.
  // I need to import getTitle/getRank from utils here if needed, or inside views.

  // App.tsx HeaderBanner needs title and rank.
  // So I import utils here.

  const [activeTab, setActiveTab] = useState<Tab>('stats');

  return <AppContent activeTab={activeTab} setActiveTab={setActiveTab} />;
}

// Subcomponent to allow using hooks inside if needed, or just cleaner
import { getTitle, getRank } from './src/utils/gameLogic';

function AppContent({ activeTab, setActiveTab }: { activeTab: Tab, setActiveTab: (t: Tab) => void }) {
  const { user, profile, authLoading, profileLoading, signInWithGoogle, signOut } = useGame();

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

  const currentLevel = profile?.current_level || 1;
  const rank = getRank(currentLevel);
  const title = getTitle(currentLevel);

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

          {/* Header Banner */}
          <HeaderBanner title={`${title} - Rank ${rank}`} />

          {/* Views */}
          {activeTab === 'stats' && <StatsView />}
          {activeTab === 'shop' && <ShopView />}
          {activeTab === 'missions' && <MissionsView />}
          {activeTab === 'integrations' && <IntegrationsView />}
          {activeTab === 'qr' && <QrCodeView />}
          {activeTab === 'achievements' && <AchievementsView />}
          {activeTab === 'admin' && <AdminView />}

        </div>

        {/* Footer Navigation */}
        <FooterNav activeTab={activeTab} onTabChange={setActiveTab} isAdmin={profile?.is_admin || false} />
      </div>
    </div>
  );
}