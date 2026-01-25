import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { StravaPanel, SpotifyPanel, StudyTimer } from '../game';
import { ViewContainer } from '../ui';
export const IntegrationsView = () => {
    const {
        profile,
        syncMsg,
        spotifySyncMsg,
        isStravaSyncing,
        stravaCooldownRemaining,
        handleStravaConnect,
        handleStravaSync,
        handleStravaDisconnect,
        handleSpotifyConnect,
        handleSpotifySync,
        handleSpotifyDisconnect,
        // Timer
        todayStudyXP, // Wait, is this in context?
        handleStudyComplete,
        setLogMsg,
        isStudying,
        setIsStudying,
        timeLeft,
        setTimeLeft,
        sessionXP,
        setSessionXP
    } = useGame();

    // oops, todayStudyXP is part of profile.
    const currentTodayStudyXP = profile?.today_study_xp || 0;

    return (
        <ViewContainer>
            <h2 className="font-rpg text-xl text-[#5c4033] text-center mb-4 lg:mb-2">Integrações</h2>

            <div className="space-y-4 landscape-integrations">
                <StravaPanel
                    connected={!!profile?.strava_refresh_token}
                    syncMessage={syncMsg}
                    onConnect={handleStravaConnect}
                    onSync={handleStravaSync}
                    onDisconnect={handleStravaDisconnect}
                    isSyncDisabled={stravaCooldownRemaining > 0}
                    isLoading={isStravaSyncing}
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
                    todayStudyXP={currentTodayStudyXP}
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
        </ViewContainer>
    );
};
