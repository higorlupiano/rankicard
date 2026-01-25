import { useState, useEffect, useCallback } from 'react';
import { supabase, ShopItem, UserItem, Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useShop(user: User | null, profile: Profile | null) {
    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [userItems, setUserItems] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

    // Load shop items
    useEffect(() => {
        loadShopItems();
    }, []);

    // Load user items when user changes
    useEffect(() => {
        if (user) {
            loadUserItems(user.id);
        } else {
            setUserItems([]);
        }
    }, [user]);

    const loadShopItems = async () => {
        const { data, error } = await supabase
            .from('shop_items')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });

        if (!error && data) {
            setShopItems(data);
        }
        setLoading(false);
    };

    const loadUserItems = async (userId: string) => {
        const { data, error } = await supabase
            .from('user_items')
            .select('*, item:shop_items(*)')
            .eq('user_id', userId);

        if (!error && data) {
            setUserItems(data);
        }
    };

    const purchaseItem = useCallback(async (item: ShopItem): Promise<boolean> => {
        if (!user || !profile) return false;

        // Check if user has enough gold
        if (profile.gold < item.price) {
            setPurchaseMessage('❌ Gold insuficiente!');
            setTimeout(() => setPurchaseMessage(null), 3000);
            return false;
        }

        // Check minimum level
        if (profile.current_level < item.min_level) {
            setPurchaseMessage(`❌ Requer nível ${item.min_level}`);
            setTimeout(() => setPurchaseMessage(null), 3000);
            return false;
        }

        // Calculate expiration if item has duration
        let expiresAt: string | null = null;
        if (item.effect_duration) {
            const expDate = new Date();
            expDate.setMinutes(expDate.getMinutes() + item.effect_duration);
            expiresAt = expDate.toISOString();
        }

        // Deduct gold
        const { error: goldError } = await supabase
            .from('profiles')
            .update({ gold: profile.gold - item.price })
            .eq('id', user.id);

        if (goldError) {
            setPurchaseMessage('❌ Erro ao processar compra');
            return false;
        }

        // Add item to user inventory
        const { error: itemError } = await supabase
            .from('user_items')
            .insert({
                user_id: user.id,
                item_id: item.id,
                quantity: 1,
                equipped: false,
                expires_at: expiresAt
            });

        if (itemError) {
            // Rollback gold deduction
            await supabase
                .from('profiles')
                .update({ gold: profile.gold })
                .eq('id', user.id);
            setPurchaseMessage('❌ Erro ao adicionar item');
            return false;
        }

        setPurchaseMessage(`✅ ${item.name} comprado!`);
        setTimeout(() => setPurchaseMessage(null), 3000);

        // Reload user items
        loadUserItems(user.id);
        return true;
    }, [user, profile]);

    const toggleEquip = useCallback(async (userItemId: string, currentlyEquipped: boolean): Promise<boolean> => {
        if (!user) return false;

        const { error } = await supabase
            .from('user_items')
            .update({ equipped: !currentlyEquipped })
            .eq('id', userItemId)
            .eq('user_id', user.id);

        if (!error) {
            loadUserItems(user.id);
            return true;
        }
        return false;
    }, [user]);

    const getActiveBoost = (): { multiplier: number; expiresAt: Date } | null => {
        const now = new Date();
        const boosts = userItems.filter(ui =>
            ui.item?.effect_type === 'xp_multiplier' &&
            ui.expires_at &&
            new Date(ui.expires_at) > now
        );

        if (boosts.length === 0) return null;

        // Return the highest active boost
        const bestBoost = boosts.reduce((max, boost) => {
            const mult = parseFloat(boost.item?.effect_value || '1');
            return mult > max.mult ? { mult, boost } : max;
        }, { mult: 0, boost: boosts[0] });

        return {
            multiplier: bestBoost.mult,
            expiresAt: new Date(bestBoost.boost.expires_at!)
        };
    };

    const getEquippedBadges = (): UserItem[] => {
        return userItems.filter(ui =>
            ui.item?.effect_type === 'badge' && ui.equipped
        );
    };

    const getEquippedTitle = (): string | null => {
        const title = userItems.find(ui =>
            ui.item?.effect_type === 'title' && ui.equipped
        );
        return title?.item?.effect_value || null;
    };

    const canAfford = (item: ShopItem): boolean => {
        return (profile?.gold || 0) >= item.price;
    };

    const meetsLevelRequirement = (item: ShopItem): boolean => {
        return (profile?.current_level || 1) >= item.min_level;
    };

    const ownsItem = (itemId: string): boolean => {
        return userItems.some(ui => ui.item_id === itemId);
    };

    return {
        shopItems,
        userItems,
        loading,
        purchaseMessage,
        purchaseItem,
        toggleEquip,
        getActiveBoost,
        getEquippedBadges,
        getEquippedTitle,
        canAfford,
        meetsLevelRequirement,
        ownsItem,
        refreshItems: () => user && loadUserItems(user.id),
    };
}
