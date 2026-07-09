import { ThemedText } from '@/components/themed-text';
import { V1Card, V1Screen } from '@/features/v1/shell';

export default function AdminScreen() {
  return (
    <V1Screen title="Admin" eyebrow="gate V1">
      <V1Card>
        <ThemedText type="smallBold">Permissao necessaria</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Area administrativa completa permanece no painel web. App mobile valida acesso antes de
          exibir qualquer modulo privado.
        </ThemedText>
      </V1Card>
    </V1Screen>
  );
}
