export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'active' | 'inactive' | 'pending';
  daysSubscribed: number;
  subscriptionTier: 'monthly' | 'quarterly' | 'annual';
  engagementScore: number; // 0-100
  lastActive: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface ContentItem {
  id: string;
  title: string;
  contentType: 'post' | 'story' | 'chat';
  media: MediaItem[];
  uploadDate: string;
  releaseDay: number;
  dayOffset?: number; // Alternative name from DB
  unlockHour?: number; // Hour offset for unlock timing
  unlockRule: {
    type: 'immediate' | 'delay' | 'fixed_time';
    value?: string; // e.g., "2h" or "14:00"
  };
  likes: number;
  commentsCount: number;
  topComment?: string;
  // A/B Testing fields
  isAbTest?: boolean;
  abStats?: {
    variantA_Likes: number;
    variantB_Likes: number;
    winner?: 'A' | 'B' | null;
  };
  mediaB?: MediaItem[]; // Second set of media for variant B
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // URL or emoji
  triggerCondition: string; // e.g., "Complete Day 7"
  usersUnlocked: number;
  reward: string; // New field for the specific content reward
}

export interface Ticket {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  subject: string;
  preview: string;
  status: 'open' | 'resolved' | 'pending';
  priority: 'low' | 'normal' | 'high';
  date: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  text: string;
  timestamp: string;
}

export interface RevenueData {
  date: string;
  amount: number;
}
