import { useState } from "react";
import { User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserAuth } from "@/contexts/UserAuthContext";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const { user } = useUserAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
      <div>
        <h1 className="font-display text-xl font-bold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            3
          </span>
        </Button>
        <Avatar
          src={
            user.avatar_upload_path
              ? `/uploads/avatars/${user.avatar_upload_path}`
              : user.avatar_url
          }
          name={user.name || "User"}
        />
      </div>
    </header>
  );
}

function Avatar({ src, name }: { src?: string; name: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <User className="h-5 w-5 text-primary" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      className="h-10 w-10 rounded-full object-cover"
      onError={() => setError(true)}
    />
  );
}

