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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 flex flex-col shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
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
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium',
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Procurement Section */}
        <div className="pt-6 pb-2">
          <p className="px-4 text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <span className="h-0.5 w-4 bg-gradient-to-r from-blue-500 to-transparent block"></span>
            Procurement
          </p>
        </div>
        {procurementItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium',
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/50'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Asset Register */}
        {canAccessAssets && (
          <>
            <div className="pt-6 pb-2">
              <p className="px-4 text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <span className="h-0.5 w-4 bg-gradient-to-r from-purple-500 to-transparent block"></span>
                Assets
              </p>
            </div>
            <NavLink
              to="/assets"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium',
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
                )
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
            <div className="pt-6 pb-2">
              <p className="px-4 text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span className="h-0.5 w-4 bg-gradient-to-r from-amber-500 to-transparent block"></span>
                Reports
              </p>
            </div>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium',
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/50'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
                )
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
        <div className="p-4 border-t border-slate-700/50">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 transition-all cursor-pointer shadow-lg border border-slate-600/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {currentUser.FullName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {currentUser.DepartmentName}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-white">{currentUser.FullName}</p>
                <p className="text-xs text-slate-400">{currentUser.Email}</p>
              </div>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={handleSwitchUser} className="text-slate-300 hover:bg-slate-700 hover:text-white">
                <Building2 className="w-4 h-4 mr-2" />
                Switch User
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-red-500/20 hover:text-red-300">
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
