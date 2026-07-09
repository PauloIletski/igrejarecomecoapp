import { EventCard } from '@/features/v1/cards';
import { EmptyState, ErrorState, LoadingState, V1Screen } from '@/features/v1/shell';
import { useEvents } from '@/hooks/use-v1-data';

export default function EventsScreen() {
  const events = useEvents();

  return (
    <V1Screen title="Eventos" eyebrow="inscricoes abertas">
      {events.isLoading ? <LoadingState /> : null}
      {events.error ? <ErrorState onRetry={() => events.refetch()} /> : null}
      {events.data?.length === 0 ? (
        <EmptyState title="Sem eventos" body="Novas programacoes aparecem aqui quando publicadas." />
      ) : (
        events.data?.map((event) => <EventCard key={event.id} event={event} />)
      )}
    </V1Screen>
  );
}
