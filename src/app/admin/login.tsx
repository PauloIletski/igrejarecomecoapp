import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ActionButton, V1Card, V1Screen, styles } from '@/features/v1/shell';
import { getSupabase } from '@/lib/supabase';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <V1Screen title="Admin" eyebrow="login">
      <V1Card>
        <ThemedText type="smallBold">Acesso restrito</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Use o mesmo Supabase Auth do painel web quando as credenciais estiverem configuradas.
        </ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="email"
          placeholderTextColor="#6f7682"
          keyboardType="email-address"
          autoCapitalize="none"
          style={local.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="senha"
          placeholderTextColor="#6f7682"
          secureTextEntry
          style={local.input}
        />
        <View style={styles.actionRow}>
          <ActionButton
            label={submitting ? 'Entrando' : 'Entrar'}
            variant="primary"
            disabled={!email || !password || submitting}
            onPress={async () => {
              setError('');
              setSubmitting(true);
              try {
                const { error: signInError } = await getSupabase().auth.signInWithPassword({
                  email,
                  password,
                });
                if (signInError) {
                  throw signInError;
                }
                router.replace('/admin');
              } catch {
                setError('Nao foi possivel entrar. Confira email, senha e env do Supabase.');
              } finally {
                setSubmitting(false);
              }
            }}
          />
        </View>
        {error ? (
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
        ) : null}
      </V1Card>
    </V1Screen>
  );
}

const local = StyleSheet.create({
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
