import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

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
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (lessonId && user) {
      loadLesson();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [lessonId, user]);

  const loadLesson = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get enrollment
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', parseInt(courseId!))
        .eq('user_id', user.id)
        .single();

      if (!enrollmentData) throw new Error('Enrollment not found');
      setEnrollmentId(enrollmentData.id);

      // Get lesson with module info
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id, title, description, video_url, video_upload_path, duration, is_preview, display_order,
          materials, module_id,
          module:course_modules(id, title)
        `)
        .eq('id', parseInt(lessonId!))
        .single();

      if (lessonError) throw lessonError;

      // Get lesson progress
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollmentData.id)
        .eq('lesson_id', parseInt(lessonId!))
        .maybeSingle();

      // Get prev/next lessons
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, display_order')
        .eq('module_id', lessonData.module_id)
        .order('display_order', { ascending: true });

      const currentIndex = (allLessons || []).findIndex(l => l.id === parseInt(lessonId!));
      const prevLesson = currentIndex > 0 ? allLessons![currentIndex - 1] : null;
      const nextLesson = currentIndex < (allLessons?.length || 0) - 1 ? allLessons![currentIndex + 1] : null;

      setLesson({
        ...lessonData,
        module_title: lessonData.module?.title || '',
        course_id: parseInt(courseId!),
        order_index: lessonData.display_order,
        progress: {
          is_completed: progressData?.is_completed || false,
          watched_duration: progressData?.watched_duration || 0,
          last_watched_at: progressData?.last_watched_at || null,
        },
        prev_lesson_id: prevLesson?.id || null,
        next_lesson_id: nextLesson?.id || null,
      });

      setIsCompleted(progressData?.is_completed || false);
    } catch (error: any) {
      toast.error(error.message || "Ошибка при загрузке урока");
      navigate(`/dashboard/courses/${courseId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteToggle = async (checked: boolean) => {
    if (!lesson || !enrollmentId) return;

    try {
      setIsCompleted(checked);

      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id: enrollmentId,
          lesson_id: lesson.id,
          watched_duration: lesson.duration,
          is_completed: checked,
          last_watched_at: new Date().toISOString(),
        }, {
          onConflict: 'enrollment_id,lesson_id'
        });

      if (error) throw error;

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
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return null;
  }

  return (
    <DashboardLayout title={lesson.title} description={lesson.module_title}>
      <div>
        {/* Navigation back to course */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/dashboard/courses/${courseId}`}>
              ← Вернуться к курсу
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-6xl">
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
      </div>
    </DashboardLayout>
  );
}

