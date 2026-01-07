import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SEOSetting {
  id: number;
  path: string;
  title: string;
  description: string;
  keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  og_type?: string | null;
  og_url?: string | null;
  twitter_card?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  twitter_image?: string | null;
  canonical_url?: string | null;
  robots?: string | null;
  created_at?: string;
  updated_at?: string;
}

export default function AdminSEO() {
  const [seoSettings, setSeoSettings] = useState<SEOSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SEOSetting | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    path: '',
    title: '',
    description: '',
    keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    og_type: 'website',
    og_url: '',
    twitter_card: 'summary_large_image',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    canonical_url: '',
    robots: 'index, follow',
  });

  useEffect(() => {
    loadSEOSettings();
  }, []);

  const loadSEOSettings = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSEOSettings();
      setSeoSettings(data);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить SEO настройки',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (setting?: SEOSetting) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData({
        path: setting.path,
        title: setting.title,
        description: setting.description,
        keywords: setting.keywords || '',
        og_title: setting.og_title || '',
        og_description: setting.og_description || '',
        og_image: setting.og_image || '',
        og_type: setting.og_type || 'website',
        og_url: setting.og_url || '',
        twitter_card: setting.twitter_card || 'summary_large_image',
        twitter_title: setting.twitter_title || '',
        twitter_description: setting.twitter_description || '',
        twitter_image: setting.twitter_image || '',
        canonical_url: setting.canonical_url || '',
        robots: setting.robots || 'index, follow',
      });
    } else {
      setEditingSetting(null);
      setFormData({
        path: '',
        title: '',
        description: '',
        keywords: '',
        og_title: '',
        og_description: '',
        og_image: '',
        og_type: 'website',
        og_url: '',
        twitter_card: 'summary_large_image',
        twitter_title: '',
        twitter_description: '',
        twitter_image: '',
        canonical_url: '',
        robots: 'index, follow',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSetting(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSetting) {
        await api.updateSEO(editingSetting.id, formData);
        toast({
          title: 'Успешно',
          description: 'SEO настройки обновлены',
        });
      } else {
        await api.upsertSEO(formData);
        toast({
          title: 'Успешно',
          description: 'SEO настройки созданы',
        });
      }
      handleCloseDialog();
      loadSEOSettings();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить SEO настройки',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эти SEO настройки?')) {
      return;
    }

    try {
      await api.deleteSEO(id);
      toast({
        title: 'Успешно',
        description: 'SEO настройки удалены',
      });
      loadSEOSettings();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить SEO настройки',
        variant: 'destructive',
      });
    }
  };

  const filteredSettings = seoSettings.filter((setting) =>
    setting.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    setting.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">SEO Настройки</h2>
          <p className="text-muted-foreground">
            Управление мета-тегами и SEO для страниц сайта
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSetting ? 'Редактировать SEO' : 'Создать SEO настройки'}
              </DialogTitle>
              <DialogDescription>
                Заполните форму для настройки SEO мета-тегов страницы
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {/* Основные поля */}
                <div className="space-y-2">
                  <Label htmlFor="path">Путь страницы *</Label>
                  <Input
                    id="path"
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    placeholder="/ или /blog или /blog/my-article"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Путь должен начинаться с / (например: /, /blog, /about)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Заголовок страницы"
                    required
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Описание страницы (рекомендуется 150-160 символов)"
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="ключевое слово 1, ключевое слово 2"
                  />
                </div>

                {/* Open Graph */}
                <div className="border-t pt-4">
                  <h3 className="mb-4 font-semibold">Open Graph (для соцсетей)</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="og_title">OG Title</Label>
                      <Input
                        id="og_title"
                        value={formData.og_title}
                        onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                        placeholder="Если не указано, используется Title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="og_description">OG Description</Label>
                      <Textarea
                        id="og_description"
                        value={formData.og_description}
                        onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                        placeholder="Если не указано, используется Description"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="og_image">OG Image URL</Label>
                      <Input
                        id="og_image"
                        value={formData.og_image}
                        onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        type="url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="og_type">OG Type</Label>
                      <Input
                        id="og_type"
                        value={formData.og_type}
                        onChange={(e) => setFormData({ ...formData, og_type: e.target.value })}
                        placeholder="website, article, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="og_url">OG URL</Label>
                      <Input
                        id="og_url"
                        value={formData.og_url}
                        onChange={(e) => setFormData({ ...formData, og_url: e.target.value })}
                        placeholder="https://example.com/page"
                        type="url"
                      />
                    </div>
                  </div>
                </div>

                {/* Twitter Card */}
                <div className="border-t pt-4">
                  <h3 className="mb-4 font-semibold">Twitter Card</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter_card">Twitter Card Type</Label>
                      <Input
                        id="twitter_card"
                        value={formData.twitter_card}
                        onChange={(e) => setFormData({ ...formData, twitter_card: e.target.value })}
                        placeholder="summary_large_image"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter_title">Twitter Title</Label>
                      <Input
                        id="twitter_title"
                        value={formData.twitter_title}
                        onChange={(e) => setFormData({ ...formData, twitter_title: e.target.value })}
                        placeholder="Если не указано, используется OG Title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter_description">Twitter Description</Label>
                      <Textarea
                        id="twitter_description"
                        value={formData.twitter_description}
                        onChange={(e) => setFormData({ ...formData, twitter_description: e.target.value })}
                        placeholder="Если не указано, используется OG Description"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter_image">Twitter Image URL</Label>
                      <Input
                        id="twitter_image"
                        value={formData.twitter_image}
                        onChange={(e) => setFormData({ ...formData, twitter_image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        type="url"
                      />
                    </div>
                  </div>
                </div>

                {/* Дополнительные настройки */}
                <div className="border-t pt-4">
                  <h3 className="mb-4 font-semibold">Дополнительно</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="canonical_url">Canonical URL</Label>
                      <Input
                        id="canonical_url"
                        value={formData.canonical_url}
                        onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                        placeholder="https://example.com/page"
                        type="url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="robots">Robots</Label>
                      <Input
                        id="robots"
                        value={formData.robots}
                        onChange={(e) => setFormData({ ...formData, robots: e.target.value })}
                        placeholder="index, follow"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Отмена
                </Button>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по пути или заголовку..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Загрузка SEO настроек...</p>
        </div>
      ) : filteredSettings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'Ничего не найдено' : 'SEO настройки не найдены'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Путь</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-mono text-sm">{setting.path}</TableCell>
                    <TableCell className="max-w-xs truncate">{setting.title}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {setting.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(setting)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(setting.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}

