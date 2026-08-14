import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { aidRequestsService } from '@/src/features/aid/services/aidRequests.service';
import type { AidRequest } from '@/src/features/aid/types/aid';

interface UseAidRequestsResult {
  requests: AidRequest[];
  loading: boolean;
  error: string | null;
  live: boolean;
  refetch: () => Promise<void>;
}

function sortByCreatedDesc(rows: AidRequest[]): AidRequest[] {
  return [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Loads aid requests and keeps them in sync in real time via Supabase Realtime.
 * Falls back gracefully (just the initial fetch) if realtime is unavailable.
 */
export function useAidRequests(): UseAidRequestsResult {
  const [requests, setRequests] = useState<AidRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const requestsRef = useRef<AidRequest[]>([]);

  const setBoth = useCallback((rows: AidRequest[]) => {
    const sorted = sortByCreatedDesc(rows);
    requestsRef.current = sorted;
    setRequests(sorted);
  }, []);

  const refetch = useCallback(async () => {
    const res = await aidRequestsService.list();
    if (res.error) {
      setError(res.error.message ?? 'Error al cargar solicitudes');
    } else {
      setError(null);
      setBoth(res.data ?? []);
    }
    setLoading(false);
  }, [setBoth]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('aid_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'aid_requests' },
        (payload) => {
          const current = requestsRef.current;
          if (payload.eventType === 'INSERT') {
            const row = payload.new as AidRequest;
            if (current.some((r) => r.id === row.id)) return;
            setBoth([row, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as AidRequest;
            setBoth(current.map((r) => (r.id === row.id ? row : r)));
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as Partial<AidRequest>;
            setBoth(current.filter((r) => r.id !== oldRow.id));
          }
        }
      )
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setBoth]);

  return { requests, loading, error, live, refetch };
}
