import {
  agendaItems as mockAgendaItems,
  donationItems as mockDonationItems,
  events as mockEvents,
  locations as mockLocations,
  prayers as mockPrayers,
  sectionVisibility as mockSectionVisibility,
  tithesOfferingMethods as mockTithesOfferingMethods,
  type AgendaItem,
  type DonationItem,
  type EventItem,
  type LocationItem,
  type PrayerItem,
  type TithesOfferingMethod,
  type VisibilityKey,
} from '@/data/v1';
import { getSupabase, supabase } from '@/lib/supabase';

type UnknownRecord = Record<string, unknown>;

export type MaintenanceStatus = {
  enabled: boolean;
  title: string;
  message: string;
};

export type EventRegistrationInput = {
  eventId: string;
  eventTitle: string;
  fullName: string;
  whatsapp: string;
  email?: string;
};

export type PrayerRequestInput = {
  name?: string;
  phone?: string;
  email?: string;
  request: string;
  isAnonymous: boolean;
  allowPublic: boolean;
};

export type DonationPledgeInput = {
  name: string;
  phone: string;
  email?: string;
  items: string;
  quantityNote?: string;
  plannedDate?: string;
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

function rowId(row: UnknownRecord, fallback: string) {
  return text(row, ['id'], fallback);
}

function dayLabel(value: unknown) {
  const days = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
  if (typeof value === 'number') {
    return days[value] ?? 'Dia';
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) {
      return days[parsed] ?? value;
    }
    return value;
  }

  return 'Dia';
}

function dayNumber(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return Math.min(Math.max(value, 0), 6);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) {
      return Math.min(Math.max(parsed, 0), 6);
    }
  }

  return 0;
}

function timeText(value: string) {
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value.slice(0, 5);
  }

  return value;
}

function dateLabel(row: UnknownRecord) {
  const explicit = text(row, ['date_label', 'event_date_label', 'display_date', 'date']);
  const date = explicit || text(row, ['starts_at', 'created_at']);
  if (!date) {
    return '';
  }

  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(parsed);
  }

  return date;
}

function timeLabel(row: UnknownRecord) {
  const explicit = text(row, ['time_label', 'start_time', 'time']);
  const date = explicit || text(row, ['starts_at']);
  if (!date) {
    return '';
  }

  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(parsed);
  }

  return date;
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
    enabled: booleanValue(row, ['is_active', 'is_enabled', 'enabled', 'published'], false),
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
    .select('id,day_of_week,start_time,end_time,title,description,location,is_active,sort_order,poster_url')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    if (isMissingTable(error)) {
      return mockAgendaItems;
    }
    throw error;
  }

  return (data ?? []).map((item, index): AgendaItem => {
    const row = asRecord(item);
    return {
      id: rowId(row, `agenda-${index + 1}`),
      title: text(row, ['title', 'name'], 'Agenda'),
      day: text(row, ['day_label', 'day_name']) || dayLabel(row.day_of_week),
      dayOfWeek: dayNumber(row.day_of_week),
      time: timeText(text(row, ['start_time', 'time'])),
      startTime: timeText(text(row, ['start_time', 'time'])),
      place: text(row, ['place', 'location', 'address'], ''),
      kind: text(row, ['kind', 'type', 'category'], 'Culto'),
      posterUrl: text(row, ['poster_url']) || undefined,
    };
  });
}

