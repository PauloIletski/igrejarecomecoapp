import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  AlbumShareButton,
  PhotoGrid,
  PhotoViewer,
} from "@/features/albums/components";
import { albumTitle } from "@/features/albums/utils";
import { EmptyState, ErrorState, LoadingState, V1Screen, styles } from "@/features/v1/shell";
import { useAlbum } from "@/hooks/use-v1-data";

export default function AlbumDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[]; photoId?: string }>();
  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug ?? "";
  const title = albumTitle(slug);
  const album = useAlbum(slug);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const initialPhotoId = useMemo(() => {
    const parsed = Number(params.photoId);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
  }, [params.photoId]);

  useEffect(() => {
    if (album.data?.length && initialPhotoId !== null && initialPhotoId < album.data.length) {
      setViewerIndex(initialPhotoId);
    }
  }, [album.data?.length, initialPhotoId]);

  if (album.isLoading) {
    return (
      <V1Screen title="Album" eyebrow="carregando" showBackButton>
        <LoadingState />
      </V1Screen>
    );
  }

  if (album.error) {
    return (
      <V1Screen title="Album" eyebrow="erro" showBackButton>
        <ErrorState onRetry={() => album.refetch()} />
      </V1Screen>
    );
  }

  if (!slug) {
    return (
      <V1Screen title="Album" eyebrow="nao encontrado" showBackButton>
        <EmptyState title="Album indisponivel" body="Volte para a lista e escolha outro album." />
      </V1Screen>
    );
  }

  const images = album.data ?? [];

  return (
    <V1Screen title={title} eyebrow="album" showBackButton>
      <View style={styles.grid}>
        <ThemedText type="small" themeColor="textSecondary">
          {images.length ? `${images.length} fotos` : "Nenhuma foto publicada neste album."}
        </ThemedText>
        <View style={styles.actionRow}>
          <AlbumShareButton title={title} slug={slug} />
        </View>
      </View>
      <PhotoGrid images={images} onOpen={setViewerIndex} />
      <PhotoViewer
        images={images}
        title={title}
        slug={slug}
        visible={viewerIndex !== null}
        initialIndex={viewerIndex ?? 0}
        onIndexChange={setViewerIndex}
        onClose={() => {
          setViewerIndex(null);
          if (params.photoId) {
            router.setParams({ photoId: undefined });
          }
        }}
      />
    </V1Screen>
  );
}
