import { Image } from "expo-image";
import { Link, type Href } from "expo-router";
import { Album, Asset, requestPermissionsAsync } from "expo-media-library/next";
import { openBrowserAsync } from "expo-web-browser";
import { Download, Images, Share2, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ActionButton, EmptyState, styles as shellStyles } from "@/features/v1/shell";

import { GalleryFolder, GalleryImage } from "./types";
import { albumImageDownloadUrl, downloadGalleryImage } from "./api";
import { albumHref, albumShareUrl, albumTitle, cloudinaryImageUrl, photoShareUrl } from "./utils";

export function AlbumCard({ album, variant = "list" }: { album: GalleryFolder; variant?: "home" | "list" }) {
  const title = albumTitle(album.slug);
  const coverUrl = album.thumbnail
    ? cloudinaryImageUrl(
        album.thumbnail.public_id,
        album.thumbnail.format,
        variant === "home" ? "c_fill,w_720,h_520,q_auto" : "c_fill,w_720,h_720,q_auto",
      )
    : "";

  return (
    <Link href={albumHref(album.slug) as Href} asChild>
      <Pressable style={({ pressed }) => [local.cardPressable, pressed && shellStyles.pressed]}>
        <View style={[local.albumCard, variant === "home" ? local.albumCardHome : local.albumCardList]}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              placeholder={album.thumbnail?.blurDataUrl}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={local.albumFallback}>
              <Images size={30} color="#C49840" strokeWidth={1.8} />
            </View>
          )}
          <View style={local.albumOverlay} />
          <View style={local.albumText}>
            <ThemedText type="smallBold" style={local.albumTitle}>
              {title}
            </ThemedText>
            <ThemedText type="small" style={local.albumMeta}>
              {album.count ?? 0} fotos
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export function AlbumGrid({ albums }: { albums: GalleryFolder[] }) {
  const { width } = useWindowDimensions();
  const numColumns = width >= 520 ? 2 : 1;

  if (!albums.length) {
    return <EmptyState title="Sem albuns" body="Nenhum album disponivel no momento." />;
  }

  return (
    <FlatList
      key={numColumns}
      data={albums}
      keyExtractor={(item) => item.slug}
      numColumns={numColumns}
      renderItem={({ item }) => (
        <View style={[local.gridItem, numColumns > 1 && local.gridItemTwoColumns]}>
          <AlbumCard album={item} />
        </View>
      )}
      contentContainerStyle={local.gridContent}
      scrollEnabled={false}
    />
  );
}

export function PhotoGrid({
  images,
  onOpen,
}: {
  images: GalleryImage[];
  onOpen: (index: number) => void;
}) {
  if (!images.length) {
    return <EmptyState title="Album vazio" body="Nenhuma foto disponivel neste album." />;
  }

  return (
    <FlatList
      data={images}
      keyExtractor={(item) => item.public_id}
      numColumns={2}
      renderItem={({ item, index }) => {
        const ratio = item.width > 0 && item.height > 0 ? item.width / item.height : 1;
        return (
          <Pressable style={local.photoItem} onPress={() => onOpen(index)}>
            <Image
              source={{
                uri: cloudinaryImageUrl(item.public_id, item.format, "c_scale,w_720,q_auto"),
              }}
              placeholder={item.blurDataUrl}
              style={[local.photoImage, { aspectRatio: ratio }]}
              contentFit="cover"
              transition={200}
            />
          </Pressable>
        );
      }}
      contentContainerStyle={local.photoGridContent}
      scrollEnabled={false}
      initialNumToRender={12}
      removeClippedSubviews
    />
  );
}

