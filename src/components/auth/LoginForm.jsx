import { useState } from 'react';
import { useAuth } from '../../hooks/UseAuth';

export function LoginForm() {
  const [username, setUsername] = useState('emilys');
  const [password, setPassword] = useState('emilyspass');
  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Clinic Stock Console</h1>
        <p className="sub">Sign in to manage inventory</p>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {loginError && (
            <div className="error" role="alert">
              Invalid credentials. Please try again.
            </div>
          )}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
