export interface GridItem {
  id: string;
  title: string;
  icon: string;
  fileUrl: string;
  fileType?: 'pdf' | 'image';
  order?: number; // Hacer opcional para permitir la creación sin especificar order
  // Al crearse, la Edge Function extract-assignments analiza el documento y
  // notifica a los usuarios asignados
  extractAssignments?: boolean;
  // Qué formato de documento analiza la función: cuadrante RSC de servicio del
  // campo o programa de la reunión Vida y Ministerio
  documentType?: 'field_service' | 'vmc_program';
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

export type UserRole = 'admin' | 'editor' | 'publicador';

export interface Profile {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
