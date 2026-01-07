import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserAuth } from "@/contexts/UserAuthContext";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/courses", label: "Курсы" },
  { href: "/schedule", label: "Расписание" },
  { href: "/blog", label: "Блог" },
  { href: "/about", label: "О нас" },
  { href: "/contacts", label: "Контакты" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, isLoading } = useUserAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between lg:h-20">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-primary lg:text-3xl">
            NailArt
          </span>
          <span className="font-display text-lg text-muted-foreground lg:text-xl">
            Academy
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <Button size="sm" asChild>
                  <Link to="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Личный кабинет
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Войти
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="relative inline-flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-muted lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <Menu
            className={`h-6 w-6 transition-all duration-300 ${
              isOpen ? "rotate-90 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100"
            }`}
          />
          <X
            className={`absolute h-6 w-6 transition-all duration-300 ${
              isOpen ? "rotate-0 opacity-100 scale-100" : "rotate-90 opacity-0 scale-0"
            }`}
          />
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "overflow-hidden border-t transition-all duration-300 ease-in-out lg:hidden",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="container flex flex-col gap-4 py-6">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-base font-medium transition-all duration-300 hover:text-primary",
                location.pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground",
                isOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-4 opacity-0"
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
              }}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {!isLoading && (
            <div
              className={cn(
                "flex flex-col gap-3 pt-4 transition-all duration-300",
                isOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-4 opacity-0"
              )}
              style={{
                transitionDelay: isOpen ? `${navLinks.length * 50}ms` : "0ms",
              }}
            >
              {isAuthenticated ? (
                <Button asChild>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <User className="mr-2 h-4 w-4" />
                    Личный кабинет
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Войти
                  </Link>
                </Button>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
