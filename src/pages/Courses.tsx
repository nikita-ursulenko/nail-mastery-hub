import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CourseCard } from "@/components/courses/CourseCard";
import { FadeInOnScroll } from "@/components/FadeInOnScroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

const categories = [
  { id: "all", label: "Все курсы" },
  { id: "basics", label: "Базовые" },
  { id: "hardware", label: "Аппаратный" },
  { id: "extension", label: "Наращивание" },
  { id: "design", label: "Дизайн" },
];

const levels = [
  { id: "all", label: "Все уровни" },
  { id: "beginner", label: "Для начинающих" },
  { id: "intermediate", label: "Средний" },
  { id: "advanced", label: "Продвинутый" },
];

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [selectedCategory, selectedLevel, searchQuery]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPublicCourses({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        level: selectedLevel !== "all" ? selectedLevel : undefined,
        search: searchQuery || undefined,
        limit: 50,
      });
      setCourses(response.courses);
    } catch (err: any) {
      setError(err.message || "Ошибка при загрузке курсов");
      console.error("Error loading courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLevel("all");
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all" || selectedLevel !== "all";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero */}
      <section className="gradient-hero py-12 lg:py-16">
        <div className="container text-center">
          <h1 className="mb-4 font-display text-4xl font-bold lg:text-5xl">
            Каталог курсов
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Выберите свой путь в профессии nail-мастера. От базовых техник до
            авторского дизайна.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b bg-card py-6">
        <div className="container">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск курсов..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Toggle Filters (Mobile) */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Фильтры
            </Button>

            {/* Category Filters (Desktop) */}
            <div className="hidden flex-wrap items-center gap-2 lg:flex">
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className="cursor-pointer px-4 py-1.5 text-sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>

            {/* Level Filters (Desktop) */}
            <div className="hidden items-center gap-2 lg:flex">
              <span className="text-sm text-muted-foreground">Уровень:</span>
              {levels.slice(1).map((level) => (
                <Badge
                  key={level.id}
                  variant={selectedLevel === level.id ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 text-xs"
                  onClick={() =>
                    setSelectedLevel(
                      selectedLevel === level.id ? "all" : level.id
                    )
                  }
                >
                  {level.label}
                </Badge>
              ))}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="hidden lg:flex"
              >
                <X className="mr-1 h-4 w-4" />
                Сбросить
              </Button>
            )}
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="mt-4 space-y-4 border-t pt-4 lg:hidden">
              <div>
                <p className="mb-2 text-sm font-medium">Категория</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={
                        selectedCategory === cat.id ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Уровень</p>
                <div className="flex flex-wrap gap-2">
                  {levels.map((level) => (
                    <Badge
                      key={level.id}
                      variant={
                        selectedLevel === level.id ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => setSelectedLevel(level.id)}
                    >
                      {level.label}
                    </Badge>
                  ))}
                </div>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Сбросить все
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Course Grid */}
      <section className="flex-1 py-12 lg:py-16">
        <div className="container">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Загрузка курсов...</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="mb-4 text-xl font-medium text-destructive">{error}</p>
              <Button variant="outline" onClick={loadCourses}>
                Попробовать снова
              </Button>
            </div>
          ) : filteredCourses.length > 0 ? (
            <>
              <FadeInOnScroll>
                <p className="mb-8 text-muted-foreground">
                  Найдено курсов: {filteredCourses.length}
                </p>
              </FadeInOnScroll>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course, index) => {
                  // Формируем URL изображения с fallback
                  let imageUrl = "";
                  if (course.image_upload_path) {
                    // Если путь уже начинается с /uploads/, используем как есть, иначе добавляем префикс
                    imageUrl = course.image_upload_path.startsWith('/uploads/')
                      ? course.image_upload_path
                      : `/uploads/courses/${course.image_upload_path}`;
                  } else if (course.image_url) {
                    imageUrl = course.image_url;
                  } else {
                    // Fallback изображение (можно использовать placeholder)
                    imageUrl = "https://via.placeholder.com/400x300?text=Course";
                  }

                  return (
                    <FadeInOnScroll key={course.id || course.slug} delay={index * 50} className="h-full">
                      <CourseCard
                        id={course.slug}
                        title={course.title || "Без названия"}
                        description={course.description || ""}
                        image={imageUrl}
                        price={course.price || 0}
                        oldPrice={course.oldPrice}
                        duration={course.duration || ""}
                        students={course.students || 0}
                        rating={course.rating || 0}
                        level={course.level || "beginner"}
                        isNew={course.isNew}
                      />
                    </FadeInOnScroll>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <p className="mb-4 text-xl font-medium">Курсы не найдены</p>
              <p className="mb-6 text-muted-foreground">
                Попробуйте изменить параметры поиска
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Сбросить фильтры
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
