import useSWR from 'swr';
import type { HolodexChannelSummary } from '../utils/holodex';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useHolodexChannels() {
  const { data, error, isLoading } = useSWR<Record<string, HolodexChannelSummary>>(
    '/api/channels',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60 * 60 * 1000,
    },
  );

  return {
    channels: data || {},
    isLoading,
    isError: !!error,
  };
}
