import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface Lesson {
  id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  duration: number;
  is_preview: boolean;
  order_index: number;
  is_completed: boolean;
  watched_duration: number;
  last_watched_at: string | null;
}

interface Module {
  id: number;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Material {
  id: number;
  name: string;
  price_info: string;
  display_order: number;
}

interface Course {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string | null;
  image_upload_path: string | null;
  video_preview_url: string | null;
  level: string;
  category: string;
  duration: string;
  rating: number;
  reviews_count: number;
  includes: string[];
  instructor_id: number | null;
  modules: Module[];
  materials: Material[];
}

interface Enrollment {
  tariff_name: string;
  tariff_type: string;
  homework_reviews_limit: number | null;
  curator_support_months: number | null;
  progress_percent: number;
  lessons_completed: number;
  total_lessons: number;
  purchased_at: string;
  started_at: string | null;
  expires_at: string | null;
}

export default function DashboardCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  useEffect(() => {
    if (id) {
      loadCourseDetails();
    }
  }, [id]);

  const loadCourseDetails = async () => {
    try {
      setIsLoading(true);
      const data = await api.getUserCourseDetails(parseInt(id!));
      setCourse(data.course);
      setEnrollment(data.enrollment);
      // Раскрываем первый модуль по умолчанию
      if (data.course?.modules && data.course.modules.length > 0) {
        setExpandedModules([data.course.modules[0].id]);
      }
    } catch (error: any) {
      toast.error(error.message || "Ошибка при загрузке курса");
      navigate("/dashboard/courses");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
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

  const getCompletedLessonsInModule = (module: Module) => {
    return module.lessons.filter((lesson) => lesson.is_completed).length;
  };

  const getImageUrl = () => {
    if (!course) return "/placeholder-course.jpg";
    if (course.image_upload_path) return course.image_upload_path;
    if (course.image_url) return course.image_url;
    return "/placeholder-course.jpg";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course || !enrollment) {
    return null;
  }

  return (
    <DashboardLayout title={course.title} description={course.subtitle}>
      <div>
        {/* Navigation back to courses */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/courses">← Назад к курсам</Link>
          </Button>
        </div>

          {/* Course Header */}
          <Card className="mb-6 overflow-hidden">
            <div className="flex flex-col gap-6 md:flex-row">
              <img
                src={getImageUrl()}
                alt={course.title}
                loading="lazy"
                decoding="async"
                className="h-64 w-full shrink-0 object-cover md:w-80"
              />
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge>{enrollment.tariff_name}</Badge>
                    <Badge variant="outline">
                      {enrollment.lessons_completed} / {enrollment.total_lessons} уроков
                    </Badge>
                  </div>
                  <h1 className="mb-2 font-display text-3xl font-bold">
                    {course.title}
                  </h1>
                  <p className="mb-4 text-lg text-muted-foreground">
                    {course.subtitle}
                  </p>
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Прогресс курса</span>
                      <span className="font-medium">
                        {enrollment.progress_percent}%
                      </span>
                    </div>
                    <Progress value={enrollment.progress_percent} className="h-3" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {course.duration}
                  </div>
                  {enrollment.progress_percent === 100 && (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Курс завершен
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Modules & Lessons */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-display text-xl font-bold">Программа курса</h2>

              {course.modules.map((module) => {
                const isExpanded = expandedModules.includes(module.id);
                const completedLessons = getCompletedLessonsInModule(module);
                const totalLessons = module.lessons.length;
                const moduleProgress =
                  totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

                return (
                  <Card key={module.id}>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            {module.title}
                            {moduleProgress === 100 && (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                          </CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {completedLessons} / {totalLessons} уроков завершено
                          </p>
                          <Progress value={moduleProgress} className="mt-2 h-1" />
                        </div>
                        <Button variant="ghost" size="icon">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="space-y-2">
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                              lesson.is_completed
                                ? "border-green-200 bg-green-50/50"
                                : "hover:bg-muted/50"
                            )}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              {lesson.is_completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : lesson.is_preview ? (
                                <PlayCircle className="h-5 w-5 text-primary" />
                              ) : (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{lesson.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDuration(lesson.duration)}
                                {lesson.is_preview && " • Бесплатный просмотр"}
                              </p>
                            </div>
                            {(lesson.is_preview || true) && (
                              <Button
                                size="sm"
                                variant={lesson.is_completed ? "outline" : "default"}
                                asChild
                              >
                                <Link
                                  to={`/dashboard/courses/${course.id}/lessons/${lesson.id}`}
                                >
                                  {lesson.is_completed ? "Пересмотреть" : "Начать"}
                                </Link>
                              </Button>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Course Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">О курсе</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium">Вы получите:</h4>
                    <ul className="space-y-2 text-sm">
                      {course.includes.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Materials */}
              {course.materials.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Необходимые материалы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {course.materials.map((material) => (
                        <li key={material.id} className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <span>{material.name}</span>
                            {material.price_info && (
                              <span className="ml-1 text-muted-foreground">
                                {material.price_info}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Tariff Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ваш тариф</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="mb-3">{enrollment.tariff_name}</Badge>
                  {enrollment.homework_reviews_limit && (
                    <p className="text-sm text-muted-foreground">
                      Доступно проверок ДЗ: {enrollment.homework_reviews_limit}
                    </p>
                  )}
                  {enrollment.curator_support_months && (
                    <p className="text-sm text-muted-foreground">
                      Поддержка куратора: {enrollment.curator_support_months} мес
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </DashboardLayout>
  );
}

