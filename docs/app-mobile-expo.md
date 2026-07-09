# Guia do projeto para app React Native + Expo

## Objetivo

Este documento orienta o desenvolvimento de um aplicativo mobile em React Native + Expo para a Igreja Recomeço, reutilizando o backend, regras de negócio, permissões e conteúdo do projeto web `issacar-connect-hub`.

O app mobile deve consumir Supabase e Supabase Edge Functions existentes. Não deve reimplementar backend em Express, nem expor segredos de Cloudinary, Google Drive ou service role.

## Estado atual do projeto web

Stack principal:

- React 18 + Vite.
- TypeScript.
- React Router.
- Tailwind CSS + shadcn/ui/Radix.
- Supabase Auth, Database, RPC e Edge Functions.
- Cloudinary como origem pública das fotos de álbuns.
- Google Drive como backup obrigatório no upload de álbuns.
- Vercel Analytics e Speed Insights no web.

Scripts locais:

```bash
npm run dev
npm run lint
npm run test
npm run build
```

No ambiente atual deste repositório, executar comandos pelo WSL:

```bash
wsl.exe bash -lc 'cd /home/phuser/issacar-connect-hub && npm run build'
```

## Arquitetura alvo mobile

Stack recomendada:

- Expo SDK atual.
- Expo Router para navegação.
- TypeScript.
- `@supabase/supabase-js` para Auth, queries e RPC.
- `@tanstack/react-query` para cache e invalidação.
- `expo-image` para imagens Cloudinary.
- `expo-secure-store` para sessão/token persistido.
- `expo-sharing` e `Share` nativo para compartilhamento.
- `expo-web-browser` ou `expo-auth-session` só se houver login OAuth direto no app.
- `react-native-safe-area-context`.
- `expo-file-system` / `expo-media-library` se download/salvar imagem for requisito.

Evitar:

- `localStorage`.
- `window`, `document`, `navigator.clipboard`.
- Elementos web como `div`, `img`, `a`.
- Tailwind web direto.
- Segredos em `EXPO_PUBLIC_*`.

## Estrutura sugerida do app Expo

```txt
app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    agenda.tsx
    eventos.tsx
    albums.tsx
    oracoes.tsx
    contribuir.tsx
  albums/
    [..slug].tsx
  eventos/
    [slug].tsx
  admin/
    _layout.tsx
    index.tsx
    albums.tsx
src/
  components/
  features/
    albums/
    agenda/
    events/
    prayers/
    donations/
    visits/
  hooks/
  lib/
    supabase.ts
    albums.ts
    permissions.ts
  theme/
  types/
```

Regra Expo Router:

- Rotas ficam em `app/`.
- Componentes, hooks, serviços e tipos ficam fora de `app/`.
- Usar `Stack.Screen options={{ title: "..." }}` para títulos.
- Telas longas devem usar `ScrollView`, `FlatList` ou `SectionList` com safe area correta.

## Variáveis de ambiente

Web atual usa:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_PUBLIC_CLOUDINARY_CLOUD_NAME=
VITE_WHATSAPP_BRIDGE_URL=
```

Edge Functions usam segredos:

```env
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_ROOT_FOLDER=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_POST_LOGIN_REDIRECT=
GDRIVE_ROOT_FOLDER=
GDRIVE_ROOT_FOLDER_NAME=
WHATSAPP_BRIDGE_URL=
WHATSAPP_BRIDGE_TOKEN=
```

Expo deve usar somente variáveis públicas:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_SITE_URL=
```

Nunca colocar no app:

- `CLOUDINARY_API_SECRET`.
- `GOOGLE_CLIENT_SECRET`.
- `SUPABASE_SERVICE_ROLE_KEY`.
- Tokens do WhatsApp bridge.

## Supabase client no Expo

