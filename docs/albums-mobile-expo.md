# Implementação dos álbuns no app React Native + Expo

Guia para recriar no app mobile a exibição pública dos álbuns da Igreja Recomeço. Base real:

- `src/components/site/AlbumsSection.tsx`
- `src/pages/Albums.tsx`
- `src/pages/AlbumDetails.tsx`
- `src/lib/albums.ts`
- `supabase/functions/albums-galleries/index.ts`
- `supabase/functions/albums-gallery-images/index.ts`
- `supabase/functions/albums-download/index.ts`

Use junto com:

- `docs/app-mobile-expo.md`
- `docs/design-mobile-expo.md`

## Escopo

Implementar no app:

- seção "Álbuns" na Home, com últimos 3 álbuns;
- tela "Todos os álbuns";
- tela de detalhe do álbum;
- grade/lista de fotos;
- visualizador de foto em tela cheia;
- compartilhar álbum;
- compartilhar foto;
- baixar/salvar foto no aparelho, quando permitido;
- estados de loading, vazio e erro;
- respeito a `site_section_visibility` para chave `albums`.

Não implementar no app público:

- upload de álbuns;
- login Google Drive;
- seleção de pasta Google Drive;
- uso de `CLOUDINARY_API_SECRET`;
- uso de `SUPABASE_SERVICE_ROLE_KEY`;
- edição/admin de álbuns.

Admin de álbuns permanece web por enquanto.

## Modelo atual

Álbuns não vêm de tabela Supabase. Lista e fotos vêm de Cloudinary via Supabase Edge Functions.

Fluxo:

1. App chama Edge Function pública.
2. Edge Function usa segredo Cloudinary no servidor.
3. Edge Function devolve metadados seguros.
4. App monta URLs públicas de imagem Cloudinary com `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`.
5. Download passa por `albums-download`, não por segredo no app.

## Variáveis Expo

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_SITE_URL=
```

Nunca colocar no app:

```env
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_ROOT_FOLDER=
GOOGLE_CLIENT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
```

## Rotas Expo Router

Estrutura sugerida:

```txt
app/
  (tabs)/
    albums.tsx
  albums/
    [..slug].tsx
src/
  features/
    albums/
      api.ts
      types.ts
      utils.ts
      AlbumCard.tsx
      AlbumGrid.tsx
      PhotoGrid.tsx
      PhotoViewer.tsx
```

Rotas:

- `/(tabs)/albums`: todos os álbuns.
- `/albums/[..slug]`: detalhe. Slug pode ter barras, exemplo `2026/7.Julho/1.culto-de-domingo`.

Na Home, usar componente `AlbumsHomeSection` fora da rota.

## Tipos

```ts
export type GalleryFolder = {
  slug: string;
  createdAt?: string;
  count?: number;
  thumbnail?: {
    public_id: string;
    format: string;
    blurDataUrl: string;
  };
};

export type GalleryImage = {
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

## API client

Criar `src/features/albums/api.ts`.

```ts
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

function albumsFunctionUrl(name: string, params?: URLSearchParams) {
  const query = params ? `?${params.toString()}` : "";
  return `${SUPABASE_URL}/functions/v1/${name}${query}`;
}

async function callAlbumFunction<T>(name: string, init: RequestInit = {}) {
  const headers = {
    apikey: SUPABASE_KEY,
    ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(init.headers as Record<string, string> | undefined),
  };

  const response = await fetch(albumsFunctionUrl(name), {
    ...init,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Falha ao carregar albuns.");
  return data as T;
}

export async function fetchGalleries() {
  const data = await callAlbumFunction<{ galleries: GalleryFolder[] }>(
    "albums-galleries",
    { method: "GET" },
  );
  return data.galleries;
}

export async function fetchGalleryImages(slug: string) {
  const data = await callAlbumFunction<{ images: GalleryImage[] }>(
    "albums-gallery-images",
    {
      method: "POST",
      body: JSON.stringify({ slug }),
    },
  );
  return data.images;
}
```

Se app já tiver Supabase client com sessão, pode adicionar `Authorization: Bearer <access_token>`. Para exibição pública, `apikey` basta.

## Utils

Criar `src/features/albums/utils.ts`.

```ts
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL;

export function cloudinaryImageUrl(
  publicId: string,
  format: string,
  transformations = "c_scale,w_1200,q_auto",
) {
  if (!CLOUDINARY_CLOUD_NAME) return "";
  const transform = transformations ? `${transformations}/` : "";
  const cleanFormat = format.replace(/[^a-zA-Z0-9]/g, "");
  const cleanPublicId =
    cleanFormat && publicId.endsWith(`.${cleanFormat}`)
      ? publicId.slice(0, -cleanFormat.length - 1)
      : publicId;

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transform}${cleanPublicId}.${cleanFormat}`;
}

