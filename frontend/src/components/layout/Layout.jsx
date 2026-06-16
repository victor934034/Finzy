import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import MobileNav from './MobileNav.jsx';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-dark-400">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
