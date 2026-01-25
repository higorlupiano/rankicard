import { useState, useEffect, useCallback, useRef } from 'react';

interface UseStudyTimerProps {
    onComplete: (xp: number) => Promise<void>;
}

export function useStudyTimer({ onComplete }: UseStudyTimerProps) {
    const [isStudying, setIsStudying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [sessionXP, setSessionXP] = useState(0);
    const onCompleteRef = useRef(onComplete);

    // Keep ref updated
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Timer countdown effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isStudying && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isStudying && timeLeft === 0) {
            // Timer completed
            setIsStudying(false);
            onCompleteRef.current(sessionXP);
        }

        return () => clearInterval(interval);
    }, [isStudying, timeLeft, sessionXP]);

    const startTimer = useCallback((durationMinutes: number, xpReward: number) => {
        setTimeLeft(durationMinutes * 60);
        setSessionXP(xpReward);
        setIsStudying(true);
    }, []);

    const stopTimer = useCallback(() => {
        setIsStudying(false);
        setTimeLeft(0);
        setSessionXP(0);
    }, []);

    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const getProgress = useCallback((totalSeconds: number): number => {
        if (totalSeconds === 0) return 0;
        return ((totalSeconds - timeLeft) / totalSeconds) * 100;
    }, [timeLeft]);

    return {
        isStudying,
        setIsStudying,
        timeLeft,
        setTimeLeft,
        sessionXP,
        setSessionXP,
        startTimer,
        stopTimer,
        formatTime,
        getProgress,
    };
}
