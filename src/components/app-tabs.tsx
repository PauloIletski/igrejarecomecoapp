import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? "light"];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon src={require("@/assets/images/tabIcons/home.png")} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="agenda">
        <Label>Agenda</Label>
        <Icon src={require("@/assets/images/tabIcons/explore.png")} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="eventos">
        <Label>Eventos</Label>
        <Icon src={require("@/assets/images/tabIcons/explore.png")} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mais">
        <Label>Mais</Label>
        <Icon src={require("@/assets/images/tabIcons/explore.png")} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="albums" hidden />
      <NativeTabs.Trigger name="contribuir" hidden />
      <NativeTabs.Trigger name="localidades" hidden />
      <NativeTabs.Trigger name="oracoes" hidden />
    </NativeTabs>
  );
}
