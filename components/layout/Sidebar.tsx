'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, TrendingUp, DollarSign, MessageSquare, Settings, Bell, X, UserCog, Users, MessageCircle, BarChart3, Percent, LayoutDashboard, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';

const navigation = [
  // Client-only tabs
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['CLIENT'] },
  { name: 'Accounts', href: '/accounts', icon: CreditCard, roles: ['CLIENT'] },
  { name: 'Trading', href: '/trading', icon: TrendingUp, roles: ['CLIENT'] },
  { name: 'Loans', href: '/loans', icon: DollarSign, roles: ['CLIENT'] },
  { name: 'News', href: '/news', icon: Newspaper, roles: ['CLIENT'] },
  { name: 'Chat', href: '/chat', icon: MessageSquare, roles: ['CLIENT'] },
  { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['CLIENT'] },
  // Manager tabs (Advisor)
  { name: 'Advisor Dashboard', href: '/advisor', icon: LayoutDashboard, roles: ['MANAGER'], exact: true },
  { name: 'Grant Loans', href: '/advisor/loans', icon: DollarSign, roles: ['MANAGER'] },
  { name: 'View Users', href: '/advisor/users', icon: Users, roles: ['MANAGER'] },
  { name: 'Securities', href: '/advisor/securities', icon: BarChart3, roles: ['MANAGER'] },
  { name: 'Savings Rates', href: '/advisor/rates', icon: Percent, roles: ['MANAGER'] },
  // Admin tabs
  { name: 'Admin Dashboard', href: '/admin', icon: Settings, roles: ['ADMIN'], exact: true },
  { name: 'Users & Accounts', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Securities', href: '/admin/securities', icon: BarChart3, roles: ['ADMIN'] },
  { name: 'Savings Rates', href: '/admin/rates', icon: Percent, roles: ['ADMIN'] },
  { name: 'News', href: '/admin/news', icon: Newspaper, roles: ['ADMIN'] },
  { name: 'All Chats', href: '/admin/chats', icon: MessageCircle, roles: ['ADMIN'] },
];

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ onClose, isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || 'CLIENT')
  );

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 flex flex-col h-full",
      isMobile ? "w-full" : "w-64"
    )}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {user?.profile.firstName?.charAt(0)}
                {user?.profile.lastName?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user?.profile.firstName} {user?.profile.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          {isMobile && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          // For items with exact: true, only match exactly
          // For other paths, also match child routes
          const isActive = (item as any).exact
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          © 2026 Bank Avenir
        </div>
      </div>
    </aside>
  );
}
