
export type ContentType = 'image' | 'video' | 'text';

export interface MediaItem {
  url: string;
  type: ContentType;
}

export interface Delivery {
  id: string;
  order: number;
  title: string;
  helenNote: string;
  media: MediaItem[]; // Soporte para carrusel
  unlockAfterMinutes: number; 
  preUnlockView: 'none' | 'title' | 'hint' | 'blurred';
  hintText?: string;
  showTimer: boolean;
}

export interface User {
  email: string;
  isActive: boolean;
  activationDate: string; 
}

export interface Interaction {
  deliveryId: string;
  type: 'note' | 'reaction';
  content?: string;
  timestamp: string;
}

export interface AppState {
  deliveries: Delivery[];
  interactions: Interaction[];
  activationDate: string;
}
