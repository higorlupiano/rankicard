import React from 'react';

interface SpriteIconProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export const SpriteIcon: React.FC<SpriteIconProps> = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'scale-110 -translate-y-2' : 'hover:scale-105 hover:-translate-y-1'}`}
        >
            {/* Glow Effect behind active icon */}
            {isActive && (
                <div className="absolute inset-0 bg-yellow-500/40 blur-xl rounded-full scale-150 animate-pulse" />
            )}

            {/* The Icon Container - Simulating the Gold Circle from Image 3 */}
            <div className={`
        relative w-12 h-12 rounded-full border-2 
        flex items-center justify-center shadow-lg bg-gradient-to-b
        ${isActive
                    ? 'border-yellow-200 from-yellow-700 to-yellow-900 shadow-yellow-500/50'
                    : 'border-yellow-700 from-gray-900 to-gray-800 shadow-black/50'}
      `}>
                {/* Inner Ring */}
                <div className={`absolute inset-1 rounded-full border border-yellow-500/30 ${isActive ? 'bg-yellow-900/50' : ''}`} />

                {/* Icon */}
                <div className={`z-10 relative ${isActive ? 'text-yellow-100 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : 'text-yellow-600 group-hover:text-yellow-400'}`}>
                    {icon}
                </div>
            </div>

            {/* Label */}
            <span className={`mt-1 text-[9px] font-rpg font-bold tracking-widest uppercase transition-colors ${isActive ? 'text-yellow-200 text-shadow-gold' : 'text-yellow-800/70'}`}>
                {label}
            </span>
        </button>
    );
};
