import { NavLink, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart3,
  Monitor,
  User,
  ChevronDown,
  LogOut,
  Building2,
  Link2,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import feLogo from '@/assets/fe_logo.png';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
];

const procurementItems = [
  { path: '/chains', label: 'All Chains', icon: Link2 },
  { path: '/chains/new', label: 'New Chain', icon: Plus },
];

export function AppSidebar() {
  const location = useLocation();
  const { currentUser, setCurrentUser, setIsUserModalOpen, canAccessReports, canAccessAssets } = useUser();

  const handleSwitchUser = () => {
    setIsUserModalOpen(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsUserModalOpen(true);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={feLogo} alt="First Exchange LLC" className="h-10 w-auto" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        {/* Main Items */}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'nav-item-active')
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Procurement Section */}
        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
            Procurement
          </p>
        </div>
        {procurementItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'nav-item-active')
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Asset Register */}
        {canAccessAssets && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                Assets
              </p>
            </div>
            <NavLink
              to="/assets"
              className={({ isActive }) =>
                cn('nav-item', isActive && 'nav-item-active')
              }
            >
              <Monitor className="w-5 h-5" />
              <span>Asset Register</span>
            </NavLink>
          </>
        )}

        {/* Reports */}
        {canAccessReports && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                Reports
              </p>
            </div>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                cn('nav-item', isActive && 'nav-item-active')
              }
            >
              <BarChart3 className="w-5 h-5" />
              <span>Reports</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User Section */}
      {currentUser && (
        <div className="p-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-sidebar-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {currentUser.FullName}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {currentUser.DepartmentName}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{currentUser.FullName}</p>
                <p className="text-xs text-muted-foreground">{currentUser.Email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSwitchUser}>
                <Building2 className="w-4 h-4 mr-2" />
                Switch User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}
