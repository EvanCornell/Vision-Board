import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Target,
  CheckSquare,
  FileText,
  Bot,
  Play,
  Settings,
  Flame,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useStore } from '../store/useStore';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/vision', icon: Sparkles, label: 'Vision Board' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/ai', icon: Bot, label: 'AI Coach' },
  { to: '/manifestation', icon: Play, label: 'Manifestation' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { streakData } = useStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-white/10 bg-gray-950/80 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <span className="text-xl font-bold gradient-text tracking-widest">VISION</span>
        )}
        {collapsed && <span className="text-xl font-bold gradient-text mx-auto">V</span>}
        <button
          onClick={onToggle}
          className={cn(
            'rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                      : 'text-gray-400 hover:bg-white/8 hover:text-white',
                    collapsed && 'justify-center px-2'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Streak counter */}
      <div className={cn('border-t border-white/10 p-4', collapsed && 'px-2')}>
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 p-3',
            collapsed && 'justify-center p-2'
          )}
        >
          <Flame size={18} className="text-orange-400 shrink-0" />
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-orange-300">
                {streakData.currentStreak} day streak
              </div>
              <div className="text-xs text-gray-500">
                Best: {streakData.longestStreak}
              </div>
            </div>
          )}
          {collapsed && (
            <span className="text-sm font-bold text-orange-300">{streakData.currentStreak}</span>
          )}
        </div>
      </div>
    </aside>
  );
}
