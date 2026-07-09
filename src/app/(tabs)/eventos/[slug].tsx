import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  ActionButton,
  EmptyState,
  ErrorState,
  LoadingState,
  RemoteImage,
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
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
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

  const eyebrow = [eventData.date, eventData.time].filter(Boolean).join(' | ');
  const hasContact = Boolean(eventData.ctaUrl || eventData.secondaryCtaUrl);
  const showPayment = eventData.isPaid || eventData.investment || eventData.paymentMethods;

  return (
    <V1Screen title={eventData.title} eyebrow={eyebrow}>
      <V1Card>
        {eventData.imageUrl ? <RemoteImage uri={eventData.imageUrl} /> : null}
        {eventData.description ? <ThemedText type="small">{eventData.description}</ThemedText> : null}
        {eventData.detailContent ? <ThemedText type="small">{eventData.detailContent}</ThemedText> : null}
        {eventData.place ? (
          <ThemedText type="small" themeColor="textSecondary">
            {eventData.place}
          </ThemedText>
        ) : null}
        {eventData.spots > 0 ? (
          <ThemedText type="code">
            {eventData.registrations}/{eventData.spots} inscritos
          </ThemedText>
        ) : null}
        {showPayment ? (
          <View style={styles.grid}>
            {eventData.investment ? (
              <ThemedText type="smallBold">Investimento: {eventData.investment}</ThemedText>
            ) : null}
            {eventData.paymentMethods ? (
              <ThemedText type="small" themeColor="textSecondary">
                {eventData.paymentMethods}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </V1Card>

      {hasContact ? (
        <V1Card>
          <ThemedText type="smallBold">Contato</ThemedText>
          <View style={styles.actionRow}>
            {eventData.ctaUrl ? (
              <ActionButton label={eventData.ctaLabel || 'Contato'} url={eventData.ctaUrl} variant="primary" />
            ) : null}
            {eventData.secondaryCtaUrl ? (
              <ActionButton
                label={eventData.secondaryCtaLabel || 'Contato'}
                url={eventData.secondaryCtaUrl}
              />
            ) : null}
          </View>
        </V1Card>
      ) : null}

      {eventData.registrationFormEnabled ? (
      <V1Card>
        <ThemedText type="smallBold">Inscricao rapida</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome completo"
          placeholderTextColor="#6f7682"
          style={inputStyles.input}
        />
        <TextInput
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="WhatsApp"
          placeholderTextColor="#6f7682"
          keyboardType="phone-pad"
          style={inputStyles.input}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          placeholderTextColor="#6f7682"
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyles.input}
        />
        <View style={styles.actionRow}>
          <ActionButton
            label={sent ? 'Inscrito' : registration.isPending ? 'Enviando' : 'Confirmar'}
            variant="primary"
            disabled={sent || registration.isPending}
            onPress={async () => {
              const fullName = name.trim();
              const phone = whatsapp.trim();
              const emailValue = email.trim();
              if (fullName.length < 2 || fullName.length > 120 || phone.length < 8 || phone.length > 40) {
                setFormError('Informe nome completo e WhatsApp validos.');
                if (Platform.OS !== 'web') {
                  Alert.alert('Informe nome completo e WhatsApp validos.');
                }
                return;
              }
              if (emailValue.length > 255) {
                setFormError('Informe um e-mail menor.');
                return;
              }
              setFormError('');
              await registration.mutateAsync({
                eventId: eventData.id,
                eventTitle: eventData.title,
                fullName,
                whatsapp: phone,
                email: emailValue || undefined,
              });
              setSent(true);
            }}
          />
        </View>
        {formError ? (
          <ThemedText type="small" themeColor="textSecondary">
            {formError}
          </ThemedText>
        ) : null}
        {registration.error ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nao foi possivel enviar. Confira os dados e tente novamente.
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          {sent ? 'Inscricao registrada.' : 'Preencha os dados para confirmar sua inscricao.'}
        </ThemedText>
      </V1Card>
      ) : null}
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
