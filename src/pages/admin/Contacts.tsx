import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Phone, Mail, MapPin, Instagram } from 'lucide-react';
import { api } from '@/lib/api';

interface Contact {
  id: number;
  type: string;
  title: string;
  content: string;
  href?: string | null;
  subtitle?: string | null;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const iconMap: Record<string, any> = {
  Phone,
  Mail,
  MapPin,
  Instagram,
};

const iconOptions = [
  { value: 'Phone', label: 'Телефон' },
  { value: 'Mail', label: 'Email' },
  { value: 'MapPin', label: 'Адрес' },
  { value: 'Instagram', label: 'Instagram' },
];

const typeOptions = [
  { value: 'phone', label: 'Телефон' },
  { value: 'email', label: 'Email' },
  { value: 'address', label: 'Адрес' },
  { value: 'social', label: 'Социальные сети' },
];

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    type: 'phone',
    title: '',
    content: '',
    href: '',
    subtitle: '',
    icon: 'Phone',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await api.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        type: contact.type,
        title: contact.title,
        content: contact.content,
        href: contact.href || '',
        subtitle: contact.subtitle || '',
        icon: contact.icon,
        display_order: contact.display_order,
        is_active: contact.is_active,
      });
    } else {
      setEditingContact(null);
      setFormData({
        type: 'phone',
        title: '',
        content: '',
        href: '',
        subtitle: '',
        icon: 'Phone',
        display_order: 0,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await api.updateContact(editingContact.id, formData);
      } else {
        await api.createContact(formData);
      }
      await loadContacts();
      handleCloseDialog();
    } catch (error: any) {
      alert(error.message || 'Ошибка при сохранении контакта');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот контакт?')) {
      return;
    }
    try {
      await api.deleteContact(id);
      await loadContacts();
    } catch (error: any) {
      alert(error.message || 'Ошибка при удалении контакта');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Контакты</h1>
            <p className="text-muted-foreground">Управление контактной информацией</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить контакт
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? 'Редактировать контакт' : 'Добавить контакт'}
                </DialogTitle>
                <DialogDescription>
                  Заполните информацию о контакте
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Тип *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="icon">Иконка *</Label>
                      <Select
                        value={formData.icon}
                        onValueChange={(value) => setFormData({ ...formData, icon: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Заголовок *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Например: Телефон"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Содержимое *</Label>
                    <Input
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      placeholder="Например: +7 900 123-45-67"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="href">Ссылка (опционально)</Label>
                    <Input
                      id="href"
                      value={formData.href}
                      onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                      placeholder="tel:+79001234567 или mailto:info@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Подзаголовок (опционально)</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="Например: Пн-Вс: 9:00 - 21:00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_order">Порядок отображения</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) =>
                          setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                      <Label htmlFor="is_active">Активен</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Отмена
                  </Button>
                  <Button type="submit">
                    {editingContact ? 'Сохранить' : 'Создать'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Список контактов</CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Контакты не найдены. Добавьте первый контакт.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Иконка</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Заголовок</TableHead>
                    <TableHead>Содержимое</TableHead>
                    <TableHead>Порядок</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => {
                    const Icon = iconMap[contact.icon] || Phone;
                    return (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <Icon className="h-5 w-5 text-primary" />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{contact.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{contact.title}</TableCell>
                        <TableCell>{contact.content}</TableCell>
                        <TableCell>{contact.display_order}</TableCell>
                        <TableCell>
                          <Badge variant={contact.is_active ? 'default' : 'secondary'}>
                            {contact.is_active ? 'Активен' : 'Неактивен'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(contact)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(contact.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

