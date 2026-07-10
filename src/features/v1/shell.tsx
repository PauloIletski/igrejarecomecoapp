import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { ReactNode } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandLogo } from "@/components/brand-logo";
import { FloatingBackButton } from "@/components/ui/floating-back-button";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ScreenProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  showBackButton?: boolean;
};

export function V1Screen({
  title,
  eyebrow,
  children,
  showBackButton,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      {showBackButton && <FloatingBackButton />}
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, Spacing.three),
            paddingBottom: insets.bottom + BottomTabInset + Spacing.five,
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <BrandLogo />
            <View style={styles.headerCopy}>
              {eyebrow ? (
                <ThemedText
                  type="smallBold"
                  themeColor="primary"
                  style={styles.eyebrow}
                >
                  {eyebrow}
                </ThemedText>
              ) : null}
              <ThemedText type="subtitle" style={styles.title}>
                {title}
              </ThemedText>
            </View>
          </View>
          {children}
        </SafeAreaView>
      </ScrollView>
    </>
  );
}

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function V1Card({ children, style }: CardProps) {
  return (
    <ThemedView type="backgroundElement" style={[styles.card, style]}>
      {children}
    </ThemedView>
  );
}

type ActionProps = {
  label: string;
  href?: Href;
  url?: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  fullWidth?: boolean;
};

export function ActionButton({
  label,
  href,
  url,
  onPress,
  variant = "secondary",
  disabled = false,
  fullWidth = false,
}: ActionProps) {
  const theme = useTheme();
  const button = [
    styles.action,
    fullWidth && styles.actionFullWidth,
    variant === "primary" && styles.actionPrimary,
    variant !== "primary" && { borderColor: theme.border },
    disabled && styles.disabled,
  ];
  const text = variant === "primary" ? styles.actionPrimaryText : undefined;

  if (href) {
    return (
      <Pressable
        disabled={disabled}
        style={({ pressed }) => [
          button,
          pressed && !disabled && styles.pressed,
        ]}
        onPress={() => {
          if (disabled) return;

          router.push(href);
        }}
      >
        <ThemedText type="smallBold" style={text}>
          {label}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [button, pressed && !disabled && styles.pressed]}
      onPress={() => {
        if (disabled) return;

        if (onPress) {
          onPress();
          return;
        }
        if (url) {
          Linking.openURL(url);
        }
      }}
    >
      <ThemedText type="smallBold" style={text}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <V1Card>
      <ThemedText type="smallBold">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {body}
      </ThemedText>
    </V1Card>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <V1Card>
      <ThemedText type="smallBold">{label}</ThemedText>
    </V1Card>
  );
}

export function ErrorState({
  title = "Nao foi possivel carregar",
  body = "Verifique a conexao e tente novamente.",
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <V1Card>
      <ThemedText type="smallBold">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {body}
      </ThemedText>
      {onRetry ? (
        <View style={styles.actionRow}>
          <ActionButton
            label="Tentar novamente"
            onPress={onRetry}
            variant="primary"
          />
        </View>
      ) : null}
    </V1Card>
  );
}

export function RemoteImage({
  uri,
  ratio = 16 / 10,
}: {
  uri: string;
  ratio?: number;
}) {
  return (
    <Image
      source={{ uri }}
      style={[styles.image, { aspectRatio: ratio }]}
      contentFit="cover"
      transition={200}
    />
  );
}

export const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  safeArea: {
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.two,
  },
  headerCopy: {
    gap: Spacing.one,
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    lineHeight: 38,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#CFC2B0",
    padding: 20,
    gap: Spacing.two,
    shadowColor: "#0D2C45",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  grid: {
    gap: Spacing.three,
  },
  image: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "#E7E2DA",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  action: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  actionFullWidth: {
    width: "100%",
  },
  actionPrimary: {
    backgroundColor: "#C49840",
    borderColor: "#C49840",
    shadowColor: "#0D2C45",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },
  actionPrimaryText: {
    color: "#0D2C45",
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.56,
  },
});
