// src/components/floating-back-button.tsx

import { Href, router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";

type FloatingBackButtonProps = {
  fallbackHref?: Href;
};

export function FloatingBackButton({
  fallbackHref = "/",
}: FloatingBackButtonProps) {
  const insets = useSafeAreaInsets();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  }

  return (
    <Pressable
      onPress={handleBack}
      style={({ pressed }) => [
        styles.button,
        {
          top: insets.top + 12,
        },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText type="smallBold" style={styles.text}>
        Voltar
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 16,
    zIndex: 999,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#C49840",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#0D2C45",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 6,
  },
  text: {
    color: "#0D2C45",
  },
  pressed: {
    opacity: 0.72,
  },
});
