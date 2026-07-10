import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { AlbumGrid } from "@/features/albums/components";
import { ErrorState, LoadingState, V1Screen, styles } from "@/features/v1/shell";
import { useAlbums } from "@/hooks/use-v1-data";

export default function AlbumsScreen() {
  const albums = useAlbums();

  return (
    <V1Screen title="Albuns" eyebrow="memorias da igreja" showBackButton>
      <View style={styles.grid}>
        <ThemedText type="small" themeColor="textSecondary">
          Fotos dos cultos, celebracoes e encontros da Igreja Recomeco.
        </ThemedText>
      </View>
      {albums.isLoading ? <LoadingState /> : null}
      {albums.error ? <ErrorState onRetry={() => albums.refetch()} /> : null}
      {!albums.isLoading && !albums.error ? <AlbumGrid albums={albums.data ?? []} /> : null}
    </V1Screen>
  );
}
