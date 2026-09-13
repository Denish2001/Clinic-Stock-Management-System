import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { MainContent } from '../components/layout/MainContent';

export default function Root() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <MainContent>
          <Outlet />
        </MainContent>
      </div>
    </div>
  );
}
