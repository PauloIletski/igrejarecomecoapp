import { Image } from "expo-image";
import {
  StyleSheet,
  useColorScheme,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";

const colorLogo = require("@/assets/images/brand/recomeco-symbol-color.png");
const lightLogo = require("@/assets/images/brand/recomeco-symbol-light.png");

type BrandLogoProps = {
  tone?: "color" | "light";
  size?: "small" | "medium";
  showName?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function BrandLogo({
  tone,
  size = "medium",
  showName = true,
  style,
}: BrandLogoProps) {
  const colorScheme = useColorScheme();
  const logoTone = tone ?? (colorScheme === "dark" ? "light" : "color");
  const imageSize = size === "small" ? 32 : 48;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={logoTone === "light" ? lightLogo : colorLogo}
        style={{ width: imageSize, height: imageSize }}
        contentFit="contain"
        transition={150}
        accessibilityLabel="Logo Igreja Recomeco"
      />
      {showName ? (
        <View style={styles.nameGroup}>
          <ThemedText type={size === "small" ? "smallBold" : "subtitle"}>
            Igreja Recomeco
          </ThemedText>
          {size === "medium" ? (
            <ThemedText type="small" themeColor="textSecondary">
              Deus recomeça histórias
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  nameGroup: {
    flexShrink: 1,
    minWidth: 0,
  },
});
