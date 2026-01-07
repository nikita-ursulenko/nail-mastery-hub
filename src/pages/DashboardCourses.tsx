import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Calendar,
  Settings,
  LogOut,
  PlayCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const navigation = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "Мои курсы", icon: BookOpen },
  { href: "/dashboard/certificates", label: "Сертификаты", icon: Award },
  { href: "/dashboard/schedule", label: "Расписание", icon: Calendar },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
];

interface Course {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string | null;
  image_upload_path: string | null;
  level: string;
  category: string;
  duration: string;
  rating: number;
  reviews_count: number;
  status: string;
  progress_percent: number;
  lessons_completed: number;
  total_lessons: number;
  purchased_at: string;
  started_at: string | null;
  expires_at: string | null;
  tariff_name: string;
  tariff_type: string;
}

export default function DashboardCourses() {
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const data = await api.getUserCourses();
      setCourses(data.courses || []);
    } catch (error: any) {
      toast.error(error.message || "Ошибка при загрузке курсов");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getImageUrl = (course: Course) => {
    if (course.image_upload_path) {
      return course.image_upload_path;
    }
    if (course.image_url) {
      return course.image_url;
    }
    return "/placeholder-course.jpg";
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      basics: "Основы",
      hardware: "Аппаратный",
      extension: "Наращивание",
      design: "Дизайн",
    };
    return labels[category] || category;
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: "Начинающий",
      intermediate: "Средний",
      advanced: "Продвинутый",
    };
    return labels[level] || level;
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
          title="Мои курсы"
          description="Курсы, к которым у вас есть доступ"
        />

        <div className="p-6">
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : courses.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-2 font-display text-xl font-bold">
                У вас пока нет доступных курсов
              </h2>
              <p className="mb-6 text-muted-foreground">
                Выберите курс и начните обучение прямо сейчас!
              </p>
              <Button asChild>
                <Link to="/courses">Перейти к курсам</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6">
              {courses.map((course) => (
                <Card key={course.id} variant="course">
                  <CardContent className="p-0">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <img
                        src={getImageUrl(course)}
                        alt={course.title}
                        loading="lazy"
                        decoding="async"
                        className="h-48 w-full shrink-0 rounded-l-xl object-cover md:h-auto md:w-64"
                      />
                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              {getCategoryLabel(course.category)}
                            </Badge>
                            <Badge variant="outline">
                              {getLevelLabel(course.level)}
                            </Badge>
                            <Badge>
                              {course.tariff_name}
                            </Badge>
                          </div>
                          <h3 className="mb-1 font-display text-xl font-semibold">
                            {course.title}
                          </h3>
                          <p className="mb-3 text-sm text-muted-foreground">
                            {course.subtitle}
                          </p>
                        </div>

                        <div>
                          <div className="mb-3 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {course.lessons_completed} / {course.total_lessons} уроков
                            </span>
                            <span className="font-medium">
                              {course.progress_percent}%
                            </span>
                          </div>
                          <Progress value={course.progress_percent} className="mb-3 h-2" />
                          
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {course.duration}
                              </div>
                              {course.progress_percent === 100 && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Завершен
                                </div>
                              )}
                            </div>
                            <Button
                              asChild
                              variant={course.progress_percent > 0 ? "default" : "hero"}
                            >
                              <Link to={`/dashboard/courses/${course.id}`}>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                {course.progress_percent > 0
                                  ? "Продолжить"
                                  : "Начать курс"}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

