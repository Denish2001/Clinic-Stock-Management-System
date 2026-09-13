// StockRow.jsx
import { Link, useLocation } from 'react-router-dom';

export function StockRow({ product }) {
  const location = useLocation();
  const stockClass =
    product.stock < 10 ? 'low' : product.stock < 30 ? 'medium' : 'high';

  return (
    <Link
      to={{ pathname: `/items/${product.id}`, search: location.search }}
      className="stock-row"
    >
      <div className="stock-row__name">{product.title}</div>
      <div className="stock-row__category">{product.category}</div>
      <div className="stock-row__price">${product.price.toFixed(2)}</div>
      <div className={`stock-row__stock ${stockClass}`}>{product.stock}</div>
      <div className="stock-row__link" aria-hidden="true">View →</div>
    </Link>
  );
}