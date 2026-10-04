import useSWR from 'swr';
import type { HolodexChannelSummary } from '../utils/holodex';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useHolodexChannels(channelId?: string) {
  const url = channelId ? `/api/channels?id=${encodeURIComponent(channelId)}` : '/api/channels';
  const { data, error, isLoading } = useSWR<Record<string, HolodexChannelSummary>>(
    url,
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
