import { User, ContentItem, Ticket, RevenueData, Achievement } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Laura Pérez', email: 'laura@example.com', avatar: 'https://picsum.photos/id/64/100/100', status: 'active', daysSubscribed: 45, subscriptionTier: 'monthly', engagementScore: 85, lastActive: '2 min ago' },
  { id: '2', name: 'Tomás Gómez', email: 'tomas@example.com', avatar: 'https://picsum.photos/id/91/100/100', status: 'active', daysSubscribed: 12, subscriptionTier: 'quarterly', engagementScore: 92, lastActive: '1 hr ago' },
  { id: '3', name: 'Javier Ruiz', email: 'javier@example.com', avatar: 'https://picsum.photos/id/103/100/100', status: 'pending', daysSubscribed: 0, subscriptionTier: 'monthly', engagementScore: 10, lastActive: '1 day ago' },
  { id: '4', name: 'Andrea López', email: 'andrea@example.com', avatar: 'https://picsum.photos/id/129/100/100', status: 'inactive', daysSubscribed: 120, subscriptionTier: 'monthly', engagementScore: 30, lastActive: '5 days ago' },
  { id: '5', name: 'Sofía Martin', email: 'sofia@example.com', avatar: 'https://picsum.photos/id/237/100/100', status: 'active', daysSubscribed: 3, subscriptionTier: 'monthly', engagementScore: 78, lastActive: 'Just now' },
];

export const MOCK_CONTENT: ContentItem[] = [
  { 
    id: '1', 
    title: 'Welcome to Helen', 
    contentType: 'story',
    media: [{ type: 'video', url: 'https://picsum.photos/id/338/400/800' }],
    uploadDate: '2023-10-01', 
    releaseDay: 1, 
    unlockRule: { type: 'immediate' },
    likes: 1240, 
    commentsCount: 342, 
    topComment: "Love this vibe!" 
  },
  { 
    id: '2', 
    title: 'Morning Routine', 
    contentType: 'post',
    media: [
        { type: 'image', url: 'https://picsum.photos/id/400/400/300' },
        { type: 'image', url: 'https://picsum.photos/id/401/400/300' },
        { type: 'video', url: 'https://picsum.photos/id/402/400/300' }
    ],
    uploadDate: '2023-10-01', 
    releaseDay: 1, 
    unlockRule: { type: 'delay', value: '1h' },
    likes: 980, 
    commentsCount: 156, 
    topComment: "Need to try this." 
  },
  {
    id: 'chat1',
    title: 'Personal Welcome Audio',
    contentType: 'chat',
    media: [],
    uploadDate: '2023-10-01',
    releaseDay: 1,
    unlockRule: { type: 'delay', value: '2h' },
    likes: 0,
    commentsCount: 0,
    topComment: ""
  },
  {
    id: 'ab1',
    title: 'Cover Image A/B Test',
    contentType: 'post',
    media: [{ type: 'image', url: 'https://picsum.photos/id/1015/400/300' }], // Variant A
    mediaB: [{ type: 'image', url: 'https://picsum.photos/id/1016/400/300' }], // Variant B
    uploadDate: '2023-10-01',
    releaseDay: 1,
    unlockRule: { type: 'delay', value: '3h' },
    likes: 450,
    commentsCount: 20,
    isAbTest: true,
    abStats: {
        variantA_Likes: 150,
        variantB_Likes: 300,
        winner: 'B'
    }
  },
  { 
    id: '3', 
    title: 'Coffee Time', 
    contentType: 'story',
    media: [{ type: 'image', url: 'https://picsum.photos/id/435/400/800' }],
    uploadDate: '2023-10-02', 
    releaseDay: 2, 
    unlockRule: { type: 'fixed_time', value: '09:00' },
    likes: 850, 
    commentsCount: 89, 
    topComment: "Where is that mug from?" 
  },
  { 
    id: '4', 
    title: 'Workout Plan', 
    contentType: 'post',
    media: [{ type: 'image', url: 'https://picsum.photos/id/512/400/300' }],
    uploadDate: '2023-10-03', 
    releaseDay: 3, 
    unlockRule: { type: 'immediate' },
    likes: 2100, 
    commentsCount: 520, 
    topComment: "So intense but good." 
  },
  { 
    id: '5', 
    title: 'Special 45 Day Gift', 
    contentType: 'post',
    media: [{ type: 'video', url: 'https://picsum.photos/id/625/400/300' }],
    uploadDate: '2023-11-15', 
    releaseDay: 45, 
    unlockRule: { type: 'fixed_time', value: '18:00' },
    likes: 3200, 
    commentsCount: 890, 
    topComment: "Finally seeing this!" 
  },
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
    { id: '1', title: 'Primera Semana', description: 'Completaste los primeros 7 días de contenido.', icon: '🌱', triggerCondition: 'Day 7 Reached', usersUnlocked: 1240, reward: 'Pack de Stickers Exclusivos' },
    { id: '2', title: 'Súper Fan', description: 'Interactuaste con 50 publicaciones.', icon: '🔥', triggerCondition: '50 Interactions', usersUnlocked: 340, reward: 'Video de Saludo Personalizado' },
    { id: '3', title: 'Mes Completo', description: '30 días de suscripción activa.', icon: '🗓️', triggerCondition: 'Day 30 Reached', usersUnlocked: 890, reward: 'Descuento 10% Merch' },
];

export const MOCK_TICKETS: Ticket[] = [
  { 
    id: '101', 
    user: { name: 'Laura Pérez', avatar: 'https://picsum.photos/id/64/100/100' }, 
    subject: 'Problema con el pago', 
    preview: 'No pude renovar mi suscripción...', 
    status: 'open', 
    priority: 'high', 
    date: '10:30 AM',
    messages: [
        { id: '1', sender: 'user', text: 'Hola, intenté pagar con mi tarjeta pero rebotó.', timestamp: '10:30 AM' },
        { id: '2', sender: 'support', text: 'Hola Laura, revisemos eso. ¿Qué error te apareció?', timestamp: '10:32 AM' }
    ]
  },
  { 
    id: '102', 
    user: { name: 'Tomás Gómez', avatar: 'https://picsum.photos/id/91/100/100' }, 
    subject: 'Contenido no carga', 
    preview: 'El video del día 3 se queda...', 
    status: 'pending', 
    priority: 'normal', 
    date: 'Ayer',
    messages: []
  },
  { 
    id: '103', 
    user: { name: 'Javier Ruiz', avatar: 'https://picsum.photos/id/103/100/100' }, 
    subject: 'Duda sobre renovación', 
    preview: 'Quisiera cambiar al plan anual...', 
    status: 'resolved', 
    priority: 'low', 
    date: '2 Oct',
    messages: []
  },
];

export const MOCK_REVENUE_DATA: RevenueData[] = [
  { date: 'Lun', amount: 1200 },
  { date: 'Mar', amount: 1500 },
  { date: 'Mié', amount: 900 },
  { date: 'Jue', amount: 1800 },
  { date: 'Vie', amount: 2400 },
  { date: 'Sáb', amount: 3200 },
  { date: 'Dom', amount: 2800 },
];
