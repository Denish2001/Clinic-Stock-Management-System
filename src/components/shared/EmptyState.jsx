import { Button } from './Button';

export function EmptyState({ message = 'No items found', onClear }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {onClear && (
        <Button variant="secondary" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
