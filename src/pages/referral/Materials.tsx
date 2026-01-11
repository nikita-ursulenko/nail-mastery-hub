import { useState, useEffect } from 'react';
import { ReferralLayout } from '@/components/referral/ReferralLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { QRCode } from '@/components/referral/QRCode';

export default function ReferralMaterials() {
  const [referralLink, setReferralLink] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLink();
  }, []);

  const loadLink = async () => {
    try {
      setIsLoading(true);
      const linkData = await api.getReferralLink();
      setReferralLink(linkData.referral_link);
      setReferralCode(linkData.referral_code);
    } catch (error: any) {
      console.error('Failed to load link:', error);
      toast.error('Ошибка при загрузке ссылки');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  };

  if (isLoading) {
    return (
      <ReferralLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Загрузка материалов...</p>
          </div>
        </div>
      </ReferralLayout>
    );
  }

  return (
    <ReferralLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Промо-материалы</h1>
          <p className="text-muted-foreground">
            Используйте эти материалы для продвижения
          </p>
        </div>

        {/* Реферальная ссылка */}
        <Card>
          <CardHeader>
            <CardTitle>Реферальная ссылка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={referralLink} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(referralLink)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <Label>QR-код</Label>
                <QRCode value={referralLink} size={150} className="mt-2" />
              </div>
              <div className="flex-1">
                <Label>Реферальный код</Label>
                <div className="mt-2 flex items-center gap-2">
                  <code className="px-3 py-2 bg-muted rounded-md font-mono text-lg">
                    {referralCode}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(referralCode)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Копировать
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Готовые материалы */}
        <Card>
          <CardHeader>
            <CardTitle>Готовые материалы для продвижения</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Используйте эти материалы для продвижения в социальных сетях
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Готовый текст для поста:</p>
                <p className="text-sm mb-3">
                  "🎨 Изучайте маникюр с лучшими мастерами! Переходите по моей ссылке и получите доступ к профессиональным курсам: {referralLink}"
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`🎨 Изучайте маникюр с лучшими мастерами! Переходите по моей ссылке и получите доступ к профессиональным курсам: ${referralLink}`)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Копировать текст
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Короткий текст:</p>
                <p className="text-sm mb-3">
                  "💅 Профессиональные курсы маникюра! Переходите по ссылке: {referralLink}"
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`💅 Профессиональные курсы маникюра! Переходите по ссылке: ${referralLink}`)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Копировать текст
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Текст для Instagram:</p>
                <p className="text-sm mb-3">
                  "✨ Освойте профессию nail-мастера и начните зарабатывать! 🔗 Ссылка в профиле 👆"
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Вставьте ссылку в профиль Instagram
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`✨ Освойте профессию nail-мастера и начните зарабатывать! 🔗 Ссылка в профиле 👆\n\n${referralLink}`)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Копировать текст
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ReferralLayout>
  );
}