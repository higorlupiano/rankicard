import React from 'react';
import { ShoppingBag, Scroll, Sword, QrCode } from 'lucide-react';
import { SpriteIcon } from '../ui/SpriteIcon';
import { Tab } from '../../types';

interface FooterNavProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export const FooterNav: React.FC<FooterNavProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="absolute bottom-1 md:bottom-2 left-0 right-0 z-30 px-4 py-1 flex justify-between items-end bg-[#1a0a00]/90 backdrop-blur-sm mx-2 rounded-lg border border-[#c8a95c]/30">
            <SpriteIcon
                icon={<ShoppingBag size={20} />}
                label="Loja"
                isActive={activeTab === 'shop'}
                onClick={() => onTabChange('shop')}
            />
            <SpriteIcon
                icon={<Scroll size={20} />}
                label="Integrações"
                isActive={activeTab === 'integrations'}
                onClick={() => onTabChange('integrations')}
            />
            <SpriteIcon
                icon={<Sword size={20} />}
                label="Perfil"
                isActive={activeTab === 'stats'}
                onClick={() => onTabChange('stats')}
            />
            <SpriteIcon
                icon={<QrCode size={20} />}
                label="QR Code"
                isActive={activeTab === 'qr'}
                onClick={() => onTabChange('qr')}
            />
        </div>
    );
};
