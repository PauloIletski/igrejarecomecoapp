import type { ReactNode } from "react";
import { Clock, MapPin } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  ActionButton,
  EmptyState,
  ErrorState,
  LoadingState,
  V1Card,
  V1Screen,
  styles,
} from "@/features/v1/shell";
import { useLocations } from "@/hooks/use-v1-data";

export default function LocationsScreen() {
  const locations = useLocations();

  return (
    <V1Screen
      title="Localidades"
      eyebrow="onde congregar"
      showBackButton={true}
    >
      {locations.isLoading ? <LoadingState /> : null}
      {locations.error ? (
        <ErrorState onRetry={() => locations.refetch()} />
      ) : null}
      {locations.data?.length === 0 ? (
        <EmptyState
          title="Sem localidades"
          body="As unidades ativas aparecem aqui."
        />
      ) : null}
      {locations.data?.map((location) => (
        <V1Card key={location.id}>
          <View style={local.locationHeader}>
            <View style={local.iconBadge}>
              <MapPin size={22} color="#C49840" strokeWidth={1.8} />
            </View>
            <ThemedText type="subtitle" style={local.cardTitle}>
              {location.name}
            </ThemedText>
          </View>
          {location.address ? (
            <InfoRow icon={<MapPin size={18} color="#C49840" strokeWidth={1.8} />} text={location.address} />
          ) : null}
          {location.schedule ? (
            <InfoRow icon={<Clock size={18} color="#C49840" strokeWidth={1.8} />} text={location.schedule} />
          ) : null}
          <View style={styles.actionRow}>
            <ActionButton
              label="Abrir mapa"
              url={location.mapsUrl}
              variant="primary"
            />
            {location.whatsappUrl ? (
              <ActionButton label="WhatsApp" url={location.whatsappUrl} />
            ) : null}
          </View>
        </V1Card>
      ))}
    </V1Screen>
  );
}

function InfoRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <View style={local.infoRow}>
      {icon}
      <ThemedText type="small" themeColor="textSecondary" style={local.infoText}>
        {text}
      </ThemedText>
    </View>
  );
}

const local = StyleSheet.create({
  locationHeader: {
    gap: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(196, 152, 64, 0.14)",
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 28,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    flex: 1,
  },
});
