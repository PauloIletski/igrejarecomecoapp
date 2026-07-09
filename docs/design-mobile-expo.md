# Guia de design para replicar no app React Native + Expo

Este documento traduz o design atual do site da Igreja Recomeço para uma base mobile em React Native + Expo. A referência principal é o site web em React/Vite, especialmente `src/index.css`, `tailwind.config.ts` e os componentes de `src/components/site`.

Use este guia junto com `docs/app-mobile-expo.md`, que cobre arquitetura, backend e regras de negócio.

## Direção visual

O site tem uma estética acolhedora, editorial e institucional. A identidade combina:

- fundo claro quente, próximo de papel;
- azul profundo para texto, rodapé e áreas de contraste;
- dourado como cor de fé, ação e destaque;
- tipografia sem serifa para leitura e uma serifada elegante para títulos;
- cartões com cantos amplos, sombra suave e bordas discretas;
- ícones lineares com traço fino;
- imagens grandes com corte limpo e overlay escuro quando há texto sobre foto.

No app Expo, a tela inicial deve parecer uma extensão do site, mas com ritmo mobile: menos colunas, mais listas verticais, CTAs grandes o suficiente para toque e navegação persistente por abas ou atalhos.

## Tokens de cor

Tokens originais em `src/index.css` usam HSL. Para React Native, prefira centralizar em HEX:

```ts
export const colors = {
  background: "#F7F4EE",
  foreground: "#0D2C45",
  card: "#FFFFFF",
  primary: "#C49840",
  primaryForeground: "#0D2C45",
  primaryGlow: "#365A87",
  secondary: "#E7E2DA",
  muted: "#EEE9E3",
  mutedForeground: "#5C6370",
  accent: "#365A87",
  accentForeground: "#FFFFFF",
  destructive: "#CC2424",
  destructiveForeground: "#FFFFFF",
  border: "#CFC2B0",
};
```

Uso recomendado:

- `background`: fundo padrão das telas.
- `foreground`: texto principal e áreas escuras.
- `primary`: CTAs, ícones importantes, divisores e badges.
- `accent`: apoio visual em chips, estados selecionados e destaques secundários.
- `secondary` e `muted`: fundos alternados de seções e cards leves.
- `border`: linhas, divisores e bordas de inputs.

Evite criar novas cores para casos simples. Primeiro tente resolver com opacidade sobre `primary`, `foreground`, `background` ou `card`.

## Tipografia

O site usa:

- `Montserrat` para texto comum;
- `Cormorant Garamond` para títulos, frases editoriais e textos em estilo script.

No Expo:

- carregar as fontes com `expo-font`;
- usar `Montserrat` como família padrão;
- usar `Cormorant Garamond` em headings, títulos de seção e frases de assinatura.

Escala sugerida:

```ts
export const typography = {
  fontFamily: {
    body: "Montserrat",
    display: "CormorantGaramond",
  },
  size: {
    eyebrow: 12,
    caption: 12,
    body: 15,
    bodyLarge: 17,
    cardTitle: 22,
    sectionTitle: 34,
    heroTitle: 48,
  },
  lineHeight: {
    body: 24,
    bodyLarge: 28,
    cardTitle: 28,
    sectionTitle: 38,
    heroTitle: 50,
  },
};
```

Padrões:

- títulos principais usam `display`, peso semibold e line-height apertado;
- textos de suporte usam `body`, cor `mutedForeground` e line-height confortável;
- labels pequenas podem usar uppercase com letter spacing moderado;
- frases como "Existe recomeço para você." usam `display` em itálico.

## Espaçamento e raio

O CSS web usa `--radius: 1.25rem`, cartões `rounded-3xl` e botões arredondados. No app:

```ts
export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  section: 32,
  screen: 20,
};
```

Regras:

- telas usam padding horizontal de 20;
- blocos grandes têm espaçamento vertical entre 32 e 48;
- cards usam raio 20 ou 24;
- botões e chips usam formato pill;
- inputs podem usar raio 12 para ficar mais funcionais.

## Sombras e elevação

Referências web:

- `--shadow-warm`: sombra maior para hero, botões e elementos flutuantes;
- `--shadow-card`: sombra leve para cards.

