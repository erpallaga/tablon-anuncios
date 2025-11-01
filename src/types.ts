export interface GridItem {
  id: string;
  title: string;
  icon: string;
  pdfUrl: string;
  order?: number; // Hacer opcional para permitir la creación sin especificar order
}

export interface MenuItem extends GridItem {}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPanelState {
  gridItems: GridItem[];
  announcements: Announcement[];
  isEditing: boolean;
  currentItem: GridItem | null;
  currentAnnouncement: Announcement | null;
}
