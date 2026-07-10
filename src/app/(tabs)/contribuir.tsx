import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

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
import { useCreateDonationPledge, useDonationItems, useTithesOfferings } from '@/hooks/use-v1-data';

type ContributionTab = 'tithes' | 'food';

const inputPlaceholderColor = '#6f7682';
const brand = {
  foreground: '#0D2C45',
  primary: '#C49840',
  background: '#F7F4EE',
  secondary: '#E7E2DA',
  border: '#CFC2B0',
  card: '#FFFFFF',
};

export default function ContributeScreen() {
  const [activeTab, setActiveTab] = useState<ContributionTab>('tithes');
  const tithesOfferings = useTithesOfferings();
  const donationItems = useDonationItems();
  const createDonationPledge = useCreateDonationPledge();
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [otherItems, setOtherItems] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [quantityNote, setQuantityNote] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedItemNames = useMemo(
    () => (donationItems.data ?? []).filter((item) => selectedItems[item.id]).map((item) => item.name),
    [donationItems.data, selectedItems],
  );

  const retry = () => {
    if (activeTab === 'tithes') {
      tithesOfferings.refetch();
      return;
    }
    donationItems.refetch();
  };

  return (
    <V1Screen title="Contribuir" eyebrow="dizimos, ofertas e alimentos">
      <SegmentedControl activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'tithes' ? (
        <>
          {tithesOfferings.isLoading ? <LoadingState /> : null}
          {tithesOfferings.error ? <ErrorState onRetry={retry} /> : null}
          {!tithesOfferings.isLoading && tithesOfferings.data?.length === 0 ? (
            <EmptyState title="Sem metodo ativo" body="Metodo de contribuicao indisponivel no momento." />
          ) : null}
          {tithesOfferings.data?.map((method) => (
            <V1Card key={method.id}>
              {method.qrCodeUrl ? <RemoteImage uri={method.qrCodeUrl} ratio={1} /> : null}
              {method.isFeatured ? (
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Destaque
                </ThemedText>
              ) : null}
              <ThemedText type="smallBold">{method.title}</ThemedText>
              {method.recipientName ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {method.recipientName}
                </ThemedText>
              ) : null}
              {method.description ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {method.description}
                </ThemedText>
              ) : null}
              {method.pixKey ? <ThemedText type="subtitle">{method.pixKey}</ThemedText> : null}
              {method.bankInfo ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {method.bankInfo}
                </ThemedText>
              ) : null}
              {method.bibleVerse ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {method.bibleVerse}
                </ThemedText>
              ) : null}
              <View style={styles.actionRow}>
                {method.pixKey ? (
                  <ActionButton
                    label={method.buttonLabel}
                    variant="primary"
                    onPress={async () => {
                      await Clipboard.setStringAsync(method.pixKey ?? '');
                      await Haptics.selectionAsync();
                    }}
                  />
                ) : null}
                {method.whatsappUrl ? <ActionButton label="Falar no WhatsApp" url={method.whatsappUrl} /> : null}
              </View>
            </V1Card>
          ))}
        </>
      ) : (
        <>
          {donationItems.isLoading ? <LoadingState /> : null}
          {donationItems.error ? <ErrorState onRetry={retry} /> : null}
          <V1Card>
            <ThemedText type="smallBold">Doacao de alimentos</ThemedText>
            {donationItems.data?.length ? (
              <View style={local.chipGrid}>
                {donationItems.data.map((item) => {
                  const isSelected = !!selectedItems[item.id];
                  return (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        local.chip,
                        isSelected && local.chipSelected,
                        pressed && local.pressed,
                      ]}
                      onPress={() => {
                        setSelectedItems((current) => ({
                          ...current,
                          [item.id]: !current[item.id],
                        }));
                      }}
                    >
                      <ThemedText type="smallBold" style={isSelected ? local.chipSelectedText : undefined}>
                        {item.name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ) : !donationItems.isLoading ? (
              <View style={local.inlineEmpty}>
                <ThemedText type="smallBold">Sem itens prioritarios ativos</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Use o campo de outros itens para descrever a doacao.
                </ThemedText>
              </View>
            ) : null}
            <TextInput
              value={otherItems}
              onChangeText={setOtherItems}
              placeholder="Outros itens"
              placeholderTextColor={inputPlaceholderColor}
              style={local.input}
            />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nome completo"
              placeholderTextColor={inputPlaceholderColor}
              style={local.input}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="WhatsApp"
              placeholderTextColor={inputPlaceholderColor}
              keyboardType="phone-pad"
              style={local.input}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              placeholderTextColor={inputPlaceholderColor}
              keyboardType="email-address"
              autoCapitalize="none"
              style={local.input}
            />
            <TextInput
              value={quantityNote}
              onChangeText={setQuantityNote}
              placeholder="Quantidade / observacoes"
              placeholderTextColor={inputPlaceholderColor}
              multiline
              style={local.textArea}
            />
            <TextInput
              value={plannedDate}
              onChangeText={setPlannedDate}
              placeholder="Data prevista (YYYY-MM-DD)"
              placeholderTextColor={inputPlaceholderColor}
              keyboardType="numbers-and-punctuation"
              style={local.input}
            />
            <View style={styles.actionRow}>
              <ActionButton
                label={createDonationPledge.isPending ? 'Enviando' : 'Registrar doacao'}
                variant="primary"
                disabled={createDonationPledge.isPending}
                fullWidth
                onPress={async () => {
                  const nextName = name.trim();
                  const nextPhone = phone.trim();
                  const nextEmail = email.trim();
                  const nextQuantityNote = quantityNote.trim();
                  const nextPlannedDate = plannedDate.trim();
                  const items = [...selectedItemNames, otherItems.trim()].filter(Boolean).join(', ');

                  setFormError('');
                  setSuccess('');

                  if (
                    nextName.length < 1 ||
                    nextName.length > 120 ||
                    nextPhone.length < 4 ||
                    nextPhone.length > 40 ||
                    nextEmail.length > 255 ||
                    items.length < 1 ||
                    items.length > 2000 ||
                    nextQuantityNote.length > 500 ||
                    !isValidDateInput(nextPlannedDate)
                  ) {
                    setFormError('Confira os dados e tente novamente.');
                    return;
                  }

                  try {
                    await createDonationPledge.mutateAsync({
                      name: nextName,
                      phone: nextPhone,
                      email: nextEmail || undefined,
                      items,
                      quantityNote: nextQuantityNote || undefined,
                      plannedDate: nextPlannedDate || undefined,
                    });
                    setSelectedItems({});
                    setOtherItems('');
                    setName('');
                    setPhone('');
                    setEmail('');
                    setQuantityNote('');
                    setPlannedDate('');
                    setSuccess('Doacao registrada.');
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } catch {
                    setFormError('Nao foi possivel registrar. Confira os dados e tente novamente.');
                  }
                }}
              />
            </View>
            {formError ? (
              <ThemedText type="small" themeColor="textSecondary">
                {formError}
              </ThemedText>
            ) : null}
            {success ? <ThemedText type="small">{success}</ThemedText> : null}
          </V1Card>
        </>
      )}
    </V1Screen>
  );
}

