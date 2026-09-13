// useStock.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProducts,
  getCategories,
  getProduct,
  updateProduct,
} from '../api/stock';

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateProduct({ id, data }),
    onSuccess: (data, variables) => {
      // The API (DummyJSON-style) doesn't persist writes server-side —
      // it only echoes the merged object back in the response. So we
      // write that response straight into the cache instead of
      // invalidating, which would refetch stale/original data and make
      // the update look like it silently failed.
      queryClient.setQueryData(['product', variables.id], (old) => ({
        ...old,
        ...data,
      }));

      // Patch matching rows in any cached product lists too, so the
      // stock list reflects the change without refetching stale data.
      queryClient.setQueriesData({ queryKey: ['products'] }, (old) => {
        if (!old?.products) return old;
        return {
          ...old,
          products: old.products.map((p) =>
            p.id === variables.id ? { ...p, ...data } : p
          ),
        };
      });
    },
  });
}