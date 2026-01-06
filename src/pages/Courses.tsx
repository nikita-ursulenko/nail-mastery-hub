import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CourseCard } from "@/components/courses/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import courseBasic from "@/assets/course-basic.jpg";
import courseGel from "@/assets/course-gel.jpg";
import courseArt from "@/assets/course-art.jpg";

const allCourses = [
  {
    id: "basic-manicure",
    title: "Базовый курс маникюра",
    description:
      "Освойте профессию nail-мастера с нуля. Классический и аппаратный маникюр, покрытие гель-лаком.",
    image: courseBasic,
    price: 129,
    oldPrice: 199,
    duration: "4 недели",
    students: 2847,
    rating: 4.9,
    level: "beginner" as const,
    isNew: true,
    category: "basics",
  },
  {
    id: "gel-extension",
    title: "Наращивание гелем",
    description:
      "Научитесь создавать идеальные ногти любой формы. Работа с формами, апексом и архитектурой.",
    image: courseGel,
    price: 159,
    oldPrice: 229,
    duration: "6 недель",
    students: 1523,
    rating: 4.8,
    level: "intermediate" as const,
    category: "extension",
  },
  {
    id: "nail-art",
    title: "Мастер nail-дизайна",
    description:
      "Авторские техники дизайна: акварель, инкрустация, объёмный декор. Станьте востребованным художником.",
    image: courseArt,
    price: 189,
    duration: "8 недель",
    students: 892,
    rating: 4.9,
    level: "advanced" as const,
    category: "design",
  },
  {
    id: "hardware-manicure",
    title: "Аппаратный маникюр",
    description:
      "Профессиональное владение аппаратом. Фрезы, техники, работа с проблемными ногтями.",
    image: courseBasic,
    price: 99,
    oldPrice: 149,
    duration: "3 недели",
    students: 1892,
    rating: 4.7,
    level: "beginner" as const,
    category: "hardware",
  },
  {
    id: "gel-polish",
    title: "Идеальное покрытие гель-лаком",
    description:
      "Секреты стойкого покрытия без сколов. Работа с базами, выравнивание, тонкие ногти.",
    image: courseGel,
    price: 79,
    duration: "2 недели",
    students: 3241,
    rating: 4.9,
    level: "beginner" as const,
    isNew: true,
    category: "basics",
  },
  {
    id: "acrylic-extension",
    title: "Наращивание акрилом",
    description:
      "Классическая техника наращивания. Идеальный C-изгиб, работа с проблемными ногтями.",
    image: courseGel,
    price: 169,
    duration: "6 недель",
    students: 734,
    rating: 4.6,
    level: "intermediate" as const,
    category: "extension",
  },
];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || course.category === selectedCategory;
    const matchesLevel =
      selectedLevel === "all" || course.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
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
          {filteredCourses.length > 0 ? (
            <>
              <p className="mb-8 text-muted-foreground">
                Найдено курсов: {filteredCourses.length}
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))}
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
