import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlayCircle, Clock, CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

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
  const { user } = useUserAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            id, slug, title, subtitle, description, image_url, image_upload_path,
            level, category, duration, rating, reviews_count
          ),
          tariff:course_tariffs(name, tariff_type)
        `)
        .eq('auth_user_id', user.id)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate lesson counts for each course
      const coursesWithCounts = await Promise.all((data || []).map(async (enrollment: any) => {
        // Get total lessons count
        const { data: modulesData } = await supabase
          .from('course_modules')
          .select('id')
          .eq('course_id', enrollment.course.id);

        let totalLessons = 0;
        if (modulesData && modulesData.length > 0) {
          const moduleIds = modulesData.map(m => m.id);
          const { count } = await supabase
            .from('course_lessons')
            .select('*', { count: 'exact', head: true })
            .in('module_id', moduleIds);
          totalLessons = count || 0;
        }

        // Get completed lessons count
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('enrollment_id', enrollment.id)
          .eq('is_completed', true);

        const lessonsCompleted = progressData?.length || 0;
        const progressPercent = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

        return {
          id: enrollment.course.id,
          slug: enrollment.course.slug,
          title: enrollment.course.title,
          subtitle: enrollment.course.subtitle || '',
          description: enrollment.course.description || '',
          image_url: enrollment.course.image_url,
          image_upload_path: enrollment.course.image_upload_path,
          level: enrollment.course.level || 'beginner',
          category: enrollment.course.category || 'general',
          duration: enrollment.course.duration || 'N/A',
          rating: enrollment.course.rating || 0,
          reviews_count: enrollment.course.reviews_count || 0,
          status: enrollment.status,
          progress_percent: progressPercent,
          lessons_completed: lessonsCompleted,
          total_lessons: totalLessons,
          purchased_at: enrollment.purchased_at,
          started_at: enrollment.started_at,
          expires_at: enrollment.expires_at,
          tariff_name: enrollment.tariff?.name || 'Неизвестно',
          tariff_type: enrollment.tariff?.tariff_type || 'standard',
        };
      }));

      setCourses(coursesWithCounts);
    } catch (error: any) {
      toast.error(error.message || "Ошибка при загрузке курсов");
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (course: Course) => {
    // Prioritize full URL if available
    if (course.image_url) {
      return course.image_url;
    }

    // If only upload path exists, construct Cloudinary URL
    if (course.image_upload_path) {
      // Cloudinary base URL from the database examples
      return `https://res.cloudinary.com/diqlvaasz/image/upload/${course.image_upload_path}.jpg`;
    }

    // Fallback to placeholder
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
    <DashboardLayout>
      <div>
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
    </DashboardLayout>
  );
}

