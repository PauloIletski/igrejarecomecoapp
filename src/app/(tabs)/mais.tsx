import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ActionButton, V1Card, V1Screen, styles } from '@/features/v1/shell';

export default function MoreScreen() {
  return (
    <V1Screen title="Mais" eyebrow="atalhos">
      <V1Card>
        <ThemedText type="smallBold">Participar</ThemedText>
        <View style={styles.actionRow}>
          <ActionButton label="Albuns" href="/albums" />
          <ActionButton label="Oracoes" href="/oracoes" />
          <ActionButton label="Contribuir" href="/contribuir" />
          <ActionButton label="Localidades" href="/localidades" />
        </View>
      </V1Card>
    </V1Screen>
  );
}
