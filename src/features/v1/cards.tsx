import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { AgendaItem, AlbumItem, EventItem, PrayerItem } from "@/data/v1";
import {
  ActionButton,
  RemoteImage,
  V1Card,
  styles as shellStyles,
} from "@/features/v1/shell";

export function AgendaCard({ item }: { item: AgendaItem }) {
  return (
    <V1Card>
      <View style={shellStyles.row}>
        <View style={localStyles.fill}>
          <ThemedText type="smallBold">{item.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {item.day} | {item.time} | {item.place}
          </ThemedText>
        </View>
        <ThemedText type="code">{item.kind}</ThemedText>
      </View>
    </V1Card>
  );
}

export function EventCard({ event }: { event: EventItem }) {
  const left = Math.max(event.spots - event.registrations, 0);
  const content = (
    <V1Card>
      {event.imageUrl ? <RemoteImage uri={event.imageUrl} /> : null}
      <ThemedText type="smallBold">{event.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {[event.date, event.time, event.place].filter(Boolean).join(" | ")}
      </ThemedText>
      {event.description ? <ThemedText type="small">{event.description}</ThemedText> : null}
      {event.spots > 0 ? <ThemedText type="code">{left} vagas restantes</ThemedText> : null}
    </V1Card>
  );

  if (!event.detailPageEnabled) {
    return content;
  }

  return (
    <Link href={`/eventos/${event.slug}`} asChild>
      <Pressable style={({ pressed }) => pressed && shellStyles.pressed}>{content}</Pressable>
    </Link>
  );
}

export function AlbumCard({ album }: { album: AlbumItem }) {
  return (
    <Link href={`/albums/${album.slug}`} asChild>
      <Pressable style={({ pressed }) => pressed && shellStyles.pressed}>
        <V1Card>
          <RemoteImage uri={album.coverUrl} />
          <ThemedText type="smallBold">{album.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {album.date} | {album.photos.length} fotos
          </ThemedText>
        </V1Card>
      </Pressable>
    </Link>
  );
}

export function PrayerCard({
  prayer,
  onToggle,
  active,
  countDelta = 0,
  disabled = false,
}: {
  prayer: PrayerItem;
  onToggle: () => void;
  active: boolean;
  countDelta?: number;
  disabled?: boolean;
}) {
  const count = Math.max(prayer.count + countDelta, 0);

  return (
    <V1Card>
      <ThemedText type="smallBold">{prayer.name}</ThemedText>
      <ThemedText type="small">{prayer.request}</ThemedText>
      <View style={localStyles.prayerActions}>
        <ThemedText type="code">{count} orando</ThemedText>
        <ActionButton
          label={active ? "Em oracao" : "Estou orando"}
          variant="primary"
          disabled={disabled}
          onPress={onToggle}
        />
      </View>
    </V1Card>
  );
}

const localStyles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  prayerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
});
