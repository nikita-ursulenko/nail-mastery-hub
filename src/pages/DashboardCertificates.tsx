import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Award, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface Certificate {
  id: number;
  course_id: number;
  course_title: string;
  course_slug: string;
  issued_at: string;
  certificate_number: string;
  status: string;
  download_url?: string;
}

export default function DashboardCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Загрузить сертификаты из API
    // Пока используем заглушку
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      // TODO: Реализовать API для получения сертификатов
      // const response = await api.getUserCertificates();
      // setCertificates(response.certificates || []);
      
      // Заглушка - пустой список
      setCertificates([]);
    } catch (error) {
      console.error("Failed to load certificates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div>
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : certificates.length === 0 ? (
            <Card className="p-12 text-center">
              <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-2 font-display text-xl font-bold">
                У вас пока нет сертификатов
              </h2>
              <p className="mb-6 text-muted-foreground">
                Завершите курс, чтобы получить сертификат об окончании
              </p>
              <Button asChild>
                <Link to="/dashboard/courses">Перейти к курсам</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {certificates.map((certificate) => (
                  <Card key={certificate.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="mb-2 text-lg">
                            {certificate.course_title}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            Сертификат №{certificate.certificate_number}
                          </Badge>
                        </div>
                        <Award className="h-8 w-8 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Дата выдачи:
                          </span>
                          <span className="font-medium">
                            {formatDate(certificate.issued_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Статус:</span>
                          <Badge
                            variant={
                              certificate.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {certificate.status === "active"
                              ? "Активен"
                              : "Неактивен"}
                          </Badge>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <Link to={`/courses/${certificate.course_slug}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Курс
                            </Link>
                          </Button>
                          {certificate.download_url && (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              asChild
                            >
                              <a
                                href={certificate.download_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Скачать
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
      </div>
    </DashboardLayout>
  );
}