function SegmentedControl({
  activeTab,
  onChange,
}: {
  activeTab: ContributionTab;
  onChange: (tab: ContributionTab) => void;
}) {
  return (
    <View style={local.segmented}>
      <SegmentButton label="Dizimos e ofertas" selected={activeTab === 'tithes'} onPress={() => onChange('tithes')} />
      <SegmentButton label="Doacao de alimentos" selected={activeTab === 'food'} onPress={() => onChange('food')} />
    </View>
  );
}

function SegmentButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [local.segment, selected && local.segmentSelected, pressed && local.pressed]}
      onPress={onPress}
    >
      <ThemedText type="smallBold" style={selected ? local.segmentSelectedText : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function isValidDateInput(value: string) {
  if (!value) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

const local = StyleSheet.create({
  segmented: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    backgroundColor: brand.secondary,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  segmentSelected: {
    backgroundColor: brand.primary,
  },
  segmentSelectedText: {
    color: brand.foreground,
    textAlign: 'center',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: brand.background,
  },
  chipSelected: {
    backgroundColor: brand.primary,
    borderColor: brand.primary,
  },
  chipSelectedText: {
    color: brand.foreground,
  },
  inlineEmpty: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 12,
    gap: 4,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: brand.foreground,
    backgroundColor: brand.card,
  },
  textArea: {
    minHeight: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: brand.foreground,
    backgroundColor: brand.card,
  },
  pressed: {
    opacity: 0.72,
  },
});
