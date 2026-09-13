import { Button } from './Button';

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="error-state" role="alert">
      <p>{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  );
}