export function PhotoViewer({
  images,
  title,
  slug,
  visible,
  initialIndex,
  onClose,
  onIndexChange,
}: {
  images: GalleryImage[];
  title: string;
  slug: string;
  visible: boolean;
  initialIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<GalleryImage>>(null);
  const [downloadState, setDownloadState] = useState<"idle" | "saving" | "saved" | "error" | "opened">("idle");
  const safeIndex = Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0));
  const activeImage = images[safeIndex];

  useEffect(() => {
    if (visible && images.length) {
      setDownloadState("idle");
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: safeIndex, animated: false });
      });
    }
  }, [images.length, safeIndex, visible]);

  const getItemLayout = useMemo(
    () => (_data: ArrayLike<GalleryImage> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={local.viewer}>
        <View style={local.viewerHeader}>
          <ThemedText type="smallBold" style={local.viewerTitle}>
            {title} - {safeIndex + 1}/{images.length}
          </ThemedText>
          <View style={local.viewerActions}>
            {activeImage ? (
              <>
                <Pressable style={local.viewerButton} onPress={() => sharePhoto(title, slug, safeIndex)}>
                  <Share2 size={20} color="#F7F4EE" strokeWidth={1.8} />
                </Pressable>
                <Pressable
                  disabled={downloadState === "saving"}
                  style={[local.viewerButton, downloadState === "saving" && local.viewerButtonDisabled]}
                  onPress={async () => {
                    setDownloadState("saving");
                    try {
                      const result = await savePhotoToLibrary(title, activeImage, safeIndex);
                      setDownloadState(result);
                    } catch {
                      setDownloadState("error");
                    }
                  }}
                >
                  <Download size={20} color="#F7F4EE" strokeWidth={1.8} />
                </Pressable>
              </>
            ) : null}
            <Pressable style={local.viewerButton} onPress={onClose}>
              <X size={22} color="#F7F4EE" strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>
        {downloadState !== "idle" ? (
          <View style={local.viewerNotice}>
            <ThemedText type="small" style={local.viewerNoticeText}>
              {downloadState === "saving"
                ? "Salvando foto..."
                : downloadState === "saved"
                  ? "Foto salva na galeria."
                  : downloadState === "opened"
                    ? "Abrimos a foto no navegador."
                    : "Nao foi possivel salvar. Tente novamente."}
            </ThemedText>
          </View>
        ) : null}
        <FlatList
          ref={listRef}
          data={images}
          keyExtractor={(item) => item.public_id}
          horizontal
          pagingEnabled
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            onIndexChange(nextIndex);
          }}
          renderItem={({ item }) => (
            <View style={[local.viewerPage, { width }]}>
              <Image
                source={{
                  uri: cloudinaryImageUrl(item.public_id, item.format, "c_scale,w_1600,q_auto"),
                }}
                placeholder={item.blurDataUrl}
                style={local.viewerImage}
                contentFit="contain"
                transition={200}
              />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

export async function shareAlbum(title: string, slug: string) {
  await Share.share({
    title: `${title} | Albuns Igreja Recomeco`,
    message: `Veja o album ${title} da Igreja Recomeco.\n${albumShareUrl(slug)}`,
  });
}

async function sharePhoto(title: string, slug: string, index: number) {
  await Share.share({
    title: `${title} - foto ${index + 1} | Igreja Recomeco`,
    message: `Veja a foto ${index + 1} do album ${title}.\n${photoShareUrl(slug, index)}`,
  });
}

async function savePhotoToLibrary(title: string, image: GalleryImage, index: number) {
  const downloadUrl = albumImageDownloadUrl(image, title, index);

  if (Platform.OS === "web") {
    await openBrowserAsync(downloadUrl);
    return "opened" as const;
  }

  const permission = await requestPermissionsAsync(true, ["photo"]);
  if (!permission.granted) {
    await openBrowserAsync(downloadUrl);
    return "opened" as const;
  }

  const file = await downloadGalleryImage(image, title, index);
  const asset = await Asset.create(file.uri);
  const album = await findDeviceAlbum("Igreja Recomeco");

  if (album) {
    await album.add(asset);
  } else {
    await Album.create("Igreja Recomeco", [asset], false);
  }

  return "saved" as const;
}

async function findDeviceAlbum(title: string) {
  const albums = await Album.getAll();

  for (const album of albums) {
    if ((await album.getTitle()) === title) {
      return album;
    }
  }

  return null;
}

export function AlbumShareButton({ title, slug }: { title: string; slug: string }) {
  return <ActionButton label="Compartilhar album" variant="primary" onPress={() => shareAlbum(title, slug)} />;
}

const local = StyleSheet.create({
  cardPressable: {
    flex: 1,
  },
  albumCard: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#E7E2DA",
  },
  albumCardHome: {
    aspectRatio: 16 / 11,
  },
  albumCardList: {
    aspectRatio: 1,
  },
  albumFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(196, 152, 64, 0.14)",
  },
  albumOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.32)",
  },
  albumText: {
    marginTop: "auto",
    padding: 16,
    gap: 2,
  },
  albumTitle: {
    color: "#FFFFFF",
  },
  albumMeta: {
    color: "rgba(255, 255, 255, 0.78)",
  },
  gridContent: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
    marginBottom: 12,
  },
  gridItemTwoColumns: {
    marginHorizontal: 6,
  },
  photoGridContent: {
    gap: 8,
  },
  photoItem: {
    flex: 1,
    padding: 4,
  },
  photoImage: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#E7E2DA",
  },
  viewer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  viewerHeader: {
    minHeight: 72,
    paddingTop: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  viewerTitle: {
    flex: 1,
    color: "#F7F4EE",
  },
  viewerActions: {
    flexDirection: "row",
    gap: 8,
  },
  viewerButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  viewerButtonDisabled: {
    opacity: 0.5,
  },
  viewerNotice: {
    alignSelf: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  viewerNoticeText: {
    color: "#F7F4EE",
  },
  viewerPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
  },
});
