import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

const navigation = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "Мои курсы", icon: BookOpen },
  { href: "/dashboard/certificates", label: "Сертификаты", icon: Award },
  { href: "/dashboard/schedule", label: "Расписание", icon: Calendar },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
];

interface LessonProgress {
  is_completed: boolean;
  watched_duration: number;
  last_watched_at: string | null;
}

interface Lesson {
  id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  video_upload_path: string | null;
  duration: number;
  is_preview: boolean;
  order_index: number;
  materials: any;
  module_id: number;
  module_title: string;
  course_id: number;
  progress: LessonProgress;
  prev_lesson_id: number | null;
  next_lesson_id: number | null;
}

export default function DashboardLesson() {
  const { courseId, lessonId } = useParams();
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setIsLoading(true);
      const data = await api.getUserLesson(parseInt(lessonId!));
      setLesson(data.lesson);
      setIsCompleted(data.lesson.progress.is_completed);
    } catch (error: any) {
      toast.error(error.message || "Ошибка при загрузке урока");
      navigate(`/dashboard/courses/${courseId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCompleteToggle = async (checked: boolean) => {
    if (!lesson) return;

    try {
      setIsCompleted(checked);
      await api.updateLessonProgress(lesson.id, {
        watched_duration: lesson.duration,
        is_completed: checked,
      });
      toast.success(checked ? "Урок отмечен как завершенный" : "Метка снята");
    } catch (error: any) {
      toast.error(error.message || "Ошибка при обновлении прогресса");
      setIsCompleted(!checked);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    )?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} мин`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}ч ${remainingMinutes}м`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-sidebar lg:block">
        <div className="flex h-full flex-col">
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
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/dashboard/courses/${courseId}`}>
              ← Вернуться к курсу
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {lesson.module_title}
            </span>
            <div className="h-10 w-10 rounded-full bg-primary/10" />
          </div>
        </header>

        <div className="mx-auto max-w-6xl p-6">
          {/* Video Player */}
          <Card className="mb-6 overflow-hidden">
            {lesson.video_url ? (
              <div className="relative" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={getYouTubeEmbedUrl(lesson.video_url)}
                  title={lesson.title}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center bg-muted">
                <p className="text-muted-foreground">
                  Видео для этого урока пока недоступно
                </p>
              </div>
            )}
          </Card>

          {/* Lesson Info */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{formatDuration(lesson.duration)}</Badge>
                {lesson.is_preview && (
                  <Badge variant="secondary">Бесплатный просмотр</Badge>
                )}
                {isCompleted && (
                  <Badge className="bg-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Завершен
                  </Badge>
                )}
              </div>
              <h1 className="mb-2 font-display text-3xl font-bold">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="text-muted-foreground">{lesson.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="completed"
                checked={isCompleted}
                onCheckedChange={handleCompleteToggle}
              />
              <label
                htmlFor="completed"
                className="cursor-pointer text-sm font-medium"
              >
                Урок пройден
              </label>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {lesson.prev_lesson_id ? (
              <Button variant="outline" asChild>
                <Link
                  to={`/dashboard/courses/${courseId}/lessons/${lesson.prev_lesson_id}`}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Предыдущий урок
                </Link>
              </Button>
            ) : (
              <div />
            )}

            {lesson.next_lesson_id ? (
              <Button variant="hero" asChild>
                <Link
                  to={`/dashboard/courses/${courseId}/lessons/${lesson.next_lesson_id}`}
                >
                  Следующий урок
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="hero" asChild>
                <Link to={`/dashboard/courses/${courseId}`}>
                  Вернуться к курсу
                </Link>
              </Button>
            )}
          </div>

          {/* Additional Materials */}
          {lesson.materials && lesson.materials.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="mb-4 font-display text-xl font-semibold">
                  Материалы урока
                </h3>
                <div className="space-y-2">
                  {lesson.materials.map((material: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span>{material.name}</span>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Скачать
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

