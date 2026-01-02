'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, TrendingUp, DollarSign, MessageSquare, Settings, Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['CLIENT', 'MANAGER', 'ADMIN'] },
  { name: 'Accounts', href: '/accounts', icon: CreditCard, roles: ['CLIENT', 'MANAGER', 'ADMIN'] },
  { name: 'Trading', href: '/trading', icon: TrendingUp, roles: ['CLIENT', 'MANAGER', 'ADMIN'] },
  { name: 'Loans', href: '/loans', icon: DollarSign, roles: ['CLIENT', 'MANAGER', 'ADMIN'] },
  { name: 'Chat', href: '/chat', icon: MessageSquare, roles: ['CLIENT', 'MANAGER', 'ADMIN'] },
  { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['CLIENT', 'MANAGER', 'ADMIN'] },
  { name: 'Admin', href: '/admin', icon: Settings, roles: ['ADMIN'] },
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
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

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
