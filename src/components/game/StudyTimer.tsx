import React from 'react';
import { formatTime, SESSION_SHORT_MIN, SESSION_LONG_MIN, XP_PER_MINUTE_STUDY, STUDY_DAILY_CAP } from '../../utils/gameLogic';

interface StudyTimerProps {
    todayStudyXP: number;
    onComplete: (xp: number) => void;
    onLog: (message: string) => void;
    // Estado elevado para App.tsx
    isStudying: boolean;
    setIsStudying: (v: boolean) => void;
    timeLeft: number;
    setTimeLeft: (v: number) => void;
    sessionXP: number;
    setSessionXP: (v: number) => void;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({
    todayStudyXP,
    onLog,
    isStudying,
    setIsStudying,
    timeLeft,
    setTimeLeft,
    sessionXP,
    setSessionXP
}) => {
    const startSession = (minutes: number) => {
        const potentialXP = minutes * XP_PER_MINUTE_STUDY;

        if (todayStudyXP + potentialXP > STUDY_DAILY_CAP) {
            onLog('🛑 Limite diário de estudos atingido!');
            return;
        }

        setSessionXP(potentialXP);
        setTimeLeft(minutes * 60);
        setIsStudying(true);
        onLog(`📚 Sessão de ${minutes}min iniciada!`);
    };

    const cancelSession = () => {
        setIsStudying(false);
        setTimeLeft(0);
        onLog('❌ Sessão cancelada.');
    };

    const remainingToday = STUDY_DAILY_CAP - todayStudyXP;

    return (
        <div className="bg-gradient-to-b from-[#e6d5ac] to-[#d4c196] rounded-lg p-4 border-2 border-[#2980b9] shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#2980b9]/30">
                <span className="text-2xl">🧠</span>
                <h3 className="font-rpg font-bold text-[#2980b9] text-lg">Treino Mental</h3>
            </div>

            {/* Daily Progress */}
            <div className="mb-4 text-center">
                <p className="text-xs font-rpg text-[#5c4033]">
                    Fadiga: <span className="font-bold text-[#2980b9]">{todayStudyXP}</span>/{STUDY_DAILY_CAP} XP
                </p>
                <div className="w-full h-2 bg-[#1a0f0a] rounded-full mt-1 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#2980b9] to-[#3498db] transition-all duration-300"
                        style={{ width: `${(todayStudyXP / STUDY_DAILY_CAP) * 100}%` }}
                    />
                </div>
            </div>

            {!isStudying ? (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => startSession(SESSION_SHORT_MIN)}
                            disabled={remainingToday < SESSION_SHORT_MIN * XP_PER_MINUTE_STUDY}
                            className="flex-1 bg-[#2980b9] hover:bg-[#2471a3] text-white py-3 rounded-lg font-rpg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {SESSION_SHORT_MIN} Min
                        </button>
                        <button
                            onClick={() => startSession(SESSION_LONG_MIN)}
                            disabled={remainingToday < SESSION_LONG_MIN * XP_PER_MINUTE_STUDY}
                            className="flex-1 bg-[#8e44ad] hover:bg-[#7d3c98] text-white py-3 rounded-lg font-rpg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {SESSION_LONG_MIN} Min
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-[#5c4033]/70 font-rpg">
                        +{XP_PER_MINUTE_STUDY} XP/min • Restante hoje: {remainingToday} XP
                    </p>
                </div>
            ) : (
                <div className="text-center">
                    {/* Timer Display */}
                    <div className="text-5xl font-mono font-bold text-[#2980b9] mb-4 drop-shadow-sm">
                        {formatTime(timeLeft)}
                    </div>

                    {/* XP Preview */}
                    <p className="text-sm font-rpg text-[#5c4033] mb-4">
                        Recompensa: <span className="text-[#2980b9] font-bold">+{sessionXP} XP</span>
                    </p>

                    {/* Cancel Button */}
                    <button
                        onClick={cancelSession}
                        className="w-full bg-red-100 hover:bg-red-200 text-red-600 border border-red-300 py-2 rounded-lg text-sm font-rpg font-bold transition-all"
                    >
                        Desistir
                    </button>
                </div>
            )}
        </div>
    );
};
