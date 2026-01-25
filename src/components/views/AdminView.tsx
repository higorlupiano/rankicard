import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { ViewContainer } from '../ui';
export const AdminView = () => {
    const { user, profile } = useGame();

    if (!profile?.is_admin || !user) return null;

    return (
        <ViewContainer>
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
        </ViewContainer>
    );
};