export async function fetchEvents(): Promise<EventItem[]> {
  if (!supabase) {
    return mockEvents;
  }

  const { data, error } = await supabase
    .from('events')
    .select(
      [
        'id',
        'title',
        'description',
        'starts_at',
        'ends_at',
        'location',
        'image_url',
        'is_published',
        'detail_page_enabled',
        'detail_hero_image_url',
        'detail_content',
        'cta_label',
        'cta_url',
        'secondary_cta_label',
        'secondary_cta_url',
        'registration_form_enabled',
        'is_paid',
        'investment',
        'payment_methods',
      ].join(','),
    )
    .eq('is_published', true)
    .order('starts_at', { ascending: true });

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

  const { data, error } = await supabase
    .from('events')
    .select(
      [
        'id',
        'title',
        'description',
        'starts_at',
        'ends_at',
        'location',
        'image_url',
        'is_published',
        'detail_page_enabled',
        'detail_hero_image_url',
        'detail_content',
        'cta_label',
        'cta_url',
        'secondary_cta_label',
        'secondary_cta_url',
        'registration_form_enabled',
        'is_paid',
        'investment',
        'payment_methods',
      ].join(','),
    )
    .eq('id', slug)
    .eq('is_published', true)
    .maybeSingle();
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
    id: rowId(row, `event-${text(row, ['starts_at', 'title'], Date.now().toString())}`),
    slug: text(row, ['slug'], text(row, ['id'])),
    title: text(row, ['title', 'name'], 'Evento'),
    date: dateLabel(row),
    time: timeLabel(row),
    place: text(row, ['place', 'location', 'address'], ''),
    description: text(row, ['description', 'summary'], ''),
    imageUrl: text(row, ['detail_hero_image_url', 'image_url']) || undefined,
    detailContent: text(row, ['detail_content']) || undefined,
    detailPageEnabled: booleanValue(row, ['detail_page_enabled'], false),
    registrationFormEnabled: booleanValue(row, ['registration_form_enabled'], false),
    ctaLabel: text(row, ['cta_label']) || undefined,
    ctaUrl: text(row, ['cta_url']) || undefined,
    secondaryCtaLabel: text(row, ['secondary_cta_label']) || undefined,
    secondaryCtaUrl: text(row, ['secondary_cta_url']) || undefined,
    isPaid: booleanValue(row, ['is_paid'], false),
    investment: text(row, ['investment']) || undefined,
    paymentMethods: text(row, ['payment_methods']) || undefined,
    spots: numberValue(row, ['capacity', 'spots', 'max_registrations'], 0),
    registrations: numberValue(row, ['registrations_count', 'registration_count', 'registrations'], 0),
  };
}

export async function registerForEvent(input: EventRegistrationInput) {
  const client = getSupabase();
  const { error } = await client.from('event_registrations').insert({
    event_id: input.eventId,
    event_title: input.eventTitle,
    full_name: input.fullName,
    email: input.email || null,
    whatsapp: input.whatsapp,
  });

  if (error) {
    throw error;
  }
}

export async function fetchPrayers(): Promise<PrayerItem[]> {
  if (!supabase) {
    return mockPrayers;
  }

  const { data, error } = await supabase
    .from('prayer_requests')
    .select('id,name,message,is_anonymous,allow_public,status,created_at')
    .eq('allow_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTable(error)) {
      return mockPrayers;
    }
    throw error;
  }

  const prayerIds = (data ?? [])
    .map((item) => text(asRecord(item), ['id']))
    .filter(Boolean);
  const countsByPrayerId = new Map<string, number>();

  if (prayerIds.length) {
    const { data: records, error: recordsError } = await supabase
      .from('prayer_praying_records')
      .select('prayer_request_id')
      .in('prayer_request_id', prayerIds);

    if (recordsError && !isMissingTable(recordsError)) {
      throw recordsError;
    }

    for (const record of records ?? []) {
      const prayerRequestId = text(asRecord(record), ['prayer_request_id']);
      if (prayerRequestId) {
        countsByPrayerId.set(prayerRequestId, (countsByPrayerId.get(prayerRequestId) ?? 0) + 1);
      }
    }
  }

  return (data ?? []).map((item, index): PrayerItem => {
    const row = asRecord(item);
    const id = rowId(row, `prayer-${index + 1}`);
    return {
      id,
      name: booleanValue(row, ['is_anonymous', 'anonymous'], false) ? 'Anonimo' : text(row, ['name'], 'Anonimo'),
      request: text(row, ['request', 'message', 'body'], ''),
      count: countsByPrayerId.get(id) ?? numberValue(row, ['praying_count', 'prayer_count', 'count'], 0),
    };
  });
}

