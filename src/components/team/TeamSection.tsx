import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image_url?: string | null;
  image_upload_path?: string | null;
  achievements: string[];
  display_order: number;
  is_active: boolean;
}

interface TeamSectionProps {
  title?: string;
  description?: string;
  className?: string;
}

export function TeamSection({
  title = "Наша команда",
  description = "Опытные преподаватели, которые помогут вам достичь успеха",
  className = "",
}: TeamSectionProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const data = await api.getPublicTeamMembers();
      setTeamMembers(data);
    } catch (error) {
      console.error("Failed to load team members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className={`py-16 lg:py-24 ${className}`}>
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Загрузка команды...</div>
          </div>
        </div>
      </section>
    );
  }

  if (teamMembers.length === 0) {
    return null;
  }

  return (
    <section className={`py-16 lg:py-24 ${className}`}>
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold lg:text-4xl">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => {
            const imageUrl = member.image_upload_path
              ? `/uploads/team/${member.image_upload_path}`
              : member.image_url || "";

            return (
              <Card key={member.id} variant="elevated" className="group">
                <CardContent className="p-6">
                  {imageUrl && (
                    <div className="mb-6 overflow-hidden rounded-xl">
                      <img
                        src={imageUrl}
                        alt={member.name}
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <h3 className="mb-1 font-display text-xl font-semibold">
                    {member.name}
                  </h3>
                  <p className="mb-4 text-sm text-primary">{member.role}</p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {member.bio}
                  </p>
                  {member.achievements && member.achievements.length > 0 && (
                    <ul className="space-y-2">
                      {member.achievements.map((achievement, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-muted-foreground">
                            {achievement}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

