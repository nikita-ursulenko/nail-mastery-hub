import { Link } from "react-router-dom";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
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

interface BlogCardProps {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  authorAvatar?: string;
  date: string;
  readTime: string;
  category: string;
  featured?: boolean;
}

export function BlogCard({
  id,
  title,
  excerpt,
  image,
  author,
  authorAvatar,
  date,
  readTime,
  category,
  featured = false,
}: BlogCardProps) {
  return (
    <Card
      variant={featured ? "elevated" : "default"}
      className="group flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-elevated"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {category}
          </Badge>
        </div>
      </div>

      <CardHeader className="flex-1 pb-3">
        <CardTitle className="line-clamp-2 text-xl lg:text-2xl">{title}</CardTitle>
        <CardDescription className="line-clamp-3 text-sm lg:text-base">
          {excerpt}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground lg:text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{readTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{author}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button size="sm" asChild>
          <Link to={`/blog/${id}`}>
            Читать далее
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

