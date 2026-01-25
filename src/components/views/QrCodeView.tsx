import React from 'react';
import { useGame } from '../../contexts/GameContext';
import QRCode from 'react-qr-code';
import { ViewContainer } from '../ui';

export const QrCodeView = () => {
    const { user } = useGame();

    if (!user) return null;

    return (
        <ViewContainer centered>
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
        </ViewContainer>
    );
};
