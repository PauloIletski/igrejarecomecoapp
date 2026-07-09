import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PrayerCard } from '@/features/v1/cards';
import { ActionButton, EmptyState, ErrorState, LoadingState, V1Card, V1Screen, styles } from '@/features/v1/shell';
import { useCreatePrayer, usePrayers, useTogglePrayer } from '@/hooks/use-v1-data';

const prayerIdentityKey = 'igreja-recomeco:prayer-identity';

async function getPrayerIdentity() {
  const current = await AsyncStorage.getItem(prayerIdentityKey);
  if (current) {
    return current;
  }

  const next = `mobile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await AsyncStorage.setItem(prayerIdentityKey, next);
  return next;
}

export default function PrayersScreen() {
  const prayers = usePrayers();
  const createPrayer = useCreatePrayer();
  const togglePrayer = useTogglePrayer();
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [request, setRequest] = useState('');
  const [name, setName] = useState('');

  return (
    <V1Screen title="Oracoes" eyebrow="pedidos da comunidade">
      <V1Card>
        <ThemedText type="smallBold">Novo pedido</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Seu nome (opcional)"
          placeholderTextColor="#6f7682"
          style={local.input}
        />
        <TextInput
          value={request}
          onChangeText={setRequest}
          placeholder="Escreva seu pedido"
          placeholderTextColor="#6f7682"
          multiline
          style={local.input}
        />
        <View style={styles.actionRow}>
          <ActionButton
            label={createPrayer.isPending ? 'Enviando' : 'Enviar'}
            variant="primary"
            disabled={!request.trim() || createPrayer.isPending}
            onPress={async () => {
              await createPrayer.mutateAsync({
                name: name.trim() || undefined,
                request: request.trim(),
              });
              setRequest('');
              setName('');
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          />
        </View>
        {createPrayer.error ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nao foi possivel enviar agora. Confira o Supabase e tente novamente.
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          O pedido entra em prayer_requests com RLS do projeto.
        </ThemedText>
      </V1Card>

      {prayers.isLoading ? <LoadingState /> : null}
      {prayers.error ? <ErrorState onRetry={() => prayers.refetch()} /> : null}
      {prayers.data?.length === 0 ? (
        <EmptyState title="Sem pedidos" body="Os pedidos publicados aparecem aqui." />
      ) : null}
      {prayers.data?.map((prayer) => (
        <PrayerCard
          key={prayer.id}
          prayer={prayer}
          active={!!active[prayer.id]}
          onToggle={async () => {
            if (active[prayer.id] || togglePrayer.isPending) {
              return;
            }
            setActive((current) => ({ ...current, [prayer.id]: true }));
            await togglePrayer.mutateAsync({
              prayerRequestId: prayer.id,
              identity: await getPrayerIdentity(),
            });
            await Haptics.selectionAsync();
          }}
        />
      ))}
    </V1Screen>
  );
}

const local = StyleSheet.create({
  input: {
    minHeight: 96,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8ccd2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#101828',
    backgroundColor: '#ffffff',
  },
});
