import React, { useEffect, useState } from 'react';

interface MissionCompleteAnimationProps {
    missionName: string;
    xpReward: number;
    goldReward: number;
    onComplete: () => void;
}

export const MissionCompleteAnimation: React.FC<MissionCompleteAnimationProps> = ({
    missionName,
    xpReward,
    goldReward,
    onComplete
}) => {
    const [stars, setStars] = useState<Array<{ id: number; x: number; delay: number }>>([]);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Generate stars
        const newStars = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 0.3
        }));
        setStars(newStars);

        // Show content after delay
        setTimeout(() => setShowContent(true), 100);

        // Auto-dismiss after 2.5 seconds
        const timer = setTimeout(() => {
            onComplete();
        }, 2500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onComplete}
        >
            {/* Animated stars */}
            {stars.map(star => (
                <div
                    key={star.id}
                    className="absolute text-2xl animate-bounce-star"
                    style={{
                        left: `${star.x}%`,
                        top: '50%',
                        animationDelay: `${star.delay}s`,
                    }}
                >
                    ⭐
                </div>
            ))}

            {/* Content */}
            {showContent && (
                <div className="text-center z-10 animate-scale-in">
                    {/* Icon */}
                    <div className="text-7xl mb-4 animate-pulse">
                        ✅
                    </div>

                    {/* Title */}
                    <h2 className="font-rpg text-2xl text-green-400 mb-2">
                        Missão Completa!
                    </h2>

                    {/* Mission name */}
                    <p className="text-yellow-100 font-rpg text-lg mb-4 max-w-xs mx-auto">
                        {missionName}
                    </p>

                    {/* Rewards */}
                    <div className="flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2 bg-yellow-900/50 px-4 py-2 rounded-lg">
                            <span className="text-2xl">⭐</span>
                            <span className="text-yellow-300 font-rpg font-bold">+{xpReward} XP</span>
                        </div>
                        {goldReward > 0 && (
                            <div className="flex items-center gap-2 bg-amber-900/50 px-4 py-2 rounded-lg">
                                <span className="text-2xl">🪙</span>
                                <span className="text-amber-300 font-rpg font-bold">+{goldReward} Gold</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CSS */}
            <style>{`
                @keyframes bounce-star {
                    0% {
                        transform: translateY(0) scale(0);
                        opacity: 0;
                    }
                    20% {
                        transform: translateY(-100px) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-200px) scale(0.5);
                        opacity: 0;
                    }
                }
                
                @keyframes scale-in {
                    0% {
                        transform: scale(0) rotate(-10deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.1) rotate(5deg);
                    }
                    100% {
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                }
                
                .animate-bounce-star {
                    animation: bounce-star 1.5s ease-out forwards;
                }
                
                .animate-scale-in {
                    animation: scale-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
