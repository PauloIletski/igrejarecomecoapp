import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState, ErrorState, LoadingState, RemoteImage, V1Card, V1Screen, styles } from '@/features/v1/shell';
import { useAlbum } from '@/hooks/use-v1-data';

export default function AlbumDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const album = useAlbum(slug);

  if (album.isLoading) {
    return (
      <V1Screen title="Album" eyebrow="carregando">
        <LoadingState />
      </V1Screen>
    );
  }

  if (album.error) {
    return (
      <V1Screen title="Album" eyebrow="erro">
        <ErrorState onRetry={() => album.refetch()} />
      </V1Screen>
    );
  }

  if (!album.data) {
    return (
      <V1Screen title="Album" eyebrow="nao encontrado">
        <EmptyState title="Album indisponivel" body="Volte para a lista e escolha outro album." />
      </V1Screen>
    );
  }

  return (
    <V1Screen title={album.data.title} eyebrow={album.data.date}>
      <View style={styles.grid}>
        {album.data.photos.map((photo, index) => (
          <V1Card key={photo}>
            <RemoteImage uri={photo} />
            <ThemedText type="code">foto {index + 1}</ThemedText>
          </V1Card>
        ))}
      </View>
    </V1Screen>
  );
}