export function albumTitle(slug: string) {
  return slug
    .split("/")
    .pop()!
    .replace(/^\d+\./, "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function albumWebPath(slug: string) {
  return `/albums/${slug.split("/").map(encodeURIComponent).join("/")}`;
}

export function albumShareUrl(slug: string) {
  return `${SITE_URL}${albumWebPath(slug)}`;
}

export function photoShareUrl(slug: string, index: number) {
  return `${albumShareUrl(slug)}?photoId=${index}`;
}

export function downloadFilename(albumName: string, order: number, format: string) {
  const date = new Date();
  const dateStr = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const cleanAlbumName = albumName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "album";
  const cleanFormat = format.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  return `${cleanAlbumName}_${String(order + 1).padStart(3, "0")}_${dateStr}.${cleanFormat}`;
}
```

## Cache

Usar `@tanstack/react-query`.

Query keys:

```ts
export const albumKeys = {
  all: ["albums"] as const,
  galleries: () => [...albumKeys.all, "galleries"] as const,
  images: (slug: string) => [...albumKeys.all, "images", slug] as const,
};
```

Config sugerida:

- `staleTime`: 5 minutos para lista.
- `staleTime`: 10 minutos para fotos do álbum.
- `gcTime`: 30 minutos.
- retry: 1 ou 2.

Prefetch:

- ao tocar em álbum, chamar `queryClient.prefetchQuery` para fotos;
- em lista, não baixar imagens full size, só thumbnails.

## Home: seção Álbuns

Equivalente a `AlbumsSection.tsx`.

Comportamento:

- chamar `fetchGalleries()`;
- mostrar só `data.slice(0, 3)`;
- se `albums` oculto em `site_section_visibility`, não renderizar;
- header:
  - eyebrow: "Memórias da igreja";
  - título: "Álbuns";
  - descrição: "Registros dos cultos, encontros e momentos da comunidade.";
- botão "Ver todos" leva para `/(tabs)/albums`.

Card Home:

- imagem aspecto `16:11`;
- transformação Cloudinary: `c_fill,w_720,h_520,q_auto`;
- fallback com ícone `Images`;
- título com `albumTitle(slug)`;
- contagem: `${count ?? 0} fotos`.

## Tela Todos os Álbuns

Equivalente a `src/pages/Albums.tsx`.

Layout mobile:

- `Screen` com fundo `background`;
- header:
  - botão voltar ou tab header;
  - eyebrow "Memórias da igreja";
  - título "Álbuns";
  - descrição "Fotos dos cultos, celebrações e encontros da Igreja Recomeço.";
- `FlatList` com 2 colunas em celular grande, 1 coluna em celular estreito se necessário;
- usar `numColumns` responsivo via `useWindowDimensions`.

Card:

- aspecto quadrado;
- transformação Cloudinary: `c_fill,w_720,h_720,q_auto`;
- overlay escuro no rodapé;
- título em branco;
- contagem em branco com opacidade;
- fallback `Images` em fundo `primary` com baixa opacidade.

Estados:

- loading: 6 skeletons quadrados;
- vazio: card simples com "Nenhum álbum disponível no momento.";
- erro: mensagem + botão "Tentar novamente".

## Tela Detalhe do Álbum

Equivalente a `src/pages/AlbumDetails.tsx`.

Entrada:

- receber slug por rota catch-all;
- reconstruir slug com `/`;
- chamar `fetchGalleryImages(slug)`;
- título = `albumTitle(slug)`.

Header:

- botão voltar;
- eyebrow "Álbum";
- título do álbum;
- subtítulo: `${images.length} fotos` ou "Carregando fotos...";
- botão "Compartilhar álbum";
- botão "Todos os álbuns" opcional em menu/ação secundária.

Grade de fotos:

- web usa masonry com CSS columns;
- React Native deve usar `FlashList` ou `FlatList`;
- opção simples: grade 2 colunas, cada item com altura calculada por proporção `height / width`;
- opção melhor: usar biblioteca masonry compatível com Expo, se projeto aceitar dependência;
- limitar renderização inicial com `initialNumToRender`;
- usar `expo-image` com cache.

Transformações:

- miniatura na grade: `c_scale,w_720,q_auto`;
- visualizador full screen: `c_scale,w_1600,q_auto`;
- share image web/preview: `c_fill,w_1200,h_630,q_auto`.

Item de foto:

- `Pressable` abre visualizador;
- imagem arredondada;
- botões de ação em overlay:
  - compartilhar;
  - salvar/baixar;
- em mobile, botões sempre visíveis ou dentro de menu. Não depender de hover.

## Visualizador full screen

Criar `PhotoViewer`.

Comportamento:

- abrir em `Modal`;
- fundo preto `#000`;
- imagem `resizeMode="contain"`;
- topo com título curto: `${title} - ${index + 1}/${images.length}`;
- botões:
  - fechar;
  - compartilhar;
  - baixar/salvar;
- navegação:
  - swipe horizontal com `FlatList` paging;
  - ou botões anterior/próximo.

Estado inicial:

- se usuário abriu deeplink com `photoId`, abrir modal já nessa foto;
- validar índice. Se inválido, ignorar.

## Compartilhamento

Usar `Share` do React Native.

Álbum:

```ts
await Share.share({
  title: `${title} | Álbuns Igreja Recomeço`,
  message: `Veja o álbum ${title} da Igreja Recomeço.\n${albumShareUrl(slug)}`,
});
```

Foto:

```ts
await Share.share({
  title: `${title} - foto ${index + 1} | Igreja Recomeço`,
  message: `Veja a foto ${index + 1} do álbum ${title}.\n${photoShareUrl(slug, index)}`,
});
```

Observação:

- web compartilha URL;
- mobile pode compartilhar URL primeiro;
- compartilhamento do arquivo real exige baixar temporário antes, mais permissão/armazenamento.

## Download/salvar foto

Usar `albums-download`.

URL:

```ts
const params = new URLSearchParams({
  publicId: image.public_id,
  format: image.format,
  filename: downloadFilename(title, index, image.format),
});

const url = `${SUPABASE_URL}/functions/v1/albums-download?${params.toString()}`;
```

No Expo:

- baixar com `expo-file-system`;
- salvar na galeria com `expo-media-library`;
- pedir permissão antes;
- se permissão negada, abrir URL no navegador com `expo-web-browser`.

Pseudo fluxo:

```ts
const permission = await MediaLibrary.requestPermissionsAsync();
if (!permission.granted) {
  await WebBrowser.openBrowserAsync(url);
  return;
}

const target = `${FileSystem.cacheDirectory}${filename}`;
const result = await FileSystem.downloadAsync(url, target, {
  headers: { apikey: SUPABASE_KEY },
});

const asset = await MediaLibrary.createAssetAsync(result.uri);
await MediaLibrary.createAlbumAsync("Igreja Recomeço", asset, false);
```

Não salvar publicId cru como nome de arquivo. Usar `downloadFilename`.

## Deeplink de foto

Web usa:

```txt
/albums/:slug?photoId=3
```

No app, aceitar:

```txt
igreja-recomeco://albums/2026/7.Julho/1.culto?photoId=3
https://site.com/albums/2026/7.Julho/1.culto?photoId=3
```

Regras:

- parsear `photoId` como número inteiro;
- se `images[photoId]` existe, abrir visualizador;
- se não existe, abrir só tela do álbum;
- ao fechar visualizador, remover `photoId` da URL quando possível.

## Performance

Obrigatório:

- `expo-image` para Cloudinary;
- thumbnails na lista, nunca full size;
- `FlatList`/`FlashList`, não `ScrollView` com todas as fotos;
- `keyExtractor={(item) => item.public_id}`;
- evitar baixar arquivos para compartilhar salvo ação explícita do usuário;
- manter `slice(0, 400)` da função como limite mental da tela.

Recomendado:

- `FlashList` se álbum grande travar em aparelhos fracos;
- blur placeholder com `blurDataUrl`, mesmo sendo GIF 1x1 atual;
- prefetch da próxima foto no visualizador;
- `removeClippedSubviews` em Android, se não quebrar imagem.

## Design

Seguir `docs/design-mobile-expo.md`.

Pontos específicos:

- fundo `background`;
- títulos com `Cormorant Garamond`;
- cards com `border`, `shadow.card`, raio 20/24;
- overlay preto em cards com texto sobre imagem;
- ícone `Images` de `lucide-react-native`;
- CTAs com formato pill;
- estados vazios sem ilustração nova.

## Segurança

- app nunca chama Cloudinary Admin API direto;
- app nunca recebe `CLOUDINARY_API_SECRET`;
- upload não fica no app público;
- download usa Edge Function, não monta arquivo por segredo;
- URLs públicas de imagem Cloudinary podem ser montadas no app;
- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` é seguro.

## Checklist

- `albums` respeita `site_section_visibility`;
- Home mostra no máximo 3 álbuns;
- tela Todos mostra todos vindos de `albums-galleries`;
- detalhe chama `albums-gallery-images` com slug certo;
- slug com barras funciona;
- card sem thumbnail mostra fallback;
- álbum vazio mostra estado vazio;
- erro mostra retry;
- foto abre em modal full screen;
- compartilhar álbum usa URL web pública;
- compartilhar foto inclui `photoId`;
- baixar passa por `albums-download`;
- app não expõe segredo Cloudinary ou Google;
- imagens usam transformações Cloudinary adequadas para cada tela.
