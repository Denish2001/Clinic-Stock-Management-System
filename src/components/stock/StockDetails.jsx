// StockDetails.jsx
import { useProduct, useUpdateProduct } from '../../hooks/useStock';
import { ErrorState } from '../shared/ErrorState';
import { LoadingState } from '../shared/LoadingState';
import { StockEditor } from './StockEditor';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export function StockDetails({ id }) {
  const { data: product, isLoading, error, refetch } = useProduct(id);
  const updateMutation = useUpdateProduct();
  const [updateError, setUpdateError] = useState(null);
  const location = useLocation();

  const handleSave = (newStock) => {
    setUpdateError(null);
    updateMutation.mutate(
      { id, data: { stock: newStock } },
      { onError: (err) => setUpdateError(err.message || 'Update failed') }
    );
  };

  if (isLoading) return <LoadingState message="Loading product details..." />;
  if (error)
    return <ErrorState message="Failed to load product" onRetry={refetch} />;
  if (!product) return <ErrorState message="Product not found" />;

  return (
    <div className="detail">
      <Link to={`/stock${location.search}`} className="detail__back">
        ← Back to stock list
      </Link>

      <div className="detail__header">
        <span className="detail__category">{product.category}</span>
        <h1 className="detail__title">{product.title}</h1>
      </div>

      <div className="detail__grid">
        <dl className="detail__specs">
          <div className="detail__spec">
            <dt>Price</dt>
            <dd>${product.price.toFixed(2)}</dd>
          </div>
          <div className="detail__spec">
            <dt>Stock</dt>
            <dd>{product.stock}</dd>
          </div>
          <div className="detail__spec">
            <dt>Brand</dt>
            <dd>{product.brand || '—'}</dd>
          </div>
          <div className="detail__spec">
            <dt>SKU</dt>
            <dd>{product.sku || '—'}</dd>
          </div>
        </dl>

        <StockEditor
          currentStock={product.stock}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
          error={updateError}
        />
      </div>
    </div>
  );
}
