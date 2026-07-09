import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { AgendaCard, AlbumCard, EventCard } from "@/features/v1/cards";
import {
  ActionButton,
  ErrorState,
  LoadingState,
  V1Card,
  V1Screen,
  styles,
} from "@/features/v1/shell";
import { useHomeSummary } from "@/hooks/use-v1-data";

export default function HomeScreen() {
  const home = useHomeSummary();
  const nextAgenda = home.agenda.data?.slice(0, 3) ?? [];
  const nextEvent = home.events.data?.[0];
  const latestAlbum = home.albums.data?.[0];
  const sectionVisibility = home.visibility.data;

  return (
    <V1Screen title="Igreja Recomeço" eyebrow="app V1">
      {home.isLoading ? <LoadingState label="Atualizando dados..." /> : null}
      {home.error ? <ErrorState onRetry={home.refetch} /> : null}

      <V1Card>
        <ThemedText type="smallBold">Um lugar para recomecar</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Agenda, eventos, albuns, pedidos de oracao e caminhos rapidos para
          participar.
        </ThemedText>
        <View style={styles.actionRow}>
          <ActionButton label="Ver agenda" href="/agenda" variant="primary" />
          <ActionButton label="Pedir oracao" href="/oracoes" />
          <ActionButton label="Contribuir" href="/contribuir" />
        </View>
      </V1Card>

      {sectionVisibility?.agenda ? (
        <View style={styles.grid}>
          <ThemedText type="smallBold">Agenda da semana</ThemedText>
          {nextAgenda.map((item) => (
            <AgendaCard key={item.id} item={item} />
          ))}
        </View>
      ) : null}

      {sectionVisibility?.eventos && nextEvent ? (
        <View style={styles.grid}>
          <ThemedText type="smallBold">Evento em destaque</ThemedText>
          <EventCard event={nextEvent} />
        </View>
      ) : null}

      {sectionVisibility?.albuns && latestAlbum ? (
        <View style={styles.grid}>
          <ThemedText type="smallBold">Album recente</ThemedText>
          <AlbumCard album={latestAlbum} />
        </View>
      ) : null}
    </V1Screen>
  );
}
