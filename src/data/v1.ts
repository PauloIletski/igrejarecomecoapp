export type VisibilityKey =
  | 'agenda'
  | 'eventos'
  | 'albuns'
  | 'oracoes'
  | 'contribuir'
  | 'localidades';

export type AgendaItem = {
  id: string;
  title: string;
  day: string;
  dayOfWeek: number;
  time: string;
  startTime: string;
  place: string;
  kind: string;
  posterUrl?: string;
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  date: string;
  time: string;
  place: string;
  description: string;
  imageUrl?: string;
  detailContent?: string;
  detailPageEnabled: boolean;
  registrationFormEnabled: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  isPaid: boolean;
  investment?: string;
  paymentMethods?: string;
  spots: number;
  registrations: number;
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

export type TithesOfferingMethod = {
  id: string;
  title: string;
  description?: string;
  recipientName?: string;
  pixKey?: string;
  bankInfo?: string;
  qrCodeUrl?: string;
  bibleVerse?: string;
  buttonLabel: string;
  whatsappUrl?: string;
  isFeatured: boolean;
};

export type DonationItem = {
  id: string;
  name: string;
  priority: number;
};

export const sectionVisibility: Record<VisibilityKey, boolean> = {
  agenda: true,
  eventos: true,
  albuns: true,
  oracoes: true,
  contribuir: true,
  localidades: true,
};

export const agendaItems: AgendaItem[] = [
  {
    id: 'agenda-domingo',
    title: 'Culto da Familia',
    day: 'Domingo',
    dayOfWeek: 0,
    time: '18:30',
    startTime: '18:30',
    place: 'Templo sede',
    kind: 'Culto',
  },
  {
    id: 'agenda-quarta',
    title: 'Quarta de Oracao',
    day: 'Quarta',
    dayOfWeek: 3,
    time: '20:00',
    startTime: '20:00',
    place: 'Templo sede',
    kind: 'Oracao',
  },
  {
    id: 'agenda-jovens',
    title: 'Encontro de Jovens',
    day: 'Sabado',
    dayOfWeek: 6,
    time: '19:30',
    startTime: '19:30',
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
    imageUrl:
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
    detailContent: 'Inscricoes e contato disponiveis para mais informacoes.',
    detailPageEnabled: true,
    registrationFormEnabled: true,
    ctaLabel: 'Contato',
    ctaUrl: 'https://wa.me/5500000000000',
    isPaid: false,
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
    detailPageEnabled: true,
    registrationFormEnabled: false,
    isPaid: false,
    spots: 60,
    registrations: 34,
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

export const tithesOfferingMethods: TithesOfferingMethod[] = [
  {
    id: 'pix-recomeco',
    title: 'Pix da igreja',
    description: 'Contribua com dizimos e ofertas usando a chave oficial da igreja.',
    recipientName: 'Igreja Recomeco',
    pixKey: 'doacoes@igrejarecomeco.org',
    bibleVerse: 'Trazei todos os dizimos a casa do tesouro. Malaquias 3:10',
    buttonLabel: 'Copiar chave PIX',
    whatsappUrl: 'https://wa.me/5500000000000?text=Quero%20contribuir',
    isFeatured: true,
  },
];

export const donationItems: DonationItem[] = [
  { id: 'donation-arroz', name: 'Arroz', priority: 10 },
  { id: 'donation-feijao', name: 'Feijao', priority: 10 },
  { id: 'donation-oleo', name: 'Oleo de cozinha', priority: 9 },
  { id: 'donation-leite', name: 'Leite em po', priority: 8 },
  { id: 'donation-higiene', name: 'Produtos de higiene', priority: 8 },
];

export function findEvent(slug: string) {
  return events.find((event) => event.slug === slug);
}