No React Native:

```ts
export const shadows = {
  card: {
    shadowColor: "#0D2C45",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  warm: {
    shadowColor: "#0D2C45",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
};
```

Use sombra com parcimônia. Card comum usa `card`; CTA principal, botão flutuante e imagem hero usam `warm`.

## Componentes-base

### Botões

Botão primário:

- fundo `primary`;
- texto `primaryForeground`;
- raio pill;
- altura mínima 48;
- ícone opcional à direita;
- sombra `warm` em CTAs principais.

Botão secundário:

- fundo transparente ou `background`;
- borda `foreground` com baixa opacidade;
- texto `foreground`;
- raio pill.

Botão destrutivo:

- fundo `destructive`;
- texto `destructiveForeground`.

### Cards

Card padrão equivalente a `.brand-card`:

- fundo `card`;
- borda `border`;
- padding 20 a 24;
- raio 24;
- sombra `card`;
- ícone circular em `primary` com fundo translúcido;
- título `display`, tamanho 22;
- texto de apoio `mutedForeground`.

No mobile, não simular hover. O feedback deve vir de `Pressable` com leve redução de opacidade ou escala.

### Eyebrow e divisor

O padrão visual de seção combina:

- label pequena em `primary`;
- título em `display`;
- texto auxiliar em `mutedForeground`;
- divisor dourado curto quando a composição for centralizada.

No app:

```tsx
<Text style={styles.eyebrow}>Nossa essência</Text>
<Text style={styles.sectionTitle}>Um lugar de restauração, fé e novos começos</Text>
```

Use o divisor somente em telas ou seções mais editoriais. Em listas densas, ele pode poluir.

### Chips e badges

Chips seguem o estilo de itens prioritários da seção de doação:

- padding horizontal 12;
- padding vertical 6;
- raio pill;
- fundo `background` ou `primary` com baixa opacidade;
- borda `border`;
- texto pequeno com peso médio.

Badges de contagem, como o mural de orações:

- fundo `primary` ou `background`;
- borda contrastante;
- texto curto e forte;
- posicionamento no canto do botão quando for contador.

## Navegação mobile

No site, o header é fixo, translúcido e abre um menu mobile. No app, não replique o menu hambúrguer como principal.

Recomendação:

- usar tabs para áreas principais: Início, Agenda, Eventos, Orações e Mais;
- colocar ações rápidas em botão flutuante apenas quando vierem da tabela `site_mobile_floating_buttons`;
- respeitar `site_section_visibility`: seção oculta no admin não aparece na home, tabs, cards ou atalhos;
- manter telas de detalhe em Stack: evento, álbum, transparência, formulários e admin.

Header mobile:

- fundo `background`;
- logo horizontal colorido;
- sombra ou borda inferior leve;
- altura compacta, respeitando safe area;
- em telas internas, usar título curto e botão voltar nativo.

## Tela inicial

### Hero

Baseado em `Hero.tsx`.

No app, o hero deve ser vertical:

- fundo `background` com detalhe visual sutil em dourado;
- badge "Bem-vindo à Igreja Recomeço";
- título grande com "histórias." em `primary`;
- texto de apoio curto;
- CTA primário "Planeje sua visita";
- CTA secundário "Conheça nossa história";
- imagem em aspecto 4:5 com raio 28, borda dourada suave e overlay escuro no rodapé;
- links sociais como botões circulares.

Evite reproduzir o grid desktop. Em telas pequenas, a ordem deve ser texto, CTAs, sociais e imagem.

### Seção de essência

Baseada em `WelcomeSection.tsx`.

No app:

- fundo `secondary`;
- header central ou alinhado à esquerda;
- três cards empilhados;
- cada card com ícone circular, número discreto `01`, `02`, `03`, título e texto.

### Agenda

Baseada em `AgendaSection.tsx`.

No app:

- agrupar por dia da semana;
- cada dia vira um card ou seção de lista;
- horário e local usam ícones;
- "Ver cartaz" abre uma tela/modal com imagem e ações nativas de compartilhar/salvar;
- skeletons podem ser barras arredondadas enquanto carrega.

### Eventos

Baseada em `EventsSection.tsx`.

No app:

