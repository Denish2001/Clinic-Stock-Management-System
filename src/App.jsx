import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/UseAuth';
import Root from './routes/Root';
import LoginPage from './routes/LoginPage';
import StockListPage from './routes/StockListPage';
import StockItemPage from './routes/StockItemPage';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="app-loading">Loading session...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={isAuthenticated ? <Root /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/stock" replace />} />
        <Route path="stock" element={<StockListPage />} />
        <Route path="items/:id" element={<StockItemPage />} />
      </Route>
    </Routes>
  );
}

export default App;
