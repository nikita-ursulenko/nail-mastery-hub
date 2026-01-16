import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FadeInOnScroll } from "@/components/FadeInOnScroll";
import { supabase } from "@/lib/supabase";

interface FounderInfo {
  id: number;
  name: string;
  greeting: string;
  role: string;
  image_url?: string | null;
  image_upload_path?: string | null;
  experience_years: number;
  experience_label: string;
  achievements: string[];
  button_text: string;
  button_link?: string | null;
  is_active: boolean;
}

interface FounderSectionProps {
  className?: string;
}

export function FounderSection({ className = "" }: FounderSectionProps) {
  const [founderInfo, setFounderInfo] = useState<FounderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFounderInfo();
  }, []);

  const loadFounderInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('founder_info')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setFounderInfo(data);
    } catch (error) {
      console.error("Failed to load founder info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className={`py-16 lg:py-24 ${className}`}>
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Загрузка...</div>
          </div>
        </div>
      </section>
    );
  }

  if (!founderInfo || !founderInfo.is_active) {
    return null;
  }

  const imageUrl = founderInfo.image_upload_path
    ? `/uploads/founder/${founderInfo.image_upload_path}`
    : founderInfo.image_url || "";

  return (
    <section className={`py-16 lg:py-24 ${className}`}>
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Image */}
          <FadeInOnScroll direction="right" delay={0}>
            <div className="relative">
              {imageUrl && (
                <div className="relative aspect-[4/5] overflow-visible rounded-2xl">
                  <img
                    src={imageUrl}
                    alt={founderInfo.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover rounded-2xl"
                  />
                </div>
              )}
              {/* Experience Badge */}
              <Card className="absolute bottom-6 -right-4 lg:-right-8 bg-background/95 backdrop-blur-sm shadow-lg">
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {founderInfo.experience_years}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {founderInfo.experience_label}
                  </p>
                </div>
              </Card>
            </div>
          </FadeInOnScroll>

          {/* Content */}
          <FadeInOnScroll direction="left" delay={200}>
            <div className="space-y-6">
              <div>
                <h2 className="mb-2 font-display text-3xl font-bold lg:text-4xl">
                  {founderInfo.greeting} {founderInfo.name}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {founderInfo.role}
                </p>
              </div>

              {/* Achievements */}
              {founderInfo.achievements && founderInfo.achievements.length > 0 && (
                <ul className="space-y-3">
                  {founderInfo.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{achievement}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Button */}
              {founderInfo.button_text && (
                <div>
                  {founderInfo.button_link ? (
                    <Button size="lg" asChild>
                      <Link to={founderInfo.button_link}>
                        {founderInfo.button_text}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button size="lg">
                      {founderInfo.button_text}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}

