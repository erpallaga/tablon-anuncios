export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  pdfUrl?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
}
