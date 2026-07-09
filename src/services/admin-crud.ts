import { getSupabase } from '@/lib/supabase';

export type CrudField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'multiline';
  required?: boolean;
};

export type CrudResourceKey = 'agenda' | 'events' | 'prayers' | 'donation' | 'locations' | 'sections';

export type CrudRecord = Record<string, string | number | boolean | null>;

export type CrudResource = {
  key: CrudResourceKey;
  label: string;
  table: string;
  primaryKey: string;
  titleKey: string;
  orderKey: string;
  fields: CrudField[];
};

export const crudResources: CrudResource[] = [
  {
    key: 'agenda',
    label: 'Agenda',
    table: 'agenda_items',
    primaryKey: 'id',
    titleKey: 'title',
    orderKey: 'sort_order',
    fields: [
      { key: 'title', label: 'Titulo', type: 'text', required: true },
      { key: 'day_of_week', label: 'Dia da semana (0-6)', type: 'number', required: true },
      { key: 'start_time', label: 'Horario inicio', type: 'text', required: true },
      { key: 'end_time', label: 'Horario fim', type: 'text' },
      { key: 'location', label: 'Local', type: 'text' },
      { key: 'description', label: 'Descricao', type: 'multiline' },
      { key: 'is_active', label: 'Ativo', type: 'boolean' },
      { key: 'sort_order', label: 'Ordem', type: 'number' },
    ],
  },
  {
    key: 'events',
    label: 'Eventos',
    table: 'events',
    primaryKey: 'id',
    titleKey: 'title',
    orderKey: 'starts_at',
    fields: [
      { key: 'title', label: 'Titulo', type: 'text', required: true },
      { key: 'starts_at', label: 'Inicio (ISO)', type: 'text', required: true },
      { key: 'ends_at', label: 'Fim (ISO)', type: 'text' },
      { key: 'location', label: 'Local', type: 'text' },
      { key: 'description', label: 'Descricao', type: 'multiline' },
      { key: 'image_url', label: 'Imagem URL', type: 'text' },
      { key: 'is_published', label: 'Publicado', type: 'boolean' },
      { key: 'registration_form_enabled', label: 'Inscricao ativa', type: 'boolean' },
    ],
  },
  {
    key: 'prayers',
    label: 'Oracoes',
    table: 'prayer_requests',
    primaryKey: 'id',
    titleKey: 'message',
    orderKey: 'created_at',
    fields: [
      { key: 'name', label: 'Nome', type: 'text' },
      { key: 'message', label: 'Pedido', type: 'multiline', required: true },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'is_anonymous', label: 'Anonimo', type: 'boolean' },
      { key: 'allow_public', label: 'Publico', type: 'boolean' },
    ],
  },
  {
    key: 'donation',
    label: 'Dizimos/ofertas',
    table: 'tithes_offerings_methods',
    primaryKey: 'id',
    titleKey: 'title',
    orderKey: 'sort_order',
    fields: [
      { key: 'title', label: 'Titulo', type: 'text', required: true },
      { key: 'description', label: 'Descricao', type: 'multiline' },
      { key: 'recipient_name', label: 'Recebedor', type: 'text' },
      { key: 'pix_key', label: 'Chave PIX', type: 'text' },
      { key: 'bank_info', label: 'Dados bancarios', type: 'multiline' },
      { key: 'bible_verse', label: 'Versiculo', type: 'text' },
      { key: 'button_label', label: 'Texto botao', type: 'text' },
      { key: 'is_active', label: 'Ativo', type: 'boolean' },
      { key: 'is_featured', label: 'Destaque', type: 'boolean' },
      { key: 'sort_order', label: 'Ordem', type: 'number' },
    ],
  },
  {
    key: 'locations',
    label: 'Localidades',
    table: 'church_locations',
    primaryKey: 'id',
    titleKey: 'unit_name',
    orderKey: 'sort_order',
    fields: [
      { key: 'unit_name', label: 'Nome', type: 'text', required: true },
      { key: 'city', label: 'Cidade', type: 'text', required: true },
      { key: 'address', label: 'Endereco', type: 'multiline', required: true },
      { key: 'phone', label: 'Telefone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'service_hours', label: 'Horarios', type: 'text' },
      { key: 'latitude', label: 'Latitude', type: 'number', required: true },
      { key: 'longitude', label: 'Longitude', type: 'number', required: true },
      { key: 'maps_url', label: 'Mapa URL', type: 'text' },
      { key: 'is_active', label: 'Ativo', type: 'boolean' },
      { key: 'sort_order', label: 'Ordem', type: 'number' },
    ],
  },
  {
    key: 'sections',
    label: 'Secoes',
    table: 'site_section_visibility',
    primaryKey: 'section_key',
    titleKey: 'label',
    orderKey: 'sort_order',
    fields: [
      { key: 'section_key', label: 'Chave', type: 'text', required: true },
      { key: 'label', label: 'Rotulo', type: 'text', required: true },
      { key: 'is_visible', label: 'Visivel', type: 'boolean' },
      { key: 'sort_order', label: 'Ordem', type: 'number' },
    ],
  },
];

export function getCrudResource(key: CrudResourceKey) {
  return crudResources.find((resource) => resource.key === key) ?? crudResources[0];
}

export async function fetchCrudRows(resource: CrudResource) {
  const columns = [resource.primaryKey, ...resource.fields.map((field) => field.key)]
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(',');

  const { data, error } = await getSupabase()
    .from(resource.table)
    .select(columns)
    .order(resource.orderKey, { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as CrudRecord[];
}

export async function saveCrudRow(resource: CrudResource, values: CrudRecord, id?: string | number | boolean) {
  const payload = resource.fields.reduce<CrudRecord>((next, field) => {
    const value = values[field.key];
    next[field.key] = value === '' ? null : value;
    return next;
  }, {});

  const query = id
    ? getSupabase().from(resource.table).update(payload).eq(resource.primaryKey, id)
    : getSupabase().from(resource.table).insert(payload);

  const { error } = await query;
  if (error) {
    throw error;
  }
}

export async function deleteCrudRow(resource: CrudResource, id: string | number | boolean) {
  const { error } = await getSupabase().from(resource.table).delete().eq(resource.primaryKey, id);
  if (error) {
    throw error;
  }
}
