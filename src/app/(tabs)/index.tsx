import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { AgendaItem } from "@/data/v1";
import { AlbumCard } from "@/features/albums/components";
import { AgendaCard, EventCard } from "@/features/v1/cards";
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
  const agendaHome = getHomeAgenda(home.agenda.data ?? []);
  const nextEvent = home.events.data?.[0];
  const latestAlbums = home.albums.data?.slice(0, 3) ?? [];
  const sectionVisibility = home.visibility.data;

  return (
    <V1Screen title="Confira nossas novidades" eyebrow="Bem-Vindo">
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
          <ThemedText type="smallBold">Agenda de hoje</ThemedText>
          {agendaHome.today.length ? (
            agendaHome.today.map((item) => (
              <AgendaCard key={item.id} item={item} />
            ))
          ) : (
            <V1Card>
              <ThemedText type="smallBold">
                Nada programado para hoje
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Confira as proximas agendas da semana.
              </ThemedText>
            </V1Card>
          )}
          {agendaHome.future.length ? (
            <>
              <ThemedText type="smallBold">Proximas agendas</ThemedText>
              {agendaHome.future.map((item) => (
                <AgendaCard key={item.id} item={item} />
              ))}
            </>
          ) : null}
        </View>
      ) : null}

      {sectionVisibility?.eventos && nextEvent ? (
        <View style={styles.grid}>
          <ThemedText type="smallBold">Evento em destaque</ThemedText>
          <EventCard event={nextEvent} />
        </View>
      ) : null}

      {sectionVisibility?.albuns && latestAlbums.length ? (
        <View style={styles.grid}>
          <ThemedText type="smallBold">Memorias da igreja</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Registros dos cultos, encontros e momentos da comunidade.
          </ThemedText>
          {latestAlbums.map((album) => (
            <AlbumCard key={album.slug} album={album} variant="home" />
          ))}
          <View style={styles.actionRow}>
            <ActionButton label="Ver todos" href="/albums" variant="primary" />
          </View>
        </View>
      ) : null}
    </V1Screen>
  );
}

function getHomeAgenda(items: AgendaItem[]) {
  const now = new Date();
  const todayIndex = now.getDay();
  const byStartTime = (left: AgendaItem, right: AgendaItem) =>
    timeToMinutes(left.startTime) - timeToMinutes(right.startTime);
  const today = items
    .filter((item) => item.dayOfWeek === todayIndex)
    .sort(byStartTime);
  const future = items
    .filter((item) => item.dayOfWeek !== todayIndex)
    .sort((left, right) => {
      const leftDistance = (left.dayOfWeek - todayIndex + 7) % 7;
      const rightDistance = (right.dayOfWeek - todayIndex + 7) % 7;
      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return byStartTime(left, right);
    })
    .slice(0, 4);

  return { today, future };
}

function timeToMinutes(value: string) {
  const [hour = "0", minute = "0"] = value.split(":");
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);
  if (!Number.isFinite(parsedHour) || !Number.isFinite(parsedMinute)) {
    return 0;
  }

  return parsedHour * 60 + parsedMinute;
}
