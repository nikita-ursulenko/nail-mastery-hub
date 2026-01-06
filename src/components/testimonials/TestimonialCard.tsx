import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TestimonialCardProps {
  name: string;
  role: string;
  avatar: string;
  text: string;
  rating: number;
  beforeImage?: string;
  afterImage?: string;
}

export function TestimonialCard({
  name,
  role,
  avatar,
  text,
  rating,
  beforeImage,
  afterImage,
}: TestimonialCardProps) {
  return (
    <Card variant="elevated" className="h-full">
      <CardContent className="flex h-full flex-col p-6">
        {/* Before/After Images */}
        {beforeImage && afterImage && (
          <div className="mb-6 grid grid-cols-2 gap-2 overflow-hidden rounded-lg">
            <div className="relative">
              <img
                src={beforeImage}
                alt="До"
                className="aspect-square w-full object-cover"
              />
              <span className="absolute bottom-2 left-2 rounded bg-foreground/80 px-2 py-0.5 text-xs text-background">
                До
              </span>
            </div>
            <div className="relative">
              <img
                src={afterImage}
                alt="После"
                className="aspect-square w-full object-cover"
              />
              <span className="absolute bottom-2 left-2 rounded bg-primary/90 px-2 py-0.5 text-xs text-primary-foreground">
                После
              </span>
            </div>
          </div>
        )}

        {/* Rating */}
        <div className="mb-4 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < rating ? "fill-highlight text-highlight" : "text-muted"
              }`}
            />
          ))}
        </div>

        {/* Quote */}
        <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
          "{text}"
        </p>

        {/* Author */}
        <div className="flex items-center gap-3">
          <img
            src={avatar}
            alt={name}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
