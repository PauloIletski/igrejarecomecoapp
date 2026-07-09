import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  createPrayerRequest,
  fetchAgendaItems,
  fetchAlbumBySlug,
  fetchAlbums,
  fetchDonation,
  fetchEventBySlug,
  fetchEvents,
  fetchLocations,
  fetchMaintenanceStatus,
  fetchPrayers,
  fetchSectionVisibility,
  registerForEvent,
  togglePrayerRecord,
  type EventRegistrationInput,
  type PrayerRequestInput,
} from '@/services/v1-data';

export const v1QueryKeys = {
  visibility: ['sections.visibility'] as const,
  maintenance: ['maintenance.status'] as const,
  agenda: ['agenda.items'] as const,
  events: ['events.list'] as const,
  event: (slug: string) => ['event.detail.slug', slug] as const,
  albums: ['albums.list'] as const,
  album: (slug: string) => ['albums.images.slug', slug] as const,
  prayers: ['prayers.list'] as const,
  donation: ['donations.items'] as const,
  locations: ['locations.list'] as const,
};

export function useSectionVisibility() {
  return useQuery({
    queryKey: v1QueryKeys.visibility,
    queryFn: fetchSectionVisibility,
    staleTime: 10 * 60 * 1000,
  });
}

export function useMaintenanceStatus() {
  return useQuery({
    queryKey: v1QueryKeys.maintenance,
    queryFn: fetchMaintenanceStatus,
    staleTime: 2 * 60 * 1000,
  });
}

export function useHomeSummary() {
  const agenda = useAgendaItems();
  const events = useEvents();
  const albums = useAlbums();
  const visibility = useSectionVisibility();

  return useMemo(
    () => ({
      agenda,
      events,
      albums,
      visibility,
      isLoading: agenda.isLoading || events.isLoading || albums.isLoading || visibility.isLoading,
      error: agenda.error ?? events.error ?? albums.error ?? visibility.error,
      refetch: () => {
        agenda.refetch();
        events.refetch();
        albums.refetch();
        visibility.refetch();
      },
    }),
    [agenda, albums, events, visibility],
  );
}

export function useAgendaItems() {
  return useQuery({
    queryKey: v1QueryKeys.agenda,
    queryFn: fetchAgendaItems,
    staleTime: 15 * 60 * 1000,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: v1QueryKeys.events,
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvent(slug: string) {
  return useQuery({
    queryKey: v1QueryKeys.event(slug),
    queryFn: () => fetchEventBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEventRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EventRegistrationInput) => registerForEvent(input),
    onSuccess: async (_data, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: v1QueryKeys.events }),
        queryClient.invalidateQueries({ queryKey: v1QueryKeys.event(input.eventId) }),
      ]);
    },
  });
}

export function useAlbums() {
  return useQuery({
    queryKey: v1QueryKeys.albums,
    queryFn: fetchAlbums,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAlbum(slug: string) {
  return useQuery({
    queryKey: v1QueryKeys.album(slug),
    queryFn: () => fetchAlbumBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePrayers() {
  return useQuery({
    queryKey: v1QueryKeys.prayers,
    queryFn: fetchPrayers,
    staleTime: 60 * 1000,
  });
}

export function useCreatePrayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PrayerRequestInput) => createPrayerRequest(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: v1QueryKeys.prayers }),
  });
}

export function useTogglePrayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      prayerRequestId,
      identity,
      shouldPray,
    }: {
      prayerRequestId: string;
      identity: string;
      shouldPray: boolean;
    }) => togglePrayerRecord(prayerRequestId, identity, shouldPray),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: v1QueryKeys.prayers }),
  });
}

export function useDonation() {
  return useQuery({
    queryKey: v1QueryKeys.donation,
    queryFn: fetchDonation,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocations() {
  return useQuery({
    queryKey: v1QueryKeys.locations,
    queryFn: fetchLocations,
    staleTime: 15 * 60 * 1000,
  });
}
