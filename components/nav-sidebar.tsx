'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProfileModal } from '@/components/profile-modal';
import { cn } from '@/lib/utils';
import { Home, Search, PlusSquare, Heart, User, Menu, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';

export function NavSidebar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { icon: Home, label: 'Home', href: '/feed' },
    { icon: Search, label: 'Search', href: '/search', disabled: true },
    { icon: PlusSquare, label: 'Create', href: '/feed', scrollTo: 'create' },
    { icon: Heart, label: 'Activity', href: '/activity', disabled: true },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-20 border-r bg-background">
        <div className="flex h-full flex-col items-center py-6">
          {/* Logo */}
          <Link href="/feed" className="mb-8">
            <div className="flex h-10 w-10 items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                <path d="M12.186 3.998a8.187 8.187 0 1 0 8.186 8.186 8.187 8.187 0 0 0-8.186-8.186Zm4.015 11.306-.742-.742a4.088 4.088 0 1 1 .742.742Z" />
              </svg>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="flex flex-1 flex-col items-center gap-4">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              if (item.disabled) {
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 cursor-not-allowed opacity-50"
                    disabled
                    aria-label={item.label}
                  >
                    <Icon className="h-6 w-6" />
                  </Button>
                );
              }

              return (
                <Link key={item.label} href={item.href}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-12 w-12', isActive && 'bg-accent text-accent-foreground')}
                    aria-label={item.label}
                  >
                    <Icon className="h-6 w-6" />
                  </Button>
                </Link>
              );
            })}

            {/* Profile Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12"
              onClick={() => setProfileOpen(true)}
              aria-label="Profile"
            >
              <User className="h-6 w-6" />
            </Button>
          </nav>

          {/* Bottom Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12" aria-label="Menu">
                <Menu className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Profile Modal */}
      <ProfileModal trigger={null} open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
