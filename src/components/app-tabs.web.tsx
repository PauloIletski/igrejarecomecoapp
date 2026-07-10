import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import { ExternalLink } from "./external-link";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import { BrandLogo } from "@/components/brand-logo";
import { Colors, MaxContentWidth, Spacing } from "@/constants/theme";
import { env } from "@/lib/env";

const siteUrl = env.siteUrl || "https://igrejarecomeco.site";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="agenda" href="/agenda" asChild>
            <TabButton>Agenda</TabButton>
          </TabTrigger>
          <TabTrigger name="eventos" href="/eventos" asChild>
            <TabButton>Eventos</TabButton>
          </TabTrigger>
          <TabTrigger name="mais" href="/mais" asChild>
            <TabButton>Mais</TabButton>
          </TabTrigger>
          <TabTrigger
            name="contribuir"
            href="/contribuir"
            style={styles.hiddenRouteTrigger}
          />
          <TabTrigger
            name="localidades"
            href="/localidades"
            style={styles.hiddenRouteTrigger}
          />
          <TabTrigger
            name="oracoes"
            href="/oracoes"
            style={styles.hiddenRouteTrigger}
          />
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? "backgroundSelected" : "backgroundElement"}
        style={styles.tabButtonView}
      >
        <ThemedText
          type="small"
          themeColor={isFocused ? "text" : "textSecondary"}
        >
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? "light"];

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <BrandLogo size="small" style={styles.brandText} />

        {props.children}

        <ExternalLink href={siteUrl} asChild>
          <Pressable style={styles.externalPressable}>
            <ThemedText type="link">Site</ThemedText>
            <SymbolView tintColor={colors.text} name="link" size={12} />
          </Pressable>
        </ExternalLink>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: "absolute",
    width: "100%",
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: "auto",
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  externalPressable: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
  hiddenRouteTrigger: {
    width: 0,
    height: 0,
    overflow: "hidden",
  },
});
