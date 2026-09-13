import { Link } from 'react-router-dom';

export function StockCard({ product }) {
  const stockClass =
    product.stock < 10 ? 'low' : product.stock < 30 ? 'medium' : 'high';

  return (
    <div className="stock-card">
      <div className="stock-card__name">{product.title}</div>
      <div className="stock-card__details">
        <span>Category: {product.category}</span>
        <span>Price: ${product.price.toFixed(2)}</span>
        <span>
          Stock: <span className={stockClass}>{product.stock}</span>
        </span>
      </div>
      <div className="stock-card__link">
        <Link to={`/items/${product.id}`}>View details</Link>
      </div>
    </div>
  );
}
