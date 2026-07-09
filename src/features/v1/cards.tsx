import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AgendaItem, AlbumItem, EventItem, PrayerItem } from '@/data/v1';
import { ActionButton, RemoteImage, V1Card, styles as shellStyles } from '@/features/v1/shell';

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

  return (
    <Link href={`/eventos/${event.slug}`} asChild>
      <Pressable style={({ pressed }) => pressed && shellStyles.pressed}>
        <V1Card>
          <ThemedText type="smallBold">{event.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {event.date} | {event.time} | {event.place}
          </ThemedText>
          <ThemedText type="small">{event.description}</ThemedText>
          <ThemedText type="code">{left} vagas restantes</ThemedText>
        </V1Card>
      </Pressable>
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
}: {
  prayer: PrayerItem;
  onToggle: () => void;
  active: boolean;
}) {
  return (
    <V1Card>
      <ThemedText type="smallBold">{prayer.name}</ThemedText>
      <ThemedText type="small">{prayer.request}</ThemedText>
      <View style={shellStyles.row}>
        <ThemedText type="code">{prayer.count + (active ? 1 : 0)} orando</ThemedText>
        <ActionButton
          label={active ? 'Orando' : 'Estou orando'}
          variant="primary"
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
});
