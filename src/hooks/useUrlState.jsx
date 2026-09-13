import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      sort: searchParams.get('sort') || '',
      order: searchParams.get('order') || 'asc',
      page: parseInt(searchParams.get('page') || '1', 10),
    }),
    [searchParams]
  );

  const setParams = useCallback(
    (newParams) => {
      setSearchParams((prev) => {
        const updated = new URLSearchParams(prev);
        Object.entries(newParams).forEach(([key, value]) => {
          if (value === '' || value === null || value === undefined) {
            updated.delete(key);
          } else {
            updated.set(key, String(value));
          }
        });
        return updated;
      });
    },
    [setSearchParams]
  );

  const resetPage = useCallback(() => {
    setParams({ page: 1 });
  }, [setParams]);

  return { params, setParams, resetPage };
}
