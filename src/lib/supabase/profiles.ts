import { supabase } from './client';
import type { Profile, UserRole } from '../../types';

function mapProfile(row: any): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    role: row.role as UserRole,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const profilesService = {
  async getOwnProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return mapProfile(data);
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapProfile);
  },

  async updateProfile(
    userId: string,
    updates: { role?: UserRole; displayName?: string; isActive?: boolean }
  ): Promise<void> {
    const updateData: any = {};
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
  },
};
