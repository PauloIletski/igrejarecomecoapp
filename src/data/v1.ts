export type VisibilityKey =
  | 'agenda'
  | 'eventos'
  | 'albuns'
  | 'oracoes'
  | 'contribuir'
  | 'localidades'
  | 'admin';

export type AgendaItem = {
  id: string;
  title: string;
  day: string;
  time: string;
  place: string;
  kind: string;
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  date: string;
  time: string;
  place: string;
  description: string;
  spots: number;
  registrations: number;
};

export type AlbumItem = {
  id: string;
  slug: string;
  title: string;
  date: string;
  coverUrl: string;
  photos: string[];
};

export type PrayerItem = {
  id: string;
  name: string;
  request: string;
  count: number;
};

export type LocationItem = {
  id: string;
  name: string;
  address: string;
  schedule: string;
  mapsUrl: string;
  whatsappUrl: string;
};

export const sectionVisibility: Record<VisibilityKey, boolean> = {
  agenda: true,
  eventos: true,
  albuns: true,
  oracoes: true,
  contribuir: true,
  localidades: true,
  admin: true,
};

export const agendaItems: AgendaItem[] = [
  {
    id: 'agenda-domingo',
    title: 'Culto da Familia',
    day: 'Domingo',
    time: '18:30',
    place: 'Templo sede',
    kind: 'Culto',
  },
  {
    id: 'agenda-quarta',
    title: 'Quarta de Oracao',
    day: 'Quarta',
    time: '20:00',
    place: 'Templo sede',
    kind: 'Oracao',
  },
  {
    id: 'agenda-jovens',
    title: 'Encontro de Jovens',
    day: 'Sabado',
    time: '19:30',
    place: 'Espaco Recomeço',
    kind: 'Ministerio',
  },
];

export const events: EventItem[] = [
  {
    id: 'evt-1',
    slug: 'conferencia-recomeco',
    title: 'Conferencia Recomeço',
    date: '24 ago',
    time: '19:30',
    place: 'Templo sede',
    description:
      'Noite de palavra, louvor e comunhao para fortalecer familias e novos comecos.',
    spots: 120,
    registrations: 87,
  },
  {
    id: 'evt-2',
    slug: 'acao-solidaria',
    title: 'Acao Solidaria',
    date: '31 ago',
    time: '09:00',
    place: 'Comunidade Jardim Esperanca',
    description:
      'Mobilizacao de voluntarios para atendimento, cesta basica e cuidado pastoral.',
    spots: 60,
    registrations: 34,
  },
];

export const albums: AlbumItem[] = [
  {
    id: 'alb-1',
    slug: 'batismo-2026',
    title: 'Batismo 2026',
    date: '12 jul',
    coverUrl:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    photos: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'alb-2',
    slug: 'culto-da-familia',
    title: 'Culto da Familia',
    date: '05 jul',
    coverUrl:
      'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=1200&q=80',
    photos: [
      'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];

export const prayers: PrayerItem[] = [
  {
    id: 'pr-1',
    name: 'Ana',
    request: 'Restauracao da familia e direcao em uma nova fase.',
    count: 18,
  },
  {
    id: 'pr-2',
    name: 'Carlos',
    request: 'Saude da mae e paz para tomar decisoes importantes.',
    count: 11,
  },
];

export const locations: LocationItem[] = [
  {
    id: 'loc-1',
    name: 'Igreja Recomeço - Sede',
    address: 'Av. Principal, 1000 - Centro',
    schedule: 'Dom 18:30 | Qua 20:00',
    mapsUrl: 'https://maps.google.com/?q=Igreja%20Recomeco',
    whatsappUrl: 'https://wa.me/5500000000000',
  },
];

export const donation = {
  pixKey: 'doacoes@igrejarecomeco.org',
  whatsappUrl: 'https://wa.me/5500000000000?text=Quero%20contribuir',
  note: 'Dizimos, ofertas e campanhas especiais em um fluxo sem dados sensiveis no app.',
};

export function findEvent(slug: string) {
  return events.find((event) => event.slug === slug);
}

export function findAlbum(slug: string) {
  return albums.find((album) => album.slug === slug);
}
