import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Topbar from './Topbar.jsx';
import Sidebar from './Sidebar.jsx';
import MobileTabs from './MobileTabs.jsx';
import LivePill from './LivePill.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function Shell() {
  const { sessionId } = useApp();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-12">
          {/* keyed by session: "New session" remounts every page with fresh state */}
          <Outlet key={sessionId} />
        </main>
      </div>
      <MobileTabs />
      <LivePill />
    </div>
  );
}
