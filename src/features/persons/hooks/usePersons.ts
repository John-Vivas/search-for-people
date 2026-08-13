import { useState, useEffect, useCallback } from 'react';
import { PersonItem } from '@/src/features/persons/types/person';
import { personService } from '@/src/features/persons/services/personService';
import { isMockMode } from '@/src/lib/dataSource';

export function usePersons() {
  const [items, setItems] = useState<PersonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersons = useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await personService.getCatalogItems();
    if (res.error) {
      setError(res.error.message);
      setItems([]);
    } else {
      setItems(res.data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  useEffect(() => {
    if (isMockMode() && items.length > 0) {
      personService.savePersonsToStorage(items);
    }
  }, [items]);

  const getPersonById = useCallback(async (id: string): Promise<PersonItem | null> => {
    const cached = items.find((p) => p.id === id);
    if (cached) return cached;

    const res = await personService.getCatalogItemById(id);
    if (res.error) {
      setError(res.error.message);
      return null;
    }
    return res.data;
  }, [items]);

  const addPersonItem = useCallback((newItem: PersonItem) => {
    setItems((prev) => [newItem, ...prev]);
  }, []);

  return {
    items,
    setItems,
    loading,
    error,
    refetch: fetchPersons,
    getPersonById,
    addPersonItem,
  };
}