Web atual usa `localStorage`. No Expo, substituir por storage compatível:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "igreja-recomeco-mobile",
      },
    },
  },
);
```

Para dados mais sensíveis, avaliar adapter com `expo-secure-store`.

## Módulos de negócio existentes

### Home

Web monta home em `src/pages/Index.tsx`, controlada por `site_section_visibility`.

Seções:

- `hero`
- `about`
- `agenda`
- `events`
- `campaigns`
- `albums`
- `pastors`
- `ministries`
- `prayer`
- `public_prayers`
- `donations`
- `tithes_offerings`
- `transparency`
- `home_visits`
- `locations`
- `invitation`
- `footer`

Mobile deve respeitar essa visibilidade. Se uma seção estiver oculta no admin, não mostrar card, aba ou atalho relacionado.

### Menu e logo

Fonte:

- `site_header_settings`
- `site_header_nav_items`
- hook web: `src/hooks/useSiteHeaderConfig.ts`

Regras:

- Se não houver itens ativos no banco, usar navegação padrão.
- Cada item pode apontar para seção por `section_key`.
- Seção oculta remove item do menu.
- `campaigns` só aparece quando há campanha ativa.
- Logo vem de `site_header_settings.logo_url`, fallback para asset web.

No mobile, converter menu web em:

- Tabs principais.
- Tela "Mais" para itens secundários.
- Atalhos contextuais na home.

### Tapume/manutenção

Fonte:

- `site_maintenance_settings`
- componente web: `MaintenanceGate`.

App deve consultar status de manutenção no boot e bloquear telas públicas quando publicado. Admin pode ficar disponível se houver login e permissão.

### Agenda

Fonte:

- `agenda_items`.

Uso:

- Lista de cultos/atividades recorrentes.
- Ordenar por `day_of_week` e `start_time`.
- Mostrar somente itens ativos para público.

### Eventos

Fonte:

- `events`
- `event_registrations`

Rotas web:

- `/eventos/:slug`
- `/admin/eventos`

Regras:

- Público vê eventos publicados.
- Evento pode ter formulário de inscrição.
- Inscrição cria linha em `event_registrations`.
- Eventos pagos usam campos de pagamento no evento.

Mobile:

- Lista de próximos eventos.
- Detalhe com CTA de inscrição.
- Formulário nativo.
- Compartilhar evento via `Share`.

### Campanhas

Fonte:

- `campaigns`.

Regras:

- Mostrar só campanhas `is_active`.
- Header/menu esconde campanhas se não houver ativa.
- Pode se relacionar com evento.

Mobile:

- Card em home.
- Tela de campanhas ativas.
- CTA externo/interno conforme campos existentes.

### Álbuns

Frontend web:

- `src/lib/albums.ts`
- `src/components/site/AlbumsSection.tsx`
- `src/pages/Albums.tsx`
- `src/pages/AlbumDetails.tsx`
- `src/pages/admin/AdminAlbums.tsx`

Rotas web:

- `/albums`
- `/albums/:slug`
- `/albums/:slug?photoId=0`
- `/admin/albums`

Edge Functions:

- `albums-galleries`
- `albums-gallery-images`
- `albums-upload`
- `albums-download`
- `albums-drive-folders`
- `albums-next-order`
- `albums-google-auth-start`
- `albums-google-auth-callback`
- `albums-google-auth-logout`

Modelo público:

```ts
type GalleryFolder = {
  slug: string;
  createdAt?: string;
  count?: number;
  thumbnail?: {
    public_id: string;
    format: string;
    blurDataUrl: string;
  };
};

