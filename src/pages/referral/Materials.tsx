import { useState, useEffect } from 'react';
import { ReferralLayout } from '@/components/referral/ReferralLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { QRCode } from '@/components/referral/QRCode';

export default function ReferralMaterials() {
  const [referralLink, setReferralLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLink();
  }, []);

  const loadLink = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const referralCode = user.user_metadata?.referral_code;
      if (!referralCode) throw new Error('No referral code found');

      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}/?ref=${referralCode}`);
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

  const downloadQRCode = async () => {
    try {
      // Находим SVG элемент QR-кода
      const container = document.getElementById('qr-code-container');
      if (!container) return;

      const svgElement = container.querySelector('svg');
      if (!svgElement) return;

      // Создаем canvas для конвертации SVG в PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 250; // Размер для скачивания
      canvas.width = size + 32;
      canvas.height = size + 32;

      // Белый фон
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Конвертируем SVG в изображение
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Масштабируем QR-код до нужного размера
        const scale = size / 180; // 180 - это размер из компонента
        ctx.drawImage(img, 16, 16, 180 * scale, 180 * scale);

        // Конвертируем canvas в blob и скачиваем
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `qr-code.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            toast.success('QR-код скачан');
          }
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error('Ошибка при скачивании QR-кода');
      };
      img.src = url;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Ошибка при скачивании QR-кода');
    }
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
          <h1 className="text-2xl md:text-3xl font-bold">Промо-материалы</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Используйте эти материалы для продвижения
          </p>
        </div>

        {/* Реферальная ссылка */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Реферальная ссылка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input value={referralLink} readOnly className="flex-1 text-sm" />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => copyToClipboard(referralLink)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-start gap-6">
              <div className="flex flex-col items-center w-full md:w-auto">
                <Label className="mb-3 text-sm font-medium">QR-код</Label>
                <div className="flex flex-col items-center gap-3">
                  <QRCode value={referralLink} size={180} className="" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadQRCode}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Скачать QR-код
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