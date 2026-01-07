import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  PlayCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface EnrolledCourse {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  image_upload_path: string | null;
  duration: string;
  level: string;
  category: string;
  status: string;
  progress_percent: number;
  lessons_completed: number;
  total_lessons: number;
  tariff_name: string;
  tariff_type: string;
}

const notifications = [
  {
    id: 1,
    type: "homework",
    title: "ДЗ проверено",
    message: "Куратор оставил комментарий к вашей работе",
    time: "2 часа назад",
  },
  {
    id: 2,
    type: "live",
    title: "Прямой эфир",
    message: "Начало через 1 час: Q&A сессия",
    time: "Сегодня, 19:00",
  },
  {
    id: 3,
    type: "new",
    title: "Новый урок",
    message: "Добавлен бонусный урок по стемпингу",
    time: "Вчера",
  },
];

export default function Dashboard() {
  const location = useLocation();
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  const loadEnrolledCourses = async () => {
    try {
      setIsLoadingCourses(true);
      const response = await api.getUserCourses();
      setEnrolledCourses(response.courses || []);
    } catch (error: any) {
      console.error('Failed to load enrolled courses:', error);
      // Не показываем ошибку, просто оставляем пустой список
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const getCourseImage = (course: EnrolledCourse) => {
    if (course.image_upload_path) {
      return course.image_upload_path;
    }
    if (course.image_url) {
      return course.image_url;
    }
    return "/placeholder-course.jpg";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Сегодня';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Завтра';
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  // Находим курс с наибольшим прогрессом (но не завершенный)
  const getMostProgressCourse = (): EnrolledCourse | null => {
    if (enrolledCourses.length === 0) return null;
    
    // Фильтруем курсы, которые не завершены (прогресс < 100%)
    const incompleteCourses = enrolledCourses.filter(course => course.progress_percent < 100);
    
    if (incompleteCourses.length === 0) {
      // Если все курсы завершены, берем курс с максимальным прогрессом
      return enrolledCourses.reduce((prev, current) => 
        (prev.progress_percent > current.progress_percent) ? prev : current
      );
    }
    
    // Находим курс с наибольшим прогрессом среди незавершенных
    return incompleteCourses.reduce((prev, current) => 
      (prev.progress_percent > current.progress_percent) ? prev : current
    );
  };

  const mostProgressCourse = getMostProgressCourse();
  const remainingLessons = mostProgressCourse 
    ? mostProgressCourse.total_lessons - mostProgressCourse.lessons_completed 
    : 0;

  const handleLogout = () => {
    logout();
    navigate('/');
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
          title="Личный кабинет"
          description={`Добро пожаловать, ${user?.name || 'Пользователь'}!`}
        />

        <div className="p-6">
          {/* Welcome Banner */}
          {mostProgressCourse && (
            <Card variant="glass" className="mb-8 overflow-hidden">
              <CardContent className="flex items-center gap-6 p-6">
                <div className="flex-1">
                  <h2 className="mb-2 font-display text-2xl font-bold">
                    Продолжайте обучение! 🎯
                  </h2>
                  <p className="mb-4 text-muted-foreground">
                    {remainingLessons > 0 ? (
                      <>
                        Вы на правильном пути. Осталось {remainingLessons} {remainingLessons === 1 ? 'урок' : remainingLessons < 5 ? 'урока' : 'уроков'} до завершения курса
                        "{mostProgressCourse.title}".
                      </>
                    ) : (
                      <>
                        Поздравляем! Вы завершили курс "{mostProgressCourse.title}". Продолжайте обучение!
                      </>
                    )}
                  </p>
                  <Button variant="hero" asChild>
                    <Link to={`/dashboard/courses/${mostProgressCourse.id}`}>
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Продолжить урок
                    </Link>
                  </Button>
                </div>
                <div className="hidden md:block">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-display text-4xl font-bold text-primary">
                      {Math.round(mostProgressCourse.progress_percent)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* My Courses */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Мои курсы</h2>
                <Link
                  to="/dashboard/courses"
                  className="flex items-center text-sm text-primary hover:underline"
                >
                  Все курсы
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {isLoadingCourses ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : enrolledCourses.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">У вас пока нет доступных курсов</p>
                    <Button asChild className="mt-4">
                      <Link to="/courses">Перейти к курсам</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {enrolledCourses.map((course) => (
                    <Card key={course.id} variant="course">
                      <CardContent className="p-0">
                        <div className="flex gap-4">
                          <img
                            src={getCourseImage(course)}
                            alt={course.title}
                            loading="lazy"
                            decoding="async"
                            className="w-32 shrink-0 rounded-l-xl object-cover self-stretch"
                          />
                          <div className="flex flex-1 flex-col justify-center py-4 pr-4">
                            <h3 className="mb-1 font-display text-lg font-semibold">
                              {course.title}
                            </h3>
                            <p className="mb-3 text-sm text-muted-foreground">
                              {course.progress_percent > 0 
                                ? `Продолжайте обучение` 
                                : `Начните обучение`}
                            </p>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {course.lessons_completed} / {course.total_lessons}{" "}
                                уроков
                              </span>
                              <span className="font-medium">{Math.round(course.progress_percent)}%</span>
                            </div>
                            <Progress value={course.progress_percent} className="h-2" />
                            <div className="mt-3 flex items-center justify-between">
                              <Badge variant="secondary">
                                <Clock className="mr-1 h-3 w-3" />
                                {formatDate()}
                              </Badge>
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/dashboard/courses/${course.id}`}>
                                  Продолжить
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Уведомления</h2>
                <Badge variant="secondary">{notifications.length}</Badge>
              </div>

              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card key={notification.id} variant="default" className="cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          {notification.type === "homework" && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                          {notification.type === "live" && (
                            <PlayCircle className="h-5 w-5 text-primary" />
                          )}
                          {notification.type === "new" && (
                            <BookOpen className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ваша статистика</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Пройдено уроков</span>
                    <span className="font-semibold">28</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Сдано ДЗ</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Сертификатов</span>
                    <span className="font-semibold">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Часов обучения</span>
                    <span className="font-semibold">24</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
