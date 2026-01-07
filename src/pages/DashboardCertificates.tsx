import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Calendar,
  Settings,
  LogOut,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const navigation = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "Мои курсы", icon: BookOpen },
  { href: "/dashboard/certificates", label: "Сертификаты", icon: Award },
  { href: "/dashboard/schedule", label: "Расписание", icon: Calendar },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
];

interface Certificate {
  id: number;
  course_id: number;
  course_title: string;
  course_slug: string;
  issued_at: string;
  certificate_number: string;
  status: string;
  download_url?: string;
}

export default function DashboardCertificates() {
  const location = useLocation();
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Загрузить сертификаты из API
    // Пока используем заглушку
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      // TODO: Реализовать API для получения сертификатов
      // const response = await api.getUserCertificates();
      // setCertificates(response.certificates || []);
      
      // Заглушка - пустой список
      setCertificates([]);
    } catch (error) {
      console.error("Failed to load certificates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-sidebar lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display text-xl font-bold text-primary">
                NailArt
              </span>
              <span className="font-display text-sm text-muted-foreground">
                Academy
              </span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
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
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Выйти
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <DashboardHeader
          title="Сертификаты"
          description="Ваши достижения и сертификаты об окончании курсов"
        />

        <div className="p-6">
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : certificates.length === 0 ? (
            <Card className="p-12 text-center">
              <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-2 font-display text-xl font-bold">
                У вас пока нет сертификатов
              </h2>
              <p className="mb-6 text-muted-foreground">
                Завершите курс, чтобы получить сертификат об окончании
              </p>
              <Button asChild>
                <Link to="/dashboard/courses">Перейти к курсам</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {certificates.map((certificate) => (
                  <Card key={certificate.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="mb-2 text-lg">
                            {certificate.course_title}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            Сертификат №{certificate.certificate_number}
                          </Badge>
                        </div>
                        <Award className="h-8 w-8 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Дата выдачи:
                          </span>
                          <span className="font-medium">
                            {formatDate(certificate.issued_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Статус:</span>
                          <Badge
                            variant={
                              certificate.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {certificate.status === "active"
                              ? "Активен"
                              : "Неактивен"}
                          </Badge>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <Link to={`/courses/${certificate.course_slug}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Курс
                            </Link>
                          </Button>
                          {certificate.download_url && (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              asChild
                            >
                              <a
                                href={certificate.download_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Скачать
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

