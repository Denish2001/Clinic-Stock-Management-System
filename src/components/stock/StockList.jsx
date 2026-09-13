import { Link } from 'react-router-dom';
import { StockRow } from './StockRow';
import { StockCard } from './StockCard';
import { Pagination } from './Pagination';

export function StockList({ products, total, limit, page, onPageChange }) {
  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="stock-list">
        <div className="stock-list__header">
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span></span>
        </div>
        {products.map((product) => (
          <StockRow key={product.id} product={product} />
        ))}
        {products.map((product) => (
          <StockCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination
        total={total}
        limit={limit}
        page={page}
        onPageChange={onPageChange}
      />
    </>
  );
}
