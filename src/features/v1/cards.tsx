import { Link } from "expo-router";
import type { ReactNode } from "react";
import { Clock, MapPin } from "lucide-react-native";
import { Pressable, Share, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { AgendaItem, EventItem, PrayerItem } from "@/data/v1";
import {
  ActionButton,
  RemoteImage,
  V1Card,
  styles as shellStyles,
} from "@/features/v1/shell";

export function AgendaCard({ item }: { item: AgendaItem }) {
  return (
    <V1Card>
      {item.posterUrl ? <RemoteImage uri={item.posterUrl} ratio={4 / 5} /> : null}
      <View style={shellStyles.row}>
        <ThemedText type="smallBold" themeColor="primary">
          {item.kind}
        </ThemedText>
        <ThemedText type="code">{item.day}</ThemedText>
      </View>
      <ThemedText type="subtitle" style={localStyles.agendaTitle}>
        {item.title}
      </ThemedText>
      <InfoLine icon={<Clock size={18} color="#C49840" strokeWidth={1.8} />} text={item.time} />
      {item.place ? <InfoLine icon={<MapPin size={18} color="#C49840" strokeWidth={1.8} />} text={item.place} /> : null}
      {item.posterUrl ? (
        <View style={shellStyles.actionRow}>
          <ActionButton
            label="Compartilhar cartaz"
            variant="primary"
            fullWidth
            onPress={() => shareAgendaPoster(item)}
          />
        </View>
      ) : null}
    </V1Card>
  );
}

async function shareAgendaPoster(item: AgendaItem) {
  if (!item.posterUrl) {
    return;
  }

  await Share.share({
    title: item.title,
    url: item.posterUrl,
    message: `${item.title}\n${item.day} as ${item.time}${item.place ? ` - ${item.place}` : ""}\n${item.posterUrl}`,
  });
}

function InfoLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <View style={localStyles.infoLine}>
      {icon}
      <ThemedText type="small" themeColor="textSecondary" style={localStyles.infoText}>
        {text}
      </ThemedText>
    </View>
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
  agendaTitle: {
    fontSize: 24,
    lineHeight: 28,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
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