- lista vertical com cards de evento;
- imagem no topo em aspecto 16:10;
- fallback com símbolo/ícone em `primary`;
- data, local e investimento como linhas com ícone;
- CTA "Ver detalhes" apenas quando `detail_page_enabled` for verdadeiro.

### Doação de alimentos

Baseada em `DonationSection.tsx`.

No app:

- separar conteúdo e formulário em blocos verticais;
- mostrar itens prioritários como chips;
- ícones de alimentos podem aparecer em uma linha de quatro quadrados;
- formulário com inputs nativos, validação clara e botão full width;
- mensagens de sucesso/erro devem usar toast ou alert nativo consistente.

### Rodapé

Baseado em `SiteFooter.tsx`.

No app, o rodapé não precisa aparecer em todas as telas. Use-o no fim da Home e em "Mais":

- fundo `foreground`;
- logo claro;
- frase "Deus recomeça histórias.";
- endereço, telefone e email com ícones dourados;
- links sociais circulares.

## Imagens e assets

Assets atuais:

- `src/assets/recomeco/logo-horizontal-color.png`;
- `src/assets/recomeco/logo-horizontal-light.png`;
- `src/assets/recomeco/logo-stacked-color.png`;
- `src/assets/recomeco/logo-stacked-light.png`;
- `src/assets/recomeco/symbol-color.png`;
- `src/assets/recomeco/symbol-light.png`.

No Expo:

- colocar equivalentes em `assets/images/brand`;
- usar logo horizontal no header;
- usar logo claro em áreas escuras;
- usar símbolo como fallback em cards sem imagem;
- usar `expo-image` para imagens remotas de eventos, álbuns e hero.

Imagens com texto sobreposto sempre precisam de overlay escuro no rodapé para preservar leitura.

## Ícones

O site usa `lucide-react`. No app, usar `lucide-react-native` para manter o mesmo traço.

Padrões:

- stroke width entre 1.6 e 1.8;
- ícones informativos entre 16 e 20;
- ícones de card entre 22 e 28;
- ícones sociais em botões circulares de 44 a 48;
- ícones devem herdar `primary` quando indicam dado importante.

## Estados

Loading:

- skeleton com fundo `muted`;
- preservar altura aproximada do conteúdo final para evitar salto visual.

Vazio:

- texto direto em `mutedForeground`;
- quando couber, incluir ícone em `primary` com baixa opacidade;
- não criar ilustrações novas.

Erro:

- texto em `destructive`;
- ação de tentar novamente quando a tela depende de dados remotos.

Sucesso:

- usar `primary` e linguagem acolhedora;
- evitar verde genérico fora do sistema visual, salvo em estados administrativos muito claros.

## Acessibilidade

- todos os botões precisam de área mínima de toque 44x44;
- contraste principal deve usar `foreground` sobre `background` ou `background` sobre `foreground`;
- texto sobre imagem sempre com overlay;
- não depender apenas de cor para status;
- respeitar safe area no topo e no rodapé;
- usar labels acessíveis em botões de ícone e redes sociais.

## Exemplo de arquivo de tema

```ts
export const theme = {
  colors,
  radius,
  spacing,
  shadows,
  typography,
} as const;
```

Organização sugerida:

```txt
src/theme/
  colors.ts
  spacing.ts
  typography.ts
  shadows.ts
  index.ts
```

Componentes reutilizáveis recomendados:

```txt
src/components/
  AppButton.tsx
  BrandCard.tsx
  SectionHeader.tsx
  Chip.tsx
  IconBadge.tsx
  Screen.tsx
```

## Checklist de fidelidade

Antes de considerar a primeira versão mobile fiel ao site:

- a paleta principal usa `background`, `foreground`, `primary` e `secondary` do site;
- títulos usam Cormorant Garamond;
- textos comuns usam Montserrat;
- cards têm borda quente, raio amplo e sombra suave;
- botões principais são pill e dourados;
- telas respeitam `site_section_visibility`;
- atalhos mobile vêm de `site_mobile_floating_buttons`;
- ícones vêm de `lucide-react-native`;
- imagens remotas têm fallback com símbolo/ícone da marca;
- o footer/área "Mais" usa fundo azul profundo e logo claro.
