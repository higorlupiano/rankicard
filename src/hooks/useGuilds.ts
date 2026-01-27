import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface Guild {
    id: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    leader_id: string | null;
    total_xp: number;
    member_count: number;
    max_members: number;
    is_public: boolean;
    invite_code: string;
    created_at: string;
}

export interface GuildMember {
    id: string;
    guild_id: string;
    user_id: string;
    role: 'leader' | 'officer' | 'member';
    contribution_xp: number;
    joined_at: string;
    // Joined data
    profile?: {
        display_name: string | null;
        avatar_url: string | null;
        current_level: number;
        total_xp: number;
    };
}

export interface GuildInvitation {
    id: string;
    guild_id: string;
    invited_user_id: string;
    invited_by: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    updated_at: string;
    guild?: Guild;
}

export interface GuildLeaderboardEntry {
    id: string;
    name: string;
    avatar_url: string | null;
    total_xp: number;
    member_count: number;
    is_public: boolean;
    created_at: string;
    rank?: number;
}

export function useGuilds(user: User | null) {
    const [myGuild, setMyGuild] = useState<Guild | null>(null);
    const [guildMembers, setGuildMembers] = useState<GuildMember[]>([]);
    const [leaderboard, setLeaderboard] = useState<GuildLeaderboardEntry[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<GuildInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if current user is the guild leader
    const isLeader = myGuild?.leader_id === user?.id;

    // Load user's guild and leaderboard
    const loadData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Check if user is in a guild
            const { data: profile } = await supabase
                .from('profiles')
                .select('guild_id')
                .eq('id', user.id)
                .single();

            if (profile?.guild_id) {
                // Load guild details
                const { data: guild } = await supabase
                    .from('guilds')
                    .select('*')
                    .eq('id', profile.guild_id)
                    .single();

                if (guild) {
                    // Update local state first
                    setMyGuild(guild);

                    // Load guild members
                    const { data: members, count } = await supabase
                        .from('guild_members')
                        .select(`
                            *,
                            profile:profiles(display_name, avatar_url, current_level, total_xp)
                        `, { count: 'exact' })
                        .eq('guild_id', guild.id)
                        .order('contribution_xp', { ascending: false });

                    setGuildMembers(members || []);

                    // Sync member count if different
                    if (members && guild.member_count !== members.length) {
                        console.log(`Syncing member count: stored ${guild.member_count}, actual ${members.length}`);
                        await supabase
                            .from('guilds')
                            .update({ member_count: members.length })
                            .eq('id', guild.id);

                        // Update local state
                        setMyGuild(prev => prev ? { ...prev, member_count: members.length } : null);
                    }
                }
            } else {
                setMyGuild(null);
                setGuildMembers([]);
            }

            // Load pending invitations for this user
            const { data: invitations } = await supabase
                .from('guild_invitations')
                .select(`
                    *,
                    guild:guilds(*)
                `)
                .eq('invited_user_id', user.id)
                .eq('status', 'pending');

            setPendingInvitations(invitations || []);

            // Load guild leaderboard
            const { data: leaderboardData } = await supabase
                .from('guild_leaderboard')
                .select('*')
                .limit(20);

            if (leaderboardData) {
                setLeaderboard(leaderboardData.map((g, i) => ({ ...g, rank: i + 1 })));
            }
        } catch (err) {
            console.error('Error loading guilds:', err);
            setError('Erro ao carregar guildas');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Create a new guild
    const createGuild = useCallback(async (name: string, description?: string, isPublic: boolean = false): Promise<boolean> => {
        if (!user) return false;

        try {
            // Create guild with max 6 members
            const { data: guild, error: createError } = await supabase
                .from('guilds')
                .insert({
                    name,
                    description,
                    leader_id: user.id,
                    member_count: 1,
                    max_members: 6,
                    is_public: isPublic
                })
                .select()
                .single();

            if (createError) throw createError;

            // Add user as leader
            await supabase
                .from('guild_members')
                .insert({
                    guild_id: guild.id,
                    user_id: user.id,
                    role: 'leader'
                });

            // Update user's profile
            await supabase
                .from('profiles')
                .update({ guild_id: guild.id })
                .eq('id', user.id);

            await loadData();
            return true;
        } catch (err: any) {
            console.error('Error creating guild:', err);
            setError(err.message || 'Erro ao criar guilda');
            return false;
        }
    }, [user, loadData]);

    // Join a public guild directly
    const joinGuild = useCallback(async (guildId: string): Promise<boolean> => {
        if (!user) return false;

        try {
            // Check if guild is public and has space
            const { data: guild } = await supabase
                .from('guilds')
                .select('member_count, max_members, is_public')
                .eq('id', guildId)
                .single();

            if (!guild) {
                setError('Guilda não encontrada');
                return false;
            }

            if (!guild.is_public) {
                setError('Esta guilda é privada. Solicite um convite ao líder.');
                return false;
            }

            if (guild.member_count >= guild.max_members) {
                setError('Guilda está cheia');
                return false;
            }

            // Join guild
            const { error: joinError } = await supabase
                .from('guild_members')
                .insert({
                    guild_id: guildId,
                    user_id: user.id,
                    role: 'member'
                });

            if (joinError) throw joinError;

            // Update profile
            await supabase
                .from('profiles')
                .update({ guild_id: guildId })
                .eq('id', user.id);

            // Increment member count
            await supabase
                .from('guilds')
                .update({ member_count: guild.member_count + 1 })
                .eq('id', guildId);

            await loadData();
            return true;
        } catch (err: any) {
            console.error('Error joining guild:', err);
            setError(err.message || 'Erro ao entrar na guilda');
            return false;
        }
    }, [user, loadData]);

    // Send invitation to a user by their ID
    const sendInvitation = useCallback(async (invitedUserId: string): Promise<boolean> => {
        if (!user || !myGuild) return false;

        if (!isLeader) {
            setError('Apenas o líder pode convidar membros');
            return false;
        }

        try {
            // Check if guild has space
            if (myGuild.member_count >= myGuild.max_members) {
                setError('Guilda está cheia (máximo 6 membros)');
                return false;
            }

            // Check if user exists
            const { data: targetProfile } = await supabase
                .from('profiles')
                .select('id, guild_id')
                .eq('id', invitedUserId)
                .single();

            if (!targetProfile) {
                setError('Usuário não encontrado');
                return false;
            }

            if (targetProfile.guild_id) {
                setError('Usuário já está em uma guilda');
                return false;
            }

            // Check for existing pending invitation
            const { data: existingInvite } = await supabase
                .from('guild_invitations')
                .select('id')
                .eq('guild_id', myGuild.id)
                .eq('invited_user_id', invitedUserId)
                .eq('status', 'pending')
                .single();

            if (existingInvite) {
                setError('Já existe um convite pendente para este usuário');
                return false;
            }

            // Create invitation
            const { error: inviteError } = await supabase
                .from('guild_invitations')
                .insert({
                    guild_id: myGuild.id,
                    invited_user_id: invitedUserId,
                    invited_by: user.id,
                    status: 'pending'
                });

            if (inviteError) throw inviteError;

            setError(null);
            return true;
        } catch (err: any) {
            console.error('Error sending invitation:', err);
            setError(err.message || 'Erro ao enviar convite');
            return false;
        }
    }, [user, myGuild, isLeader]);

    // Accept an invitation
    const acceptInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
        if (!user) return false;

        try {
            // Get invitation details
            const { data: invitation } = await supabase
                .from('guild_invitations')
                .select('*, guild:guilds(*)')
                .eq('id', invitationId)
                .single();

            if (!invitation || invitation.status !== 'pending') {
                setError('Convite inválido ou já processado');
                return false;
            }

            const guild = invitation.guild as Guild;

            // Check if guild has space
            if (guild.member_count >= guild.max_members) {
                setError('Guilda está cheia');
                return false;
            }

            // Update invitation status
            await supabase
                .from('guild_invitations')
                .update({ status: 'accepted', updated_at: new Date().toISOString() })
                .eq('id', invitationId);

            // Join guild
            await supabase
                .from('guild_members')
                .insert({
                    guild_id: guild.id,
                    user_id: user.id,
                    role: 'member'
                });

            // Update profile
            await supabase
                .from('profiles')
                .update({ guild_id: guild.id })
                .eq('id', user.id);

            // Increment member count
            await supabase
                .from('guilds')
                .update({ member_count: guild.member_count + 1 })
                .eq('id', guild.id);

            await loadData();
            return true;
        } catch (err: any) {
            console.error('Error accepting invitation:', err);
            setError(err.message || 'Erro ao aceitar convite');
            return false;
        }
    }, [user, loadData]);

    // Reject an invitation
    const rejectInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
        if (!user) return false;

        try {
            await supabase
                .from('guild_invitations')
                .update({ status: 'rejected', updated_at: new Date().toISOString() })
                .eq('id', invitationId);

            await loadData();
            return true;
        } catch (err: any) {
            console.error('Error rejecting invitation:', err);
            setError(err.message || 'Erro ao rejeitar convite');
            return false;
        }
    }, [user, loadData]);

    // Leave guild
    const leaveGuild = useCallback(async (): Promise<boolean> => {
        if (!user || !myGuild) return false;

        // Leader cannot leave, must delete guild
        if (isLeader) {
            setError('O líder não pode sair da guilda. Delete a guilda primeiro.');
            return false;
        }

        try {
            // Remove from guild_members
            await supabase
                .from('guild_members')
                .delete()
                .eq('guild_id', myGuild.id)
                .eq('user_id', user.id);

            // Update profile
            await supabase
                .from('profiles')
                .update({ guild_id: null })
                .eq('id', user.id);

            // Decrement member count
            await supabase
                .from('guilds')
                .update({ member_count: Math.max(0, myGuild.member_count - 1) })
                .eq('id', myGuild.id);

            setMyGuild(null);
            setGuildMembers([]);
            await loadData();
            return true;
        } catch (err) {
            console.error('Error leaving guild:', err);
            setError('Erro ao sair da guilda');
            return false;
        }
    }, [user, myGuild, isLeader, loadData]);

    // Delete guild (leader only)
    const deleteGuild = useCallback(async (): Promise<boolean> => {
        if (!user || !myGuild) return false;

        if (!isLeader) {
            setError('Apenas o líder pode deletar a guilda');
            return false;
        }

        try {
            // Update all members' profiles to remove guild_id
            const memberIds = guildMembers.map(m => m.user_id);
            await supabase
                .from('profiles')
                .update({ guild_id: null })
                .in('id', memberIds);

            // Delete all guild members
            await supabase
                .from('guild_members')
                .delete()
                .eq('guild_id', myGuild.id);

            // Delete all pending invitations
            await supabase
                .from('guild_invitations')
                .delete()
                .eq('guild_id', myGuild.id);

            // Delete guild
            await supabase
                .from('guilds')
                .delete()
                .eq('id', myGuild.id);

            setMyGuild(null);
            setGuildMembers([]);
            await loadData();
            return true;
        } catch (err) {
            console.error('Error deleting guild:', err);
            setError('Erro ao deletar guilda');
            return false;
        }
    }, [user, myGuild, isLeader, guildMembers, loadData]);

    // Toggle guild privacy (leader only)
    const toggleGuildPrivacy = useCallback(async (): Promise<boolean> => {
        if (!user || !myGuild) return false;

        if (!isLeader) {
            setError('Apenas o líder pode alterar a privacidade');
            return false;
        }

        try {
            const newIsPublic = !myGuild.is_public;
            await supabase
                .from('guilds')
                .update({ is_public: newIsPublic })
                .eq('id', myGuild.id);

            setMyGuild({ ...myGuild, is_public: newIsPublic });
            return true;
        } catch (err) {
            console.error('Error toggling privacy:', err);
            setError('Erro ao alterar privacidade');
            return false;
        }
    }, [user, myGuild, isLeader]);

    // Upload guild avatar (leader only)
    const uploadGuildAvatar = useCallback(async (file: File): Promise<boolean> => {
        if (!user || !myGuild) return false;

        if (!isLeader) {
            setError('Apenas o líder pode alterar a imagem da guilda');
            return false;
        }

        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                setError('Por favor, selecione uma imagem.');
                return false;
            }

            if (file.size > 2 * 1024 * 1024) { // 2MB
                setError('A imagem deve ter no máximo 2MB.');
                return false;
            }

            // Generate unique filename inside user's folder to satisfy RLS
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/guild_${myGuild.id}_${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage (using 'avatars' bucket, organization folder recommended but trying root or guild specific prefix)
            // Assuming 'avatars' bucket exists as used in user profile
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Add cache buster
            const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

            // Update guild record
            const { error: updateError } = await supabase
                .from('guilds')
                .update({ avatar_url: urlWithCacheBuster })
                .eq('id', myGuild.id);

            if (updateError) throw updateError;

            setMyGuild({ ...myGuild, avatar_url: urlWithCacheBuster });
            return true;
        } catch (err: any) {
            console.error('Error updating guild avatar:', err);
            setError(err.message || 'Erro ao atualizar imagem da guilda');
            return false;
        }
    }, [user, myGuild, isLeader]);

    // Contribute XP to guild (called when user gains XP)
    const contributeXP = useCallback(async (xpAmount: number) => {
        if (!user || !myGuild) return;

        try {
            // Update guild total
            await supabase
                .from('guilds')
                .update({ total_xp: myGuild.total_xp + xpAmount })
                .eq('id', myGuild.id);

            // Update member contribution
            await supabase
                .from('guild_members')
                .update({
                    contribution_xp: supabase.rpc('increment_contribution', {
                        xp: xpAmount,
                        gid: myGuild.id,
                        uid: user.id
                    })
                })
                .eq('guild_id', myGuild.id)
                .eq('user_id', user.id);

        } catch (err) {
            console.error('Error contributing XP:', err);
        }
    }, [user, myGuild]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        myGuild,
        guildMembers,
        leaderboard,
        pendingInvitations,
        loading,
        error,
        isLeader,
        createGuild,
        joinGuild,
        leaveGuild,
        deleteGuild,
        sendInvitation,
        acceptInvitation,
        rejectInvitation,
        toggleGuildPrivacy,
        uploadGuildAvatar,
        contributeXP,
        refresh: loadData,
        clearError,
    };
}
