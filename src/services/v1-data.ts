import {
  agendaItems as mockAgendaItems,
  albums as mockAlbums,
  donation as mockDonation,
  events as mockEvents,
  locations as mockLocations,
  prayers as mockPrayers,
  sectionVisibility as mockSectionVisibility,
  type AgendaItem,
  type AlbumItem,
  type EventItem,
  type LocationItem,
  type PrayerItem,
  type VisibilityKey,
} from '@/data/v1';
import { env } from '@/lib/env';
import { getSupabase, supabase } from '@/lib/supabase';

type UnknownRecord = Record<string, unknown>;

export type MaintenanceStatus = {
  enabled: boolean;
  title: string;
  message: string;
};

export type EventRegistrationInput = {
  eventId: string;
  name: string;
  email?: string;
  phone?: string;
};

export type PrayerRequestInput = {
  name?: string;
  request: string;
};

const visibilityMap: Partial<Record<string, VisibilityKey>> = {
  agenda: 'agenda',
  events: 'eventos',
  albums: 'albuns',
  prayer: 'oracoes',
  public_prayers: 'oracoes',
  donations: 'contribuir',
  tithes_offerings: 'contribuir',
  locations: 'localidades',
};

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function text(row: UnknownRecord, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function numberValue(row: UnknownRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function booleanValue(row: UnknownRecord, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return fallback;
}

function list(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function dateLabel(row: UnknownRecord) {
  return text(row, ['date_label', 'event_date_label', 'display_date', 'date'], text(row, ['created_at']));
}

function timeLabel(row: UnknownRecord) {
  return text(row, ['time_label', 'start_time', 'time']);
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  return error?.code === '42P01' || error?.code === '42501';
}

export async function fetchSectionVisibility() {
  if (!supabase) {
    return mockSectionVisibility;
  }

  const { data, error } = await supabase.from('site_section_visibility').select('*');
  if (error) {
    if (isMissingTable(error)) {
      return mockSectionVisibility;
    }
    throw error;
  }

  return (data ?? []).reduce<Record<VisibilityKey, boolean>>(
    (visibility, item) => {
      const row = asRecord(item);
      const key = visibilityMap[text(row, ['section_key', 'key', 'section'])];
      if (key) {
        visibility[key] = booleanValue(row, ['is_visible', 'visible', 'is_enabled'], true);
      }
      return visibility;
    },
    { ...mockSectionVisibility },
  );
}

export async function fetchMaintenanceStatus(): Promise<MaintenanceStatus> {
  if (!supabase) {
    return { enabled: false, title: '', message: '' };
  }

  const { data, error } = await supabase.from('site_maintenance_settings').select('*').limit(1).maybeSingle();
  if (error) {
    if (isMissingTable(error)) {
      return { enabled: false, title: '', message: '' };
    }
    throw error;
  }

  const row = asRecord(data);
  return {
    enabled: booleanValue(row, ['is_enabled', 'enabled', 'published'], false),
    title: text(row, ['title'], 'Em manutencao'),
    message: text(row, ['message', 'description'], 'Voltamos em breve.'),
  };
}

export async function fetchAgendaItems(): Promise<AgendaItem[]> {
  if (!supabase) {
    return mockAgendaItems;
  }

  const { data, error } = await supabase
    .from('agenda_items')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    if (isMissingTable(error)) {
      return mockAgendaItems;
    }
    throw error;
  }

  return (data ?? []).map((item): AgendaItem => {
    const row = asRecord(item);
    return {
      id: text(row, ['id'], crypto.randomUUID()),
      title: text(row, ['title', 'name'], 'Agenda'),
      day: text(row, ['day_label', 'day_name', 'day_of_week'], 'Dia'),
      time: text(row, ['start_time', 'time'], ''),
      place: text(row, ['place', 'location', 'address'], ''),
      kind: text(row, ['kind', 'type', 'category'], 'Culto'),
    };
  });
}

export async function fetchEvents(): Promise<EventItem[]> {
  if (!supabase) {
    return mockEvents;
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .or('status.eq.published,is_published.eq.true')
    .order('event_date', { ascending: true });

  if (error) {
    if (isMissingTable(error)) {
      return mockEvents;
    }
    throw error;
  }

  return (data ?? []).map(toEventItem);
}

export async function fetchEventBySlug(slug: string): Promise<EventItem | undefined> {
  if (!supabase) {
    return mockEvents.find((event) => event.slug === slug);
  }

  const { data, error } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
  if (error) {
    if (isMissingTable(error)) {
      return mockEvents.find((event) => event.slug === slug);
    }
    throw error;
  }

  return data ? toEventItem(data) : undefined;
}

function toEventItem(item: unknown): EventItem {
  const row = asRecord(item);
  return {
    id: text(row, ['id'], crypto.randomUUID()),
    slug: text(row, ['slug'], text(row, ['id'])),
    title: text(row, ['title', 'name'], 'Evento'),
    date: dateLabel(row),
    time: timeLabel(row),
    place: text(row, ['place', 'location', 'address'], ''),
    description: text(row, ['description', 'summary'], ''),
    spots: numberValue(row, ['capacity', 'spots', 'max_registrations'], 0),
    registrations: numberValue(row, ['registrations_count', 'registration_count', 'registrations'], 0),
  };
}

export async function registerForEvent(input: EventRegistrationInput) {
  const client = getSupabase();
  const { error } = await client.from('event_registrations').insert({
    event_id: input.eventId,
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
  });

  if (error) {
    throw error;
  }
}

export async function fetchAlbums(): Promise<AlbumItem[]> {
  if (!supabase || !env.isCloudinaryConfigured) {
    return mockAlbums;
  }

  const { data, error } = await supabase.functions.invoke('albums-galleries');
  if (error) {
    throw error;
  }

  const folders = Array.isArray(data) ? data : list(asRecord(data).galleries);
  return folders.map((folder, index): AlbumItem => {
    const row = asRecord(folder);
    const slug = text(row, ['slug'], `album-${index + 1}`);
    const publicId = text(asRecord(row.thumbnail), ['public_id']);
    const format = text(asRecord(row.thumbnail), ['format'], 'jpg');
    const coverUrl = publicId ? cloudinaryImageUrl(publicId, format) : mockAlbums[0]?.coverUrl ?? '';

    return {
      id: slug,
      slug,
      title: slug.replace(/-/g, ' '),
      date: text(row, ['createdAt', 'created_at'], ''),
      coverUrl,
      photos: coverUrl ? [coverUrl] : [],
    };
  });
}

export async function fetchAlbumBySlug(slug: string): Promise<AlbumItem | undefined> {
  if (!supabase || !env.isCloudinaryConfigured) {
    return mockAlbums.find((album) => album.slug === slug);
  }

  const { data, error } = await supabase.functions.invoke('albums-gallery-images', {
    body: { slug },
  });
  if (error) {
    throw error;
  }

  const payload = asRecord(data);
  const rawImages: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(payload.images)
      ? payload.images
      : [];
  const photos = rawImages
    .map((image) => {
      const row = asRecord(image);
      return cloudinaryImageUrl(text(row, ['public_id']), text(row, ['format'], 'jpg'));
    })
    .filter(Boolean);

  return {
    id: slug,
    slug,
    title: slug.replace(/-/g, ' '),
    date: '',
    coverUrl: photos[0] ?? '',
    photos,
  };
}

function cloudinaryImageUrl(publicId: string, format = 'jpg') {
  if (!publicId || !env.cloudinaryCloudName) {
    return '';
  }

  return `https://res.cloudinary.com/${env.cloudinaryCloudName}/image/upload/f_auto,q_auto/${publicId}.${format}`;
}

export async function fetchPrayers(): Promise<PrayerItem[]> {
  if (!supabase) {
    return mockPrayers;
  }

  const { data, error } = await supabase
    .from('prayer_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTable(error)) {
      return mockPrayers;
    }
    throw error;
  }

  return (data ?? []).map((item): PrayerItem => {
    const row = asRecord(item);
    return {
      id: text(row, ['id'], crypto.randomUUID()),
      name: booleanValue(row, ['is_anonymous', 'anonymous'], false) ? 'Anonimo' : text(row, ['name'], 'Anonimo'),
      request: text(row, ['request', 'message', 'body'], ''),
      count: numberValue(row, ['praying_count', 'prayer_count', 'count'], 0),
    };
  });
}

export async function createPrayerRequest(input: PrayerRequestInput) {
  const client = getSupabase();
  const { error } = await client.from('prayer_requests').insert({
    name: input.name || null,
    request: input.request,
    is_anonymous: !input.name,
  });

  if (error) {
    throw error;
  }
}

export async function togglePrayerRecord(prayerRequestId: string, identity: string) {
  const client = getSupabase();
  const { error } = await client.from('prayer_praying_records').insert({
    prayer_request_id: prayerRequestId,
    identity,
  });

  if (error) {
    throw error;
  }
}

export async function fetchDonation() {
  if (!supabase) {
    return mockDonation;
  }

  const { data, error } = await supabase
    .from('tithes_offerings_methods')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) {
      return mockDonation;
    }
    throw error;
  }

  const row = asRecord(data);
  return {
    pixKey: text(row, ['pix_key', 'key'], mockDonation.pixKey),
    whatsappUrl: text(row, ['whatsapp_url'], mockDonation.whatsappUrl),
    note: text(row, ['description', 'note'], mockDonation.note),
  };
}

export async function fetchLocations(): Promise<LocationItem[]> {
  if (!supabase) {
    return mockLocations;
  }

  const { data, error } = await supabase
    .from('church_locations')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    if (isMissingTable(error)) {
      return mockLocations;
    }
    throw error;
  }

  return (data ?? []).map((item): LocationItem => {
    const row = asRecord(item);
    return {
      id: text(row, ['id'], crypto.randomUUID()),
      name: text(row, ['name', 'title'], 'Localidade'),
      address: text(row, ['address'], ''),
      schedule: text(row, ['schedule', 'opening_hours', 'service_times'], ''),
      mapsUrl: text(row, ['maps_url', 'map_url'], `https://maps.google.com/?q=${encodeURIComponent(text(row, ['address']))}`),
      whatsappUrl: text(row, ['whatsapp_url', 'whatsapp'], ''),
    };
  });
}
