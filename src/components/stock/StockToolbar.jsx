import { useUrlState } from '../../hooks/useUrlState';
import { debounce } from '../../lib/utils';
import { useRef, useEffect } from 'react';

export function StockToolbar() {
  const { params, setParams } = useUrlState();

  // Debounced search update (300ms)
  const debouncedSetSearch = useRef(
    debounce((value) => {
      setParams({ search: value, page: 1 });
    }, 300)
  ).current;

  // Cancel debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel?.();
    };
  }, [debouncedSetSearch]);

  const handleSearch = (e) => {
    const value = e.target.value;
    debouncedSetSearch(value);
  };

  const handleSort = (e) => {
    const [sortBy, order] = e.target.value.split('-');
    setParams({ sort: sortBy || '', order: order || 'asc', page: 1 });
  };

  return (
    <div className="stock-toolbar">
      <div className="stock-toolbar__search">
        <input
          type="text"
          placeholder="Search stock..."
          defaultValue={params.search} // uncontrolled to avoid re-render on each keystroke
          onChange={handleSearch}
          aria-label="Search products"
        />
      </div>
      <div className="stock-toolbar__controls">
        <select
          value={
            params.sort && params.order ? `${params.sort}-${params.order}` : ''
          }
          onChange={handleSort}
          aria-label="Sort by"
        >
          <option value="">Default</option>
          <option value="title-asc">Name A–Z</option>
          <option value="title-desc">Name Z–A</option>
          <option value="price-asc">Price low–high</option>
          <option value="price-desc">Price high–low</option>
          <option value="stock-asc">Stock low–high</option>
          <option value="stock-desc">Stock high–low</option>
        </select>
      </div>
    </div>
  );
}
