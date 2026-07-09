import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  ActionButton,
  EmptyState,
  ErrorState,
  LoadingState,
  V1Card,
  V1Screen,
  styles,
} from '@/features/v1/shell';
import { useEvent, useEventRegistration } from '@/hooks/use-v1-data';

export default function EventDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const event = useEvent(slug);
  const registration = useEventRegistration();
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);

  if (event.isLoading) {
    return (
      <V1Screen title="Evento" eyebrow="carregando">
        <LoadingState />
      </V1Screen>
    );
  }

  if (event.error) {
    return (
      <V1Screen title="Evento" eyebrow="erro">
        <ErrorState onRetry={() => event.refetch()} />
      </V1Screen>
    );
  }

  const eventData = event.data;

  if (!eventData) {
    return (
      <V1Screen title="Evento" eyebrow="nao encontrado">
        <EmptyState title="Evento indisponivel" body="Volte para a lista e escolha outro evento." />
      </V1Screen>
    );
  }

  return (
    <V1Screen title={eventData.title} eyebrow={`${eventData.date} | ${eventData.time}`}>
      <V1Card>
        <ThemedText type="small">{eventData.description}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {eventData.place}
        </ThemedText>
        <ThemedText type="code">
          {eventData.registrations}/{eventData.spots} inscritos
        </ThemedText>
      </V1Card>

      <V1Card>
        <ThemedText type="smallBold">Inscricao rapida</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
          placeholderTextColor="#6f7682"
          style={inputStyles.input}
        />
        <View style={styles.actionRow}>
          <ActionButton
            label={sent ? 'Inscrito' : registration.isPending ? 'Enviando' : 'Confirmar'}
            variant="primary"
            disabled={sent || registration.isPending}
            onPress={async () => {
              if (!name.trim()) {
                if (Platform.OS !== 'web') {
                  Alert.alert('Informe seu nome');
                }
                return;
              }
              await registration.mutateAsync({ eventId: eventData.id, name: name.trim() });
              setSent(true);
            }}
          />
        </View>
        {registration.error ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nao foi possivel enviar agora. Confira o Supabase e tente novamente.
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          {sent ? 'Inscricao registrada.' : 'Os dados sao enviados para event_registrations.'}
        </ThemedText>
      </V1Card>
    </V1Screen>
  );
}

const inputStyles = StyleSheet.create({
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8ccd2',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#101828',
    backgroundColor: '#ffffff',
  },
});
