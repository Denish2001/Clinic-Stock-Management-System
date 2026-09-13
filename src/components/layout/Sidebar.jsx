// Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useCategories } from '../../hooks/useStock';
import { useUrlState } from '../../hooks/useUrlState';
import { ErrorState } from '../shared/ErrorState';
import { LoadingState } from '../shared/LoadingState';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { params } = useUrlState();
  const { data: categories, isLoading, error } = useCategories();

  const isOnStockPage = location.pathname === '/stock';

  const handleCategory = (slug) => {
    // Only carry over existing filters (search/sort/etc) if we're already
    // on the stock list; otherwise start fresh.
    const sp = new URLSearchParams(isOnStockPage ? location.search : '');
    if (slug) {
      sp.set('category', slug);
    } else {
      sp.delete('category');
    }
    sp.set('page', '1');
    navigate(`/stock?${sp.toString()}`);
  };

  if (isLoading) return <LoadingState message="Loading categories..." />;
  if (error)
    return (
      <ErrorState
        message="Failed to load categories"
        onRetry={() => window.location.reload()}
      />
    );

  const categoryList = Array.isArray(categories)
    ? categories.map((cat) =>
        typeof cat === 'string' ? { slug: cat, name: cat } : cat
      )
    : [];

  const activeCategory = isOnStockPage ? params.category : '';

  return (
    <aside className="sidebar">
      <h2>Categories</h2>
      <ul className="sidebar__categories">
        <li>
          <button
            className={`all-category ${!activeCategory ? 'active' : ''}`}
            onClick={() => handleCategory('')}
          >
            All
          </button>
        </li>
        {categoryList.map((cat) => (
          <li key={cat.slug}>
            <button
              className={activeCategory === cat.slug ? 'active' : ''}
              onClick={() => handleCategory(cat.slug)}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
