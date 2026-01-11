import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart,
  Users,
  Gift,
  QrCode,
  Bell,
  LogOut,
  Coins,
  Menu,
} from 'lucide-react';
import { api } from '@/lib/api';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Дашборд', path: '/referral/dashboard' },
  { icon: BarChart, label: 'Статистика', path: '/referral/dashboard/stats' },
  { icon: Coins, label: 'Начисления', path: '/referral/dashboard/rewards' },
  { icon: Users, label: 'Рефералы', path: '/referral/dashboard/referrals' },
  { icon: Gift, label: 'Выплаты', path: '/referral/dashboard/withdrawals' },
  { icon: QrCode, label: 'Материалы', path: '/referral/dashboard/materials' },
  { icon: Bell, label: 'Уведомления', path: '/referral/dashboard/notifications' },
];

interface ReferralLayoutProps {
  children: ReactNode;
}

export function ReferralLayout({ children }: ReferralLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    const loadPartnerInfo = async () => {
      try {
        const response = await api.referralVerifyToken();
        if (response.partner) {
          setPartnerInfo({
            name: response.partner.name,
            email: response.partner.email,
          });
        }
      } catch (error) {
        console.error('Failed to load partner info:', error);
      }
    };
    loadPartnerInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('referral_token');
    navigate('/referral/login');
  };

  const MenuContent = () => (
    <>
      {/* Logo/Header */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-lg font-bold text-primary">Партнерская программа</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        {partnerInfo && (
          <div className="mb-3 px-3">
            <p className="text-sm font-medium">{partnerInfo.name || partnerInfo.email}</p>
            <p className="text-xs text-muted-foreground">Партнер</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={cn(
          "hidden md:flex border-r bg-muted/50 flex-col transition-all duration-300 ease-in-out overflow-hidden",
          desktopSidebarOpen ? "w-64" : "w-0"
        )}>
          {desktopSidebarOpen && <MenuContent />}
        </aside>
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Меню партнерской программы</SheetTitle>
              <SheetDescription>Навигационное меню партнерской программы</SheetDescription>
            </SheetHeader>
            <div className="flex h-full flex-col">
              <MenuContent />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Header */}
        <header className="h-16 border-b bg-card shrink-0">
          <div className="flex h-full items-center justify-between px-4 md:px-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (isMobile) {
                  setMobileMenuOpen(true);
                } else {
                  setDesktopSidebarOpen(!desktopSidebarOpen);
                }
              }}
              className="mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-base md:text-lg font-semibold">
              {menuItems.find((item) => item.path === location.pathname)?.label ||
                'Партнерская программа'}
            </h2>
            <div className="w-10" /> {/* Spacer for menu button */}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container px-4 md:px-6 py-4 md:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
