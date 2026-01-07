import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Moon, Sun, Save } from 'lucide-react';

interface Settings {
  theme?: {
    value: string;
    type: string;
    description?: string;
  };
  [key: string]: any;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<string>('light');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.getSettings();
      setSettings(response.settings);
      
      // Устанавливаем текущую тему
      if (response.settings.theme?.value) {
        setTheme(response.settings.theme.value);
        applyTheme(response.settings.theme.value);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Ошибка при загрузке настроек');
    } finally {
      setIsLoading(false);
    }
  };

  const applyTheme = (themeValue: string) => {
    const root = document.documentElement;
    if (themeValue === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.updateSettings({
        theme: theme,
      });
      toast.success('Настройки успешно сохранены');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.message || 'Ошибка при сохранении настроек');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Настройки</h1>
            <p className="text-muted-foreground">
              Управление настройками админ-панели
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>

        {/* Настройки темы */}
        <Card>
          <CardHeader>
            <CardTitle>Внешний вид</CardTitle>
            <CardDescription>
              Настройте внешний вид админ-панели
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base">Цвет темы</Label>
              <RadioGroup value={theme} onValueChange={handleThemeChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                    <Sun className="h-4 w-4" />
                    Светлая тема
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                    <Moon className="h-4 w-4" />
                    Темная тема
                  </Label>
                </div>
              </RadioGroup>
              {settings.theme?.description && (
                <p className="text-sm text-muted-foreground">
                  {settings.theme.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Информация о настройках */}
        <Card>
          <CardHeader>
            <CardTitle>Информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Настройки сохраняются автоматически при нажатии кнопки "Сохранить".
              </p>
              <p>
                Изменения применяются сразу после сохранения.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

