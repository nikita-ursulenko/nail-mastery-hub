import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Settings,
  LogOut,
  Menu,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const navigation = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "Мои курсы", icon: BookOpen },
  { href: "/dashboard/certificates", label: "Сертификаты", icon: Award },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const [avatarError, setAvatarError] = useState(false);

  const MenuContent = () => {
    const avatarUrl = user?.avatar_upload_path
      ? `/uploads/avatars/${user.avatar_upload_path}`
      : user?.avatar_url;

    return (
      <>
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <span className="font-display text-xl font-bold text-primary">
              NailArt
            </span>
            <span className="font-display text-sm text-muted-foreground">
              Academy
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-4 shrink-0">
          {user && (
            <div className="mb-3 px-3 flex items-center gap-3">
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt={user.name || "User"}
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground">Пользователь</p>
              </div>
            </div>
          )}
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
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden w-full">
      {/* Sidebar - only show desktop sidebar if not mobile */}
      {!isMobile && (
        <aside className={cn(
          "border-r bg-sidebar flex flex-col transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
          desktopSidebarOpen ? "w-64" : "w-0"
        )}>
          <div className="w-64 flex flex-col h-full">
            <MenuContent />
          </div>
        </aside>
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Меню личного кабинета</SheetTitle>
              <SheetDescription>Навигация по разделам личного кабинета.</SheetDescription>
            </SheetHeader>
            <div className="flex h-full flex-col">
              <MenuContent />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
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
            <div className="flex-1">
              <h2 className="text-base md:text-lg font-semibold">Личный кабинет</h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                {navigation.find((item) => item.href === location.pathname)?.label || "Личный кабинет"}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
