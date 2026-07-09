import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ActionButton, EmptyState, ErrorState, LoadingState, V1Card, V1Screen, styles } from '@/features/v1/shell';
import { useDonation } from '@/hooks/use-v1-data';

export default function ContributeScreen() {
  const donation = useDonation();

  return (
    <V1Screen title="Contribuir" eyebrow="dizimos e ofertas">
      {donation.isLoading ? <LoadingState /> : null}
      {donation.error ? <ErrorState onRetry={() => donation.refetch()} /> : null}
      {!donation.isLoading && !donation.data?.pixKey ? (
        <EmptyState title="Sem metodo ativo" body="Metodo de contribuicao indisponivel no momento." />
      ) : (
        <V1Card>
          <ThemedText type="smallBold">Pix</ThemedText>
          <ThemedText type="subtitle">{donation.data?.pixKey}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {donation.data?.note}
          </ThemedText>
          <View style={styles.actionRow}>
            <ActionButton
              label="Copiar Pix"
              variant="primary"
              disabled={!donation.data?.pixKey}
              onPress={async () => {
                if (!donation.data?.pixKey) {
                  return;
                }
                await Clipboard.setStringAsync(donation.data.pixKey);
                await Haptics.selectionAsync();
              }}
            />
            {donation.data?.whatsappUrl ? (
              <ActionButton label="Falar no WhatsApp" url={donation.data.whatsappUrl} />
            ) : null}
          </View>
        </V1Card>
      )}
    </V1Screen>
  );
}
