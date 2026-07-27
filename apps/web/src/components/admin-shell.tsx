'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ScrollText,
  Sun,
  Users,
  Wallet,
  BarChart3,
  Banknote,
  Landmark,
  CreditCard,
  Bell,
  KeyRound,
  RotateCcw,
  Receipt,
  Shield,
  Percent,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { getStoredUser, isAuthenticated } from '@/lib/auth';
import { logoutApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navGroups = [
  {
    label: 'Collections',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/revenue', label: 'Revenue Types', icon: Landmark },
      { href: '/taxes', label: 'Tax Types', icon: Percent },
      { href: '/assessments', label: 'Assessments', icon: ClipboardList },
      { href: '/invoices', label: 'Invoices', icon: FileText },
      { href: '/payments', label: 'Payments', icon: Wallet },
      { href: '/virtual-accounts', label: 'Virtual Accounts', icon: CreditCard },
    ],
  },
  {
    label: 'Treasury',
    items: [
      { href: '/settlements', label: 'Settlements', icon: Banknote },
      { href: '/refunds', label: 'Refunds', icon: RotateCcw },
      { href: '/gateways', label: 'Gateways', icon: KeyRound },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/agencies', label: 'Agencies', icon: Building2 },
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/audit', label: 'Audit Trail', icon: ScrollText },
      { href: '/users', label: 'Users & Roles', icon: Users },
    ],
  },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'group flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-all duration-300 ease-agency sm:py-2',
                  active
                    ? 'bg-white/12 text-white shadow-[inset_3px_0_0_0_#B89A4F]'
                    : 'text-white/65 hover:bg-white/8 hover:text-white',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    active ? 'text-brass-soft' : 'text-white/50 group-hover:text-white/80',
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    const user = getStoredUser();
    setUserName(user ? `${user.firstName} ${user.lastName}` : 'Officer');
    setUserRole(user?.isSuperAdmin ? 'Super Admin' : 'Revenue Officer');
    setReady(true);
  }, [router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  async function logout() {
    await logoutApi();
    router.replace('/login');
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="h-10 w-10 rounded-full border-2 border-brass/50 border-t-accent animate-spin" />
          <p className="text-sm text-muted-foreground">Opening secure workspace…</p>
        </div>
      </div>
    );
  }

  const brandBlock = (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent seal-ring">
        <Receipt className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-serif text-[1.05rem] leading-none tracking-tight sm:text-[1.15rem]">
          Government Revenue
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-brass-soft/90">
          Collection Console
        </p>
      </div>
    </div>
  );

  const userFooter = (
    <div className="border-t border-white/10 p-4">
      <div className="mb-3 flex items-start gap-2.5 rounded-md bg-white/5 px-3 py-2.5">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-soft" />
        <div className="min-w-0">
          <p className="truncate text-sm text-white/90">{userName}</p>
          <p className="truncate text-[11px] uppercase tracking-wider text-white/45">{userRole}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          className="flex-1 justify-start text-white hover:bg-white/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-b from-navy-700 via-navy to-navy-800 text-white print:hidden lg:flex lg:min-h-screen lg:flex-col lg:border-r lg:border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 20% 0%, rgba(184,154,79,0.18), transparent 45%), radial-gradient(ellipse at 80% 100%, rgba(12,107,69,0.2), transparent 50%)',
          }}
        />
        <div className="relative flex h-[4.25rem] items-center border-b border-white/10 px-5 hairline-top">
          {brandBlock}
        </div>
        <nav className="relative flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-5">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="relative mt-auto">{userFooter}</div>
      </aside>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 print:hidden lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy-900/55 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col bg-gradient-to-b from-navy-700 via-navy to-navy-800 text-white shadow-lift animate-fade-up">
            <div className="flex h-[4.25rem] items-center justify-between gap-2 border-b border-white/10 px-4">
              {brandBlock}
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-white hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
              <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            </nav>
            {userFooter}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border/80 bg-card/85 px-3 backdrop-blur-md print:hidden sm:px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm text-muted-foreground">
                <span className="font-medium text-foreground">NCS</span>
                <span className="mx-1.5 text-border sm:mx-2">·</span>
                <span className="hidden min-[380px]:inline">Enterprise revenue operations</span>
                <span className="min-[380px]:hidden">Revenue ops</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" className="lg:hidden" onClick={logout}>
              <LogOut className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>
        <main className="w-full min-w-0 flex-1 animate-fade-up p-3 sm:p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
