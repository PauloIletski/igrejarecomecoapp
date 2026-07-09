import { AgendaCard } from '@/features/v1/cards';
import { EmptyState, ErrorState, LoadingState, V1Screen } from '@/features/v1/shell';
import { useAgendaItems } from '@/hooks/use-v1-data';

export default function AgendaScreen() {
  const agenda = useAgendaItems();

  return (
    <V1Screen title="Agenda" eyebrow="cultos e encontros">
      {agenda.isLoading ? <LoadingState /> : null}
      {agenda.error ? <ErrorState onRetry={() => agenda.refetch()} /> : null}
      {agenda.data?.length === 0 ? (
        <EmptyState title="Nada publicado" body="Quando a agenda estiver publicada, aparece aqui." />
      ) : (
        agenda.data?.map((item) => <AgendaCard key={item.id} item={item} />)
      )}
    </V1Screen>
  );
}
