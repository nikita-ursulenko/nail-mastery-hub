import { Link } from "react-router-dom";
import { Clock, Users, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  oldPrice?: number;
  duration: string;
  students: number;
  rating: number;
  level: "beginner" | "intermediate" | "advanced";
  isNew?: boolean;
}

const levelLabels = {
  beginner: "Для начинающих",
  intermediate: "Средний уровень",
  advanced: "Продвинутый",
};

export function CourseCard({
  id,
  title,
  description,
  image,
  price,
  oldPrice,
  duration,
  students,
  rating,
  level,
  isNew,
}: CourseCardProps) {
  // Fallback изображение, если нет загруженного
  const imageSrc = image || "https://via.placeholder.com/400x300?text=Course";

  return (
    <Card variant="course" className="group">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            // Если изображение не загрузилось, используем placeholder
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Course";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {levelLabels[level]}
          </Badge>
          {isNew && (
            <Badge className="bg-primary text-primary-foreground">
              Новый
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2 text-xl">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{students.toLocaleString("ru-RU")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-highlight text-highlight" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">
            {price.toLocaleString("de-DE")} €
          </span>
          {oldPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {oldPrice.toLocaleString("de-DE")} €
            </span>
          )}
        </div>
        <Button size="sm" asChild>
          <Link to={`/courses/${id}`}>Подробнее</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
