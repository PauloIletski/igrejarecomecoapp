import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ActionButton, EmptyState, ErrorState, LoadingState, V1Card, V1Screen, styles } from '@/features/v1/shell';
import { useLocations } from '@/hooks/use-v1-data';

export default function LocationsScreen() {
  const locations = useLocations();

  return (
    <V1Screen title="Localidades" eyebrow="onde congregar">
      {locations.isLoading ? <LoadingState /> : null}
      {locations.error ? <ErrorState onRetry={() => locations.refetch()} /> : null}
      {locations.data?.length === 0 ? (
        <EmptyState title="Sem localidades" body="As unidades ativas aparecem aqui." />
      ) : null}
      {locations.data?.map((location) => (
        <V1Card key={location.id}>
          <ThemedText type="smallBold">{location.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {location.address}
          </ThemedText>
          <ThemedText type="code">{location.schedule}</ThemedText>
          <View style={styles.actionRow}>
            <ActionButton label="Abrir mapa" url={location.mapsUrl} variant="primary" />
            {location.whatsappUrl ? <ActionButton label="WhatsApp" url={location.whatsappUrl} /> : null}
          </View>
        </V1Card>
      ))}
    </V1Screen>
  );
}
