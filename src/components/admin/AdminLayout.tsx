import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
} from 'lucide-react';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Главная', path: '/admin/dashboard' },
  { icon: MessageSquare, label: 'Отзывы', path: '/admin/testimonials' },
  { icon: BookOpen, label: 'Курсы', path: '/admin/courses' },
  { icon: Users, label: 'Пользователи', path: '/admin/users' },
  { icon: ShoppingCart, label: 'Заказы', path: '/admin/orders' },
  { icon: Settings, label: 'Настройки', path: '/admin/settings' },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/50">
        <div className="flex h-full flex-col">
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
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b bg-card">
          <div className="flex h-full items-center justify-between px-6">
            <h2 className="text-lg font-semibold">
              {menuItems.find((item) => item.path === location.pathname)?.label ||
                'Админ-панель'}
            </h2>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

