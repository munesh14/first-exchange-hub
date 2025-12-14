import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { UserSelectModal } from './UserSelectModal';
import { useUser } from '@/contexts/UserContext';

export function Layout() {
  const { currentUser } = useUser();

  return (
    <div className="min-h-screen bg-background">
      <UserSelectModal />
      
      {currentUser && (
        <>
          <AppSidebar />
          <main className="ml-64 min-h-screen">
            <div className="p-8">
              <Outlet />
            </div>
          </main>
        </>
      )}
    </div>
  );
}
