import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header__title">Jami Bora Clinic Stock</div>
      <div className="header__user">
        <span>{user?.firstName || 'User'}</span>
        <button onClick={logout} aria-label="Sign out">
          Sign out
        </button>
      </div>
    </header>
  );
}
