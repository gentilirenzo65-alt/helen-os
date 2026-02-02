import { Delivery } from './types';

export const ACTIVATION_DATE = new Date().toISOString(); // Default fallback, actual logic moved to page.tsx

export const INITIAL_DELIVERIES: Delivery[] = [
  {
    id: '1',
    order: 0,
    title: 'La Bienvenida',
    helenNote: 'Empecemos este viaje con algo suave...',
    media: [
      { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1000&auto=format&fit=crop', type: 'image' }
    ],
    unlockAfterMinutes: 0,
    preUnlockView: 'blurred',
    showTimer: false
  },
  {
    id: '2',
    order: 1,
    title: 'Luz de Mañana',
    helenNote: 'Recién despertada pensando en ti.',
    media: [
      { url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop', type: 'image' }
    ],
    unlockAfterMinutes: 20,
    preUnlockView: 'blurred',
    showTimer: true
  },
  {
    id: '3',
    order: 2,
    title: 'Transparencias',
    helenNote: 'Hay cosas que no se pueden ocultar.',
    media: [
      { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop', type: 'image' },
      { url: 'https://www.w3schools.com/html/mov_bbb.mp4', type: 'video' } // Ejemplo de video
    ],
    unlockAfterMinutes: 45,
    preUnlockView: 'blurred',
    showTimer: true
  },
  {
    id: '4',
    order: 3,
    title: 'Sombras Íntimas',
    helenNote: 'Me gusta jugar con la luz... ¿y a ti?',
    media: [{ url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop', type: 'image' }],
    unlockAfterMinutes: 90,
    preUnlockView: 'blurred',
    showTimer: true
  },
  {
    id: '5',
    order: 4,
    title: 'Espera en Rojo',
    helenNote: 'El color de la pasión, lista para ti.',
    media: [{ url: 'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?q=80&w=1000&auto=format&fit=crop', type: 'image' }],
    unlockAfterMinutes: 150,
    preUnlockView: 'blurred',
    showTimer: true
  },
  {
    id: '6',
    order: 5,
    title: 'Tentación Prohibida',
    helenNote: 'Esto es solo para tus ojos.',
    media: [{ url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000&auto=format&fit=crop', type: 'image' }],
    unlockAfterMinutes: 240,
    preUnlockView: 'blurred',
    showTimer: true
  }
];
