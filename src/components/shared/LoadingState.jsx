export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="loading-state__spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