export async function createPrayerRequest(input: PrayerRequestInput) {
  const client = getSupabase();
  const { error } = await client.from('prayer_requests').insert({
    name: input.isAnonymous ? null : input.name || null,
    email: input.email || null,
    phone: input.phone || null,
    message: input.request,
    is_anonymous: input.isAnonymous,
    allow_public: input.allowPublic,
  });

  if (error) {
    throw error;
  }
}

export async function togglePrayerRecord(prayerRequestId: string, identity: string, shouldPray: boolean) {
  const client = getSupabase();
  const query = client.from('prayer_praying_records');
  const { error } = shouldPray
    ? await query.upsert(
        {
          prayer_request_id: prayerRequestId,
          user_session_id: identity,
        },
        { onConflict: 'prayer_request_id,user_session_id', ignoreDuplicates: true },
      )
    : await query.delete().eq('prayer_request_id', prayerRequestId).eq('user_session_id', identity);

  if (error) {
    throw error;
  }
}

export async function fetchTithesOfferingsMethods(): Promise<TithesOfferingMethod[]> {
  if (!supabase) {
    return mockTithesOfferingMethods;
  }

  const { data, error } = await supabase
    .from('tithes_offerings_methods')
    .select(
      [
        'id',
        'title',
        'description',
        'recipient_name',
        'pix_key',
        'bank_info',
        'qr_code_url',
        'bible_verse',
        'button_label',
        'is_featured',
        'is_active',
        'sort_order',
      ].join(','),
    )
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true });

  if (error) {
    if (isMissingTable(error)) {
      return mockTithesOfferingMethods;
    }
    throw error;
  }

  return (data ?? []).map(toTithesOfferingMethod);
}

function toTithesOfferingMethod(item: unknown): TithesOfferingMethod {
  const row = asRecord(item);
  return {
    id: rowId(row, `tithe-${text(row, ['title'], Date.now().toString())}`),
    title: text(row, ['title'], 'Metodo de contribuicao'),
    description: text(row, ['description', 'note']) || undefined,
    recipientName: text(row, ['recipient_name']) || undefined,
    pixKey: text(row, ['pix_key', 'key']) || undefined,
    bankInfo: text(row, ['bank_info']) || undefined,
    qrCodeUrl: text(row, ['qr_code_url']) || undefined,
    bibleVerse: text(row, ['bible_verse']) || undefined,
    buttonLabel: text(row, ['button_label'], 'Copiar chave PIX'),
    whatsappUrl: text(row, ['whatsapp_url']) || undefined,
    isFeatured: booleanValue(row, ['is_featured'], false),
  };
}

export async function fetchDonationItems(): Promise<DonationItem[]> {
  if (!supabase) {
    return mockDonationItems;
  }

  const { data, error } = await supabase
    .from('donation_items')
    .select('id,name,priority,is_active')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    if (isMissingTable(error)) {
      return mockDonationItems;
    }
    throw error;
  }

  return (data ?? []).map((item, index): DonationItem => {
    const row = asRecord(item);
    return {
      id: rowId(row, `donation-item-${index + 1}`),
      name: text(row, ['name'], 'Item'),
      priority: numberValue(row, ['priority'], 0),
    };
  });
}

export async function createDonationPledge(input: DonationPledgeInput) {
  const client = getSupabase();
  const { error } = await client.from('donation_pledges').insert({
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    items: input.items,
    quantity_note: input.quantityNote || null,
    planned_date: input.plannedDate || null,
  });

  if (error) {
    throw error;
  }
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

  return (data ?? []).map((item, index): LocationItem => {
    const row = asRecord(item);
    return {
      id: rowId(row, `location-${index + 1}`),
      name: text(row, ['name', 'title', 'unit_name'], 'Localidade'),
      address: text(row, ['address'], ''),
      schedule: text(row, ['schedule', 'opening_hours', 'service_times', 'service_hours'], ''),
      mapsUrl: text(row, ['maps_url', 'map_url'], `https://maps.google.com/?q=${encodeURIComponent(text(row, ['address']))}`),
      whatsappUrl: text(row, ['whatsapp_url', 'whatsapp'], ''),
    };
  });
}
