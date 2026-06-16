import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import MobileNav from './MobileNav.jsx';
import NotificationBell from '../ui/NotificationBell.jsx';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-dark-400">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-end px-4 py-2 md:px-6 border-b border-white/5 shrink-0">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
