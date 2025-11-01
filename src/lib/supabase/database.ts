import { supabase } from './client';
import type { GridItem, Announcement } from '../../types';

// Helper to convert database row to GridItem
function mapGridItem(row: any): GridItem {
  return {
    id: row.id,
    title: row.title,
    icon: row.icon,
    pdfUrl: row.pdf_url,
    order: row.order ?? 0,
  };
}

// Helper to convert database row to Announcement
function mapAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    isActive: row.is_active ?? true,
    order: row.order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GridItems operations
export const gridItemsService = {
  async getAll(): Promise<GridItem[]> {
    const { data, error } = await supabase
      .from('grid_items')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapGridItem);
  },

  async create(item: Omit<GridItem, 'id'>): Promise<GridItem> {
    const { data, error } = await supabase
      .from('grid_items')
      .insert([{
        title: item.title,
        icon: item.icon,
        pdf_url: item.pdfUrl,
        order: item.order ?? 0,
      }])
      .select()
      .single();

    if (error) throw error;
    return mapGridItem(data);
  },

  async update(id: string, updates: Partial<GridItem>): Promise<GridItem> {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.pdfUrl !== undefined) updateData.pdf_url = updates.pdfUrl;
    if (updates.order !== undefined) updateData.order = updates.order;

    const { data, error } = await supabase
      .from('grid_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapGridItem(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('grid_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Announcements operations
export const announcementsService = {
  async getAll(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapAnnouncement);
  },

  async getActive(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapAnnouncement);
  },

  async create(announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert([{
        title: announcement.title,
        content: announcement.content,
        is_active: true,
        order: announcement.order ?? 0,
      }])
      .select()
      .single();

    if (error) throw error;
    return mapAnnouncement(data);
  },

  async update(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.order !== undefined) updateData.order = updates.order;

    const { data, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapAnnouncement(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