type GalleryImage = {
  id: number;
  public_id: string;
  format: string;
  width: number;
  height: number;
  isPortrait: boolean;
  tags: string[];
  blurDataUrl?: string;
};
```

Regras:

- Cloudinary é origem pública das imagens.
- Fotos não vão para Supabase Storage.
- `VITE_CLOUDINARY_CLOUD_NAME` no web vira `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` no app.
- `CLOUDINARY_ROOT_FOLDER` padrão atual: `galeries`.
- Home exibe só 3 álbuns mais recentes.
- Tela `/albums` lista todos.
- Detalhe usa grid/masonry e modal/lightbox.
- Foto individual compartilha link com `photoId`.
- Download passa por Edge Function `albums-download`.

No Expo:

- Usar `FlatList` com duas colunas para lista de álbuns.
- Usar `FlashList` se coleção ficar grande.
- Usar `expo-image` com URL Cloudinary transformada.
- Lightbox deve ser tela modal do Expo Router, não modal web.
- Compartilhamento deve usar `Share.share`.
- Download/salvar imagem exige `expo-file-system` + `expo-media-library`.

Função de URL Cloudinary equivalente:

```ts
export function cloudinaryImageUrl(
  publicId: string,
  format: string,
  transformations = "c_scale,w_1200,q_auto",
) {
  const cloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return "";
  const cleanFormat = format.replace(/[^a-zA-Z0-9]/g, "");
  const cleanPublicId =
    cleanFormat && publicId.endsWith(`.${cleanFormat}`)
      ? publicId.slice(0, -cleanFormat.length - 1)
      : publicId;
  return `https://res.cloudinary.com/${cloud}/image/upload/${transformations}/${cleanPublicId}.${cleanFormat}`;
}
```

Upload de álbuns no mobile:

- Não fazer no primeiro MVP, salvo decisão explícita.
- Se fizer, manter somente para admin com `albums.manage`.
- Upload deve chamar `albums-upload`.
- Drive precisa concluir antes de Cloudinary.
- Aceitar só `image/*`.
- Ignorar duplicados por `name-size-lastModified`.
- Google OAuth no app precisa fluxo próprio com deep link.

### Pedidos de oração

Fonte:

- `prayer_requests`
- `prayer_praying_records`

Web:

- `PrayerSection`: cria pedido.
- `PublicPrayersSection`: mural e contador "estou orando".
- `usePrayerCommunityCount`: contador para header/botões.

Regras:

- Pedido pode ser anônimo.
- Público pode criar pedido.
- Público pode marcar/desmarcar oração.
- Admin pode marcar como orado ou remover.

Mobile:

- Tela "Orações" com formulário e mural.
- Persistir identificação local para evitar múltiplos votos indevidos conforme regra atual do banco.
- Botão "Estou orando" com feedback tátil em iOS.

### Doações e dízimos

Fontes:

- `donation_items`
- `donation_pledges`
- `donation_responsibles`
- `donation_notifications`
- `tithes_offerings_methods`

Edge Function:

- `send-donation-whatsapp`

Regras:

- Doação de alimentos registra compromisso em `donation_pledges`.
- Responsáveis recebem notificação/WhatsApp conforme fluxo.
- Dízimos e ofertas mostram métodos ativos, destaque por `is_featured`.

Mobile:

- Tela "Contribuir" com abas:
  - Alimentos.
  - Dízimos e ofertas.
  - Transparência.
- Para Pix, usar `Clipboard` nativo.
- Para WhatsApp, abrir `Linking.openURL`.

### Visitas

Fontes:

- `home_visit_requests`
- `home_visit_responsibles`
- `home_visit_settings`
- `home_visit_blocked_dates`

Regras:

- Público solicita visita.
- Datas bloqueadas não podem ser escolhidas.
- Limite por dia vem de `home_visit_settings.max_visits_per_day`.
- Admin gerencia status, responsáveis e bloqueios.

Mobile:

- Formulário com seletor de data.
- Validar bloqueios antes de inserir.
- Mostrar mensagem clara quando data cheia/bloqueada.

### Localidades

Fonte:

- `church_locations`.

Regras:

- Mostrar só ativos.
- Campos incluem endereço, mapa, contatos e horários.

Mobile:

- Lista de unidades/localidades.
- Ações:
  - Abrir mapa.
  - Ligar.
  - WhatsApp.
  - Copiar endereço.

### Pastores e ministérios

Fontes:

- `pastors`
- `ministries`

Regras:

- Ordenação por `sort_order`.
- Ministérios têm imagem opcional.

Mobile:

- Cards simples na home.
- Tela de lista se houver muitos.

### Transparência

Fonte:

- `transparency_expenses`.

Regra importante:

- Seção `transparency` começa oculta por padrão em `site_section_visibility`.
- Quando oculta, não mostrar menu nem tela pública.

Mobile:

- Mostrar lista de despesas quando visível.
- Separar pagas/pendentes se fizer sentido visual.

### Botões flutuantes mobile

Fonte:

- `site_mobile_floating_buttons`.

Estado atual web:

- Botões aparecem somente na home.
- Admin em `/admin/botoes-mobile`.

Mobile app:

- Não replicar como floating buttons globais.
- Converter para atalhos da home ou ações rápidas dentro da aba inicial.
- Respeitar `is_active`, `sort_order`, `href`, `icon_name`, `image_url` e visibilidade de seção.

## Admin e permissões

Auth:

- Supabase Auth.
- `useAuth` chama RPC `get_my_admin_access`.
- Master passa em tudo.
- Permissões controlam rotas admin.

RPCs:

- `get_my_admin_access`
- `has_permission`
- `has_role`
- `is_master`
- `create_admin_profile`
- `can_manage_site_media`

Permissões principais:

- `dashboard.view`
- `agenda.manage`
- `events.manage`
- `campaigns.manage`
- `albums.manage`
- `pastors.manage`
- `ministries.manage`
- `prayers.manage`
- `donations.manage`
- `tithes.manage`
- `transparency.manage`
- `visits.manage`
- `service_visitors.manage`
- `datashow.display`
- `locations.manage`
- `footer.manage`
- `header.manage`
- `hero.manage`
- `sections.manage`
- `tapume.manage`
- `mobile_buttons.manage`
- `users.manage`
- `access.manage`

Admin mobile recomendado:

- MVP sem admin completo.
- Incluir no app só operações de campo:
  - Visitantes do culto.
  - Pedidos de oração.
  - Upload de álbuns, se necessário.
  - Dashboard simples.
- Admin completo segue no web.

## Tabelas principais

Conteúdo público:

- `site_hero_settings`
- `site_header_settings`
- `site_header_nav_items`
- `site_footer_settings`
- `site_section_visibility`
- `site_maintenance_settings`
- `site_mobile_floating_buttons`
- `agenda_items`
- `events`
- `campaigns`
- `pastors`
- `ministries`
- `church_locations`
- `transparency_expenses`

Comunidade:

- `prayer_requests`
- `prayer_praying_records`
- `event_registrations`
- `home_visit_requests`
- `service_visitors`

Doações:

- `donation_items`
- `donation_pledges`
- `donation_responsibles`
- `donation_notifications`
- `tithes_offerings_methods`

Admin/acesso:

- `admin_profiles`
- `user_roles`
- `admin_permissions`
- `admin_ministries`
- `admin_ministry_permissions`
- `admin_user_ministries`

## Edge Functions

Álbuns:

- `albums-galleries`: lista pastas Cloudinary.
- `albums-gallery-images`: lista imagens por slug.
- `albums-download`: proxy de download com attachment.
- `albums-upload`: upload Drive primeiro, Cloudinary depois.
- `albums-drive-folders`: valida/lista pastas Google Drive.
- `albums-next-order`: calcula próxima ordem de álbum por ano/mês.
- `albums-google-auth-start`: inicia OAuth Google.
- `albums-google-auth-callback`: recebe OAuth Google.
- `albums-google-auth-logout`: limpa cookies/tokens Google.

Outras:

- `reset-admin-password`
- `send-donation-whatsapp`
- `signup-username-user`

No app Expo, chamar Edge Functions com:

```ts
async function callFunction<T>(
  name: string,
  init: RequestInit = {},
) {
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
  };
  if (data.session?.access_token) {
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${name}`,
    { ...init, headers: { ...headers, ...(init.headers as Record<string, string> | undefined) } },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Falha na requisicao.");
  return payload as T;
}
```

## Deep links e compartilhamento

Web usa:

- Álbum: `/albums/:slug`
- Foto: `/albums/:slug?photoId=N`
- Evento: `/eventos/:slug`

Mobile deve aceitar links universais/futuros:

- `recomeco://albums/:slug`
- `recomeco://albums/:slug?photoId=N`
- `recomeco://eventos/:slug`

Para redes sociais e WhatsApp, compartilhar link web canônico enquanto não houver Universal Links publicados.

Observação SEO:

- SPA altera meta tags no cliente para álbuns/fotos.
- WhatsApp/Facebook podem não ler meta client-side.
- Para preview perfeito, criar rota/Edge Function server-rendered de share com OG tags.

## Design mobile

Direção:

- App operacional e devocional, sem parecer landing page.
- Home com cards de ação, próximos eventos, agenda e álbuns recentes.
- Navegação por tabs:
  - Início.
  - Agenda.
  - Eventos.
  - Álbuns.
  - Orações.
  - Mais.

Componentes:

- Cards com raio discreto.
- Botões com ícones nativos.
- `FlatList` para listas.
- `SectionList` para agenda agrupada.
- `Stack` com títulos nativos.
- `Share` nativo para compartilhar.
- Feedback de loading/empty/error em toda lista remota.

Estados obrigatórios:

- Loading skeleton/spinner.
- Empty state.
- Erro com retry.
- Offline/sem conexão, pelo menos em leitura crítica.
- Acesso negado para admin.

## Cache e sincronização

Usar React Query:

- `sections.visibility`
- `header.config`
- `home.summary`
- `agenda.items`
- `events.list`
- `event.detail`
- `albums.list`
- `albums.images.slug`
- `prayers.list`
- `locations.list`

Tempos sugeridos:

- Conteúdo institucional: `staleTime` 5 a 15 minutos.
- Orações/visitantes/admin: `staleTime` 30 a 60 segundos.
- Álbuns: `staleTime` 5 minutos.

Invalidar após mutations:

- Criar pedido de oração.
- Marcar oração.
- Inscrição em evento.
- Solicitar visita.
- Upload/admin.

## MVP recomendado

Fase 1:

- Auth Supabase para admin.
- Home com seções visíveis.
- Agenda.
- Eventos + inscrição.
- Álbuns + detalhe + share.
- Pedidos de oração + mural.
- Contribuir.
- Localidades.
- Tapume/manutenção.

Fase 2:

- Push notifications.
- Visitantes do culto/admin de campo.
- Dashboard admin simples.
- Upload de álbuns no admin mobile.
- Download/salvar imagens.
- Universal Links.

Fase 3:

- Offline cache.
- Favoritos/salvos.
- OG share server-rendered para fotos.
- Métricas mobile.

## Checklist técnico inicial

1. Criar app Expo com tabs.
2. Configurar TypeScript e aliases.
3. Configurar Supabase client com storage mobile.
4. Portar `SITE_SECTION_KEYS`.
5. Criar `src/lib/albums.ts` mobile.
6. Criar hooks React Query por módulo.
7. Criar tema com cores da Igreja Recomeço.
8. Implementar home respeitando `site_section_visibility`.
9. Implementar álbuns e lightbox modal.
10. Implementar orações.
11. Implementar eventos e inscrições.
12. Implementar contribuir/localidades.
13. Validar Auth admin com `get_my_admin_access`.

## Plano V1 caveman

### V1 norte

V1: app público-first -> reutiliza Supabase + Edge Functions do web.
V2: Expo SDK 57.0.0 -> React Native 0.86 + React 19.2.3 + Node >= 22.13.x.
V3: deps Expo -> `npx expo install <pkg>`; npm direto só lib não-Expo.
V4: `EXPO_PUBLIC_*` -> somente chaves públicas; segredos ficam em Edge Functions.
V5: RLS/RPC Supabase -> fonte final de authz; UI só esconde/explica.
V6: `site_section_visibility` oculta seção -> sem tab/card/menu/atalho.
V7: `site_maintenance_settings` publicado -> bloqueia público no boot; admin login ainda acessível.
V8: Admin completo -> fora V1; web segue painel principal.

### V1 escopo

id|módulo|entrega|fonte
---|---|---|---
S1|boot|env, tema, QueryClient, Supabase client mobile, maintenance gate|Expo/Supabase
S2|home|cards por visibilidade, próximos eventos, agenda, álbuns recentes, atalhos mobile|`site_section_visibility`, `site_mobile_floating_buttons`
S3|agenda|lista ativa ordenada por dia/hora|`agenda_items`
S4|eventos|lista, detalhe, inscrição, share web canônico|`events`, `event_registrations`
S5|álbuns|lista, detalhe grid, lightbox modal, share foto/álbum|`albums-galleries`, `albums-gallery-images`
S6|orações|form público, mural, botão "Estou orando"|`prayer_requests`, `prayer_praying_records`
S7|contribuir|abas alimentos, dízimos/ofertas, transparência se visível|`donation_*`, `tithes_offerings_methods`, `transparency_expenses`
S8|localidades|lista ativa + mapa/ligar/WhatsApp/copiar|`church_locations`
S9|auth admin|min login + `get_my_admin_access` + acesso negado claro|Supabase Auth/RPC

### V1 fora

id|fora|motivo
---|---|---
O1|upload álbuns mobile|Google OAuth/deep link aumenta risco
O2|dashboard admin|campo não essencial p/ lançamento público
O3|visitantes culto admin|fase 2
O4|push notifications|exige device tokens + Edge Function/tabela nova
O5|download/salvar foto|permissões + fluxo arquivo; fase 2
O6|Universal Links publicados|depende domínio/app store config
O7|OG server-rendered p/ fotos|backend novo; fase 3
O8|offline amplo|V1 só estados de erro/retry + cache React Query

### Navegação V1

route|tela|regra
---|---|---
`/`|Início|home operacional/devocional
`/agenda`|Agenda|tab se `agenda` visível
`/eventos`|Eventos|tab se `events` visível
`/eventos/[slug]`|Detalhe evento|Stack
`/albums`|Álbuns|tab se `albums` visível
`/albums/[slug]`|Detalhe álbum|Stack
`/albums/[slug]/photo`|Lightbox foto|modal Stack
`/oracoes`|Orações|tab se `prayer` ou `public_prayers` visível
`/contribuir`|Contribuir|tab/mais se `donations` ou `tithes_offerings` visível
`/mais`|Mais|localidades, pastores, ministérios, campanhas, transparência conforme visibilidade
`/admin/login`|Login admin|sem tab
`/admin`|Admin shell mínimo|somente auth + permissão

### Dados/cache V1

query|staleTime|invalida após
---|---:|---
`sections.visibility`|10 min|admin web alteração futura
`maintenance.status`|2 min|boot/focus
`home.summary`|5 min|mutations relacionadas
`agenda.items`|15 min|-
`events.list`|5 min|`event.register`
`event.detail.slug`|5 min|`event.register`
`albums.list`|5 min|-
`albums.images.slug`|5 min|-
`prayers.list`|60 s|`prayer.create`, `prayer.toggle`
`donations.items`|5 min|`donation.pledge`
`tithes.methods`|15 min|-
`locations.list`|15 min|-
`admin.access`|60 s|login/logout

### Mutations V1

id|mutation|validação|pós
---|---|---|---
M1|`event.register`|evento publicado + form ativo + campos obrigatórios|toast + invalida evento
M2|`prayer.create`|texto/nome/anon conforme regra web|limpa form + invalida mural
M3|`prayer.toggle`|identidade local persistida|feedback tátil + invalida mural
M4|`donation.pledge`|item ativo + responsável/quantidade|chama `send-donation-whatsapp` se fluxo exigir
M5|`admin.login`|email/senha Supabase|carrega `get_my_admin_access`

### Estados obrigatórios V1

E1: toda lista remota -> loading + empty + error retry.
E2: todo form -> disabled submitting + erro inline + sucesso claro.
E3: offline/sem rede -> mensagem e retry nas telas críticas.
E4: permissão negada admin -> tela dedicada, sem crash.
E5: seção oculta no banco -> rota direta mostra "indisponível" ou redireciona.
E6: Cloudinary env ausente -> álbuns mostram erro configuracional, sem URL quebrada.

### Ordem build V1

id|status|task|cites
---|---|---|---
T1|.|confirmar Node >= 22.13.x + Expo SDK 57 deps|V2,V3
T2|.|organizar Expo Router em `src/app` ou mover p/ `app` com decisão única|V1
T3|.|criar `src/lib/env.ts`, `src/lib/supabase.ts`, storage mobile|V4,V5
T4|.|instalar `@supabase/supabase-js`, React Query, storage, NetInfo, Clipboard, Haptics|S1
T5|.|criar QueryProvider + ThemeProvider + SafeArea base|S1
T6|.|portar section visibility + maintenance gate|V6,V7
T7|.|trocar template inicial por tabs V1|Navegação V1
T8|.|implementar Home com atalhos filtrados|S2
T9|.|implementar Agenda|S3
T10|.|implementar Eventos + inscrição + share|S4,M1
T11|.|implementar Álbuns + Cloudinary URL + lightbox modal|S5,E6
T12|.|implementar Orações + identidade local + haptics|S6,M2,M3
T13|.|implementar Contribuir + Pix clipboard + WhatsApp Linking|S7,M4
T14|.|implementar Localidades + ações nativas|S8
T15|.|implementar login admin mínimo + access gate|S9,M5
T16|.|passar lint + smoke Android/iOS/Web quando possível|E1-E6

### Aceite V1

A1: app abre sem segredos e sem dependência browser (`window`, `document`, `localStorage`).
A2: home respeita visibilidade do admin web.
A3: tapume publicado bloqueia fluxo público.
A4: evento publicado recebe inscrição pelo app.
A5: álbum lista, abre detalhe, abre foto modal, compartilha link web.
A6: pedido de oração cria registro e mural atualiza.
A7: "Estou orando" alterna sem duplicar identidade local.
A8: contribuir mostra Pix/WhatsApp sem expor token.
A9: localidades abrem mapa/telefone/WhatsApp.
A10: admin login carrega permissões e nega acesso sem crash.

## Riscos e decisões abertas

- Upload de álbuns no mobile exige fluxo OAuth Google adaptado para deep link.
- SEO real de foto compartilhada precisa endpoint server-rendered.
- Push notifications exigem tabela/Edge Function nova para device tokens.
- Admin completo no mobile aumenta muito escopo; manter web como painel principal.
- Supabase RLS deve continuar sendo fonte final de autorização, não só UI.
- Storage mobile precisa substituir qualquer dependência de browser.

## Referências no código web

- Rotas: `src/App.tsx`
- Home: `src/pages/Index.tsx`
- Supabase client: `src/integrations/supabase/client.ts`
- Auth/admin: `src/hooks/useAuth.ts`
- Visibilidade: `src/contexts/section-visibility.ts`
- Header/logo/menu: `src/hooks/useSiteHeaderConfig.ts`, `src/components/site/SiteHeader.tsx`
- Álbuns: `src/lib/albums.ts`, `src/pages/Albums.tsx`, `src/pages/AlbumDetails.tsx`, `src/pages/admin/AdminAlbums.tsx`
- Botões home mobile: `src/components/site/MobileFloatingButtons.tsx`
- Admin nav/permissões UI: `src/pages/admin/adminNavigation.ts`
- Edge Functions albums: `supabase/functions/albums-*`
- Shared albums backend: `supabase/functions/_shared/albums-*.ts`
- Migrations: `supabase/migrations`
