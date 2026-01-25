import React from 'react';
import { ShoppingBag, Scroll, Sword, QrCode, Target, Shield, Trophy } from 'lucide-react';
import { SpriteIcon } from '../ui/SpriteIcon';
import { Tab } from '../../types';

interface FooterNavProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    isAdmin?: boolean;
}

export const FooterNav: React.FC<FooterNavProps> = ({ activeTab, onTabChange, isAdmin = false }) => {
    return (
        <div className="absolute bottom-1 md:bottom-2 left-0 right-0 z-30 mx-2 rounded-lg border border-[#c8a95c]/30 bg-[#1a0a00]/90 backdrop-blur-sm overflow-visible">
            <div className="flex items-end px-4 pt-3 pb-1 overflow-x-auto overflow-y-hidden scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex justify-between items-end min-w-full gap-2">
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
                        icon={<Target size={20} />}
                        label="Missões"
                        isActive={activeTab === 'missions'}
                        onClick={() => onTabChange('missions')}
                    />
                    <SpriteIcon
                        icon={<Trophy size={20} />}
                        label="Conquistas"
                        isActive={activeTab === 'achievements'}
                        onClick={() => onTabChange('achievements')}
                    />
                    <SpriteIcon
                        icon={<QrCode size={20} />}
                        label="QR Code"
                        isActive={activeTab === 'qr'}
                        onClick={() => onTabChange('qr')}
                    />
                    {isAdmin && (
                        <SpriteIcon
                            icon={<Shield size={20} />}
                            label="Admin"
                            isActive={activeTab === 'admin'}
                            onClick={() => onTabChange('admin')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

