import { useUrlState } from '../hooks/useUrlState';
import { useProducts } from '../hooks/useStock';
import { StockToolbar } from '../components/stock/StockToolbar';
import { StockList } from '../components/stock/StockList';
import { LoadingState } from '../components/shared/LoadingState';
import { ErrorState } from '../components/shared/ErrorState';
import { EmptyState } from '../components/shared/EmptyState';

export default function StockListPage() {
  const { params, setParams } = useUrlState();
  const { search, category, sort, order, page } = params;

  const limit = 20;
  const skip = (page - 1) * limit;

  const queryParams = {
    limit,
    skip,
    sortBy: sort || undefined,
    order: order || undefined,
    category: category || undefined,
    search: search || undefined,
  };

  const { data, isLoading, error, refetch } = useProducts(queryParams);

  const handlePageChange = (newPage) => {
    setParams({ page: newPage });
  };

  const handleClearFilters = () => {
    setParams({ search: '', category: '', sort: '', order: 'asc', page: 1 });
  };

  if (isLoading) return <LoadingState message="Loading stock..." />;
  if (error)
    return <ErrorState message="Failed to load stock" onRetry={refetch} />;
  if (!data || data.products.length === 0) {
    return (
      <>
        <StockToolbar />
        <EmptyState
          message="No items match your criteria"
          onClear={handleClearFilters}
        />
      </>
    );
  }

  return (
    <>
      <StockToolbar />
      <StockList
        products={data.products}
        total={data.total}
        limit={limit}
        page={page}
        onPageChange={handlePageChange}
      />
    </>
  );
}
