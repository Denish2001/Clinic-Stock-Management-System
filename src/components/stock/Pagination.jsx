export function Pagination({ total, limit, page, onPageChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) onPageChange(p);
  };

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button onClick={() => goToPage(page - 1)} disabled={page === 1}>
        Previous
      </button>
      {pages.map((p, idx) => (
        <button
          key={idx}
          className={p === page ? 'active' : ''}
          onClick={() => typeof p === 'number' && goToPage(p)}
          disabled={p === '...'}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}>
        Next
      </button>
    </nav>
  );
}
