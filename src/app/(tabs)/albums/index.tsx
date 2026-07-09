import { AlbumCard } from '@/features/v1/cards';
import { EmptyState, ErrorState, LoadingState, V1Screen } from '@/features/v1/shell';
import { useAlbums } from '@/hooks/use-v1-data';

export default function AlbumsScreen() {
  const albums = useAlbums();

  return (
    <V1Screen title="Albuns" eyebrow="fotos da comunidade">
      {albums.isLoading ? <LoadingState /> : null}
      {albums.error ? <ErrorState onRetry={() => albums.refetch()} /> : null}
      {albums.data?.length === 0 ? (
        <EmptyState title="Sem albuns" body="Fotos publicadas no site aparecem aqui tambem." />
      ) : (
        albums.data?.map((album) => <AlbumCard key={album.id} album={album} />)
      )}
    </V1Screen>
  );
}
