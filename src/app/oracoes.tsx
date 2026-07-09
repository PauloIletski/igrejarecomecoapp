import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { StyleSheet, Switch, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { FloatingBackButton } from "@/components/ui/floating-back-button";
import { PrayerCard } from "@/features/v1/cards";
import {
  ActionButton,
  EmptyState,
  ErrorState,
  LoadingState,
  V1Card,
  V1Screen,
  styles,
} from "@/features/v1/shell";
import {
  useCreatePrayer,
  usePrayers,
  useTogglePrayer,
} from "@/hooks/use-v1-data";

const prayerIdentityKey = "igreja-recomeco:prayer-identity";
const prayerActiveIdsKey = "igreja-recomeco:prayer-active-ids";

async function getPrayerIdentity() {
  const current = await AsyncStorage.getItem(prayerIdentityKey);
  if (current) {
    return current;
  }

  const next = `mobile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await AsyncStorage.setItem(prayerIdentityKey, next);
  return next;
}

async function getActivePrayerIds() {
  const current = await AsyncStorage.getItem(prayerActiveIdsKey);
  if (!current) {
    return {};
  }

  try {
    const parsed = JSON.parse(current);
    if (!Array.isArray(parsed)) {
      return {};
    }

    return parsed.reduce<Record<string, boolean>>((ids, id) => {
      if (typeof id === "string" && id) {
        ids[id] = true;
      }
      return ids;
    }, {});
  } catch {
    return {};
  }
}

async function setActivePrayerIds(active: Record<string, boolean>) {
  const ids = Object.keys(active).filter((id) => active[id]);
  await AsyncStorage.setItem(prayerActiveIdsKey, JSON.stringify(ids));
}

export default function PrayersScreen() {
  const prayers = usePrayers();
  const createPrayer = useCreatePrayer();
  const togglePrayer = useTogglePrayer();
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [countDelta, setCountDelta] = useState<Record<string, number>>({});
  const [request, setRequest] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowPublic, setAllowPublic] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    getActivePrayerIds().then((ids) => {
      if (mounted) {
        setActive(ids);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <FloatingBackButton fallbackHref="/" />
      <V1Screen title="Oracoes" eyebrow="pedidos da comunidade">
        <V1Card>
          <ThemedText type="smallBold">Novo pedido</ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Seu nome (opcional)"
            placeholderTextColor="#6f7682"
            style={local.compactInput}
            editable={!isAnonymous}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Telefone (opcional)"
            placeholderTextColor="#6f7682"
            keyboardType="phone-pad"
            style={local.compactInput}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="E-mail (opcional)"
            placeholderTextColor="#6f7682"
            keyboardType="email-address"
            autoCapitalize="none"
            style={local.compactInput}
          />
          <TextInput
            value={request}
            onChangeText={setRequest}
            placeholder="Escreva seu pedido"
            placeholderTextColor="#6f7682"
            multiline
            style={local.input}
          />
          <View style={local.switchRow}>
            <View style={local.switchText}>
              <ThemedText type="smallBold">Enviar como anonimo</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Seu nome nao aparece no mural.
              </ThemedText>
            </View>
            <Switch value={isAnonymous} onValueChange={setIsAnonymous} />
          </View>
          <View style={local.switchRow}>
            <View style={local.switchText}>
              <ThemedText type="smallBold">Mostrar no mural</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Se desligado, o pedido fica privado para intercessao.
              </ThemedText>
            </View>
            <Switch value={allowPublic} onValueChange={setAllowPublic} />
          </View>
          <View style={styles.actionRow}>
            <ActionButton
              label={createPrayer.isPending ? "Enviando" : "Enviar"}
              variant="primary"
              disabled={!request.trim() || createPrayer.isPending}
              onPress={async () => {
                const nextRequest = request.trim();
                const nextName = isAnonymous ? "" : name.trim();
                const nextPhone = phone.trim();
                const nextEmail = email.trim();

                setFormError("");
                setSuccess("");

                if (
                  nextRequest.length < 1 ||
                  nextRequest.length > 2000 ||
                  nextName.length > 120 ||
                  nextPhone.length > 40 ||
                  nextEmail.length > 255
                ) {
                  setFormError("Confira os dados e tente novamente.");
                  return;
                }

                await createPrayer.mutateAsync({
                  name: nextName || undefined,
                  phone: nextPhone || undefined,
                  email: nextEmail || undefined,
                  request: nextRequest,
                  isAnonymous,
                  allowPublic,
                });
                setRequest("");
                setName("");
                setPhone("");
                setEmail("");
                setIsAnonymous(false);
                setAllowPublic(false);
                setSuccess("Pedido enviado.");
                await Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }}
            />
          </View>
          {formError ? (
            <ThemedText type="small" themeColor="textSecondary">
              {formError}
            </ThemedText>
          ) : null}
          {createPrayer.error ? (
            <ThemedText type="small" themeColor="textSecondary">
              Nao foi possivel enviar agora. Confira o Supabase e tente
              novamente.
            </ThemedText>
          ) : null}
          {success ? <ThemedText type="small">{success}</ThemedText> : null}
        </V1Card>

        {prayers.isLoading ? <LoadingState /> : null}
        {prayers.error ? (
          <ErrorState onRetry={() => prayers.refetch()} />
        ) : null}
        {prayers.data?.length === 0 ? (
          <EmptyState
            title="Sem pedidos"
            body="Os pedidos publicados aparecem aqui."
          />
        ) : null}
        {prayers.data?.map((prayer) => (
          <PrayerCard
            key={prayer.id}
            prayer={prayer}
            active={!!active[prayer.id]}
            countDelta={countDelta[prayer.id] ?? 0}
            disabled={togglePrayer.isPending}
            onToggle={async () => {
              if (togglePrayer.isPending) {
                return;
              }

              const shouldPray = !active[prayer.id];
              const previousActive = active;
              const nextActive = { ...active, [prayer.id]: shouldPray };
              const nextDelta = shouldPray ? 1 : -1;

              if (!shouldPray) {
                delete nextActive[prayer.id];
              }

              setActive(nextActive);
              setCountDelta((current) => ({
                ...current,
                [prayer.id]: nextDelta,
              }));

              try {
                await setActivePrayerIds(nextActive);
                await togglePrayer.mutateAsync({
                  prayerRequestId: prayer.id,
                  identity: await getPrayerIdentity(),
                  shouldPray,
                });
                await Haptics.selectionAsync();
              } catch {
                setActive(previousActive);
                await setActivePrayerIds(previousActive);
              } finally {
                setCountDelta((current) => {
                  const next = { ...current };
                  delete next[prayer.id];
                  return next;
                });
              }
            }}
          />
        ))}
      </V1Screen>
    </>
  );
}

const local = StyleSheet.create({
  compactInput: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c8ccd2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#101828",
    backgroundColor: "#ffffff",
  },
  input: {
    minHeight: 96,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c8ccd2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#101828",
    backgroundColor: "#ffffff",
  },
  switchRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
});
