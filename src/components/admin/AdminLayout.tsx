import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Phone,
  UserCircle,
  UserCog,
  FileText,
  Search,
  ShoppingCart,
  UserPlus,
  Menu,
} from 'lucide-react';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Главная', path: '/admin/dashboard' },
  { icon: MessageSquare, label: 'Отзывы', path: '/admin/testimonials' },
  { icon: Phone, label: 'Контакты', path: '/admin/contacts' },
  { icon: UserCircle, label: 'Основатель', path: '/admin/founder' },
  { icon: UserCog, label: 'Команда', path: '/admin/team' },
  { icon: FileText, label: 'Блог', path: '/admin/blog' },
  { icon: Search, label: 'SEO', path: '/admin/seo' },
  { icon: BookOpen, label: 'Курсы', path: '/admin/courses' },
  { icon: Users, label: 'Пользователи', path: '/admin/users' },
  { icon: ShoppingCart, label: 'Заказы', path: '/admin/orders' },
  { icon: UserPlus, label: 'Реферал', path: '/admin/referral' },
  { icon: Settings, label: 'Настройки', path: '/admin/settings' },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);

  // Устанавливаем title для всех админских страниц
  useEffect(() => {
    document.title = 'Admin panel';
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      navigate('/admin/login');
    }
  };

  const MenuContent = () => (
    <>
      {/* Logo/Header */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-lg font-bold text-primary">Админ-панель</h1>
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
        <div className="mb-3 px-3">
          <p className="text-sm font-medium">{admin?.name || admin?.email}</p>
          <p className="text-xs text-muted-foreground">Администратор</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => {
            handleLogout();
            setMobileMenuOpen(false);
          }}
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
              <SheetTitle>Меню админ-панели</SheetTitle>
              <SheetDescription>Навигация по разделам админ-панели.</SheetDescription>
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
                'Админ-панель'}
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

