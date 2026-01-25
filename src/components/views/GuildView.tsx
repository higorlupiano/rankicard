import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useGuilds } from '../../hooks/useGuilds';
import { Users, Crown, Plus, LogOut, Loader2, Trophy, Star, Shield } from 'lucide-react';
import { ViewContainer } from '../ui';

export const GuildView = () => {
    const { user } = useGame();
    const {
        myGuild,
        guildMembers,
        leaderboard,
        loading,
        error,
        createGuild,
        joinGuild,
        leaveGuild,
        refresh
    } = useGuilds(user);

    const [showCreate, setShowCreate] = useState(false);
    const [newGuildName, setNewGuildName] = useState('');
    const [newGuildDesc, setNewGuildDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState<string | null>(null);

    if (!user) return null;

    const handleCreateGuild = async () => {
        if (!newGuildName.trim()) return;
        setCreating(true);
        const success = await createGuild(newGuildName.trim(), newGuildDesc.trim());
        if (success) {
            setShowCreate(false);
            setNewGuildName('');
            setNewGuildDesc('');
        }
        setCreating(false);
    };

    const handleJoinGuild = async (guildId: string) => {
        setJoining(guildId);
        await joinGuild(guildId);
        setJoining(null);
    };

    const handleLeaveGuild = async () => {
        if (confirm('Tem certeza que deseja sair da guilda?')) {
            await leaveGuild();
        }
    };

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center h-[480px] text-yellow-100">
                <Loader2 className="animate-spin mr-2" />
                <span>Carregando guildas...</span>
            </div>
        );
    }

    // User is in a guild - show guild details
    if (myGuild) {
        return (
            <ViewContainer>
                {/* Guild Header */}
                <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-lg p-4 mb-4 border border-purple-500/30">
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-purple-600/50 flex items-center justify-center text-3xl border border-purple-400/50">
                            {myGuild.avatar_url ? (
                                <img src={myGuild.avatar_url} alt={myGuild.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                '⚔️'
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="font-rpg text-lg text-yellow-100">{myGuild.name}</h2>
                            <p className="text-sm text-gray-400">{myGuild.description || 'Sem descrição'}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs">
                                <span className="flex items-center gap-1 text-yellow-400">
                                    <Star size={12} />
                                    {myGuild.total_xp.toLocaleString()} XP
                                </span>
                                <span className="flex items-center gap-1 text-purple-300">
                                    <Users size={12} />
                                    {myGuild.member_count}/{myGuild.max_members}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Members */}
                <div className="mb-4">
                    <h3 className="font-rpg text-sm text-yellow-100 mb-2 flex items-center gap-2">
                        <Users size={16} />
                        Membros
                    </h3>
                    <div className="space-y-2">
                        {guildMembers.map(member => (
                            <div
                                key={member.id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-black/30 border border-gray-700/30"
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-500/50">
                                    {member.profile?.avatar_url ? (
                                        <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">👤</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-200">
                                            {member.profile?.display_name || 'Aventureiro'}
                                        </span>
                                        {member.role === 'leader' && (
                                            <Crown size={14} className="text-yellow-400" />
                                        )}
                                        {member.role === 'officer' && (
                                            <Shield size={14} className="text-blue-400" />
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Nível {member.profile?.current_level || 1} • {member.contribution_xp.toLocaleString()} XP contribuído
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leave button */}
                <button
                    onClick={handleLeaveGuild}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                >
                    <LogOut size={16} />
                    Sair da Guilda
                </button>
            </ViewContainer>
        );
    }

    // User is not in a guild - show create/join
    return (
        <ViewContainer>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-yellow-100">
                    <Users size={24} />
                    <span className="font-rpg text-lg">Guildas</span>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors"
                >
                    <Plus size={16} />
                    Criar
                </button>
            </div>

            {error && (
                <div className="mb-4 p-2 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
                    {error}
                </div>
            )}

            {/* Create Guild Form */}
            {showCreate && (
                <div className="mb-4 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                    <h3 className="font-rpg text-sm text-purple-200 mb-3">Criar Nova Guilda</h3>
                    <input
                        type="text"
                        placeholder="Nome da guilda"
                        value={newGuildName}
                        onChange={(e) => setNewGuildName(e.target.value)}
                        className="w-full mb-2 px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        maxLength={30}
                    />
                    <textarea
                        placeholder="Descrição (opcional)"
                        value={newGuildDesc}
                        onChange={(e) => setNewGuildDesc(e.target.value)}
                        className="w-full mb-3 px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                        rows={2}
                        maxLength={100}
                    />
                    <button
                        onClick={handleCreateGuild}
                        disabled={!newGuildName.trim() || creating}
                        className="w-full py-2 rounded-lg bg-purple-600 text-white font-rpg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
                    >
                        {creating ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Criar Guilda'}
                    </button>
                </div>
            )}

            {/* Guild Leaderboard */}
            <div className="mb-2">
                <h3 className="font-rpg text-sm text-yellow-100 mb-2 flex items-center gap-2">
                    <Trophy size={16} />
                    Top Guildas
                </h3>
            </div>

            <div className="space-y-2">
                {leaderboard.map(guild => (
                    <div
                        key={guild.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-gray-700/30"
                    >
                        {/* Rank */}
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-rpg font-bold text-sm
                            ${guild.rank === 1 ? 'bg-yellow-500 text-black' :
                                guild.rank === 2 ? 'bg-gray-300 text-black' :
                                    guild.rank === 3 ? 'bg-amber-600 text-white' :
                                        'bg-gray-700 text-gray-300'}
                        `}>
                            {guild.rank}
                        </div>

                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-lg bg-purple-600/30 flex items-center justify-center text-xl border border-purple-500/30">
                            ⚔️
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-rpg text-sm text-gray-200 truncate">{guild.name}</h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Star size={10} className="text-yellow-400" />
                                    {guild.total_xp.toLocaleString()} XP
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users size={10} />
                                    {guild.member_count}
                                </span>
                            </div>
                        </div>

                        {/* Join button */}
                        <button
                            onClick={() => handleJoinGuild(guild.id)}
                            disabled={joining === guild.id}
                            className="px-3 py-1.5 rounded-lg bg-purple-600/50 text-purple-200 text-xs hover:bg-purple-600 transition-colors disabled:opacity-50"
                        >
                            {joining === guild.id ? (
                                <Loader2 className="animate-spin" size={14} />
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </div>
                ))}

                {leaderboard.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        <Users size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Nenhuma guilda encontrada</p>
                        <p className="text-sm">Seja o primeiro a criar uma!</p>
                    </div>
                )}
            </div>
        </ViewContainer>
    );
};
