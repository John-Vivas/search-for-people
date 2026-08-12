import { useState, useEffect, useCallback } from 'react';
import { PersonItem } from '../types/person';
import { personService } from '../services/personService';

export function usePersons(initialData?: PersonItem[]) {
  const [items, setItems] = useState<PersonItem[]>(initialData || []);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<Error | null>(null);

  const fetchPersons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await personService.getPersons();
      if (res.data) {
        setItems(res.data);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchPersons();
    }
  }, [fetchPersons, initialData]);

  const addPersonItem = useCallback((newItem: PersonItem) => {
    setItems((prev) => {
      const updated = [newItem, ...prev];
      personService.savePersonsToStorage(updated);
      return updated;
    });
  }, []);

  return {
    items,
    setItems,
    loading,
    error,
    refetch: fetchPersons,
    addPersonItem
  };
}
