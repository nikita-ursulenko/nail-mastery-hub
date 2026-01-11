import { useState, useEffect } from "react";
import {
  Upload,
  X,
  Moon,
  Sun,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function DashboardSettings() {
  const { user } = useUserAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar_url: "",
    avatar_upload_path: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [useAvatarUpload, setUseAvatarUpload] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [theme, setTheme] = useState<string>("light");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar_url: user.avatar_url || "",
        avatar_upload_path: user.avatar_upload_path || "",
      });
      
      if (user.avatar_upload_path) {
        setAvatarPreview(`/uploads/avatars/${user.avatar_upload_path}`);
        setUseAvatarUpload(true);
      } else if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
        setUseAvatarUpload(false);
      }
    }
    
    // Загружаем тему из localStorage
    const savedTheme = localStorage.getItem("user_theme") || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, [user]);

  const applyTheme = (themeValue: string) => {
    const root = document.documentElement;
    if (themeValue === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("user_theme", newTheme);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 5MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setUseAvatarUpload(true);
    }
  };

  const handleRemoveAvatarFile = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    setUseAvatarUpload(false);
    setFormData({ ...formData, avatar_upload_path: "", avatar_url: "" });
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      let submitData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
      };

      // Если загружен файл, сначала загружаем его
      if (avatarFile) {
        setIsUploading(true);
        try {
          const uploadResult = await api.uploadUserAvatar(avatarFile);
          submitData.avatar_upload_path = uploadResult.filename;
          submitData.avatar_url = null;
        } catch (uploadError: any) {
          toast.error(uploadError.message || "Ошибка при загрузке файла");
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else if (!useAvatarUpload && formData.avatar_url) {
        submitData.avatar_url = formData.avatar_url;
        submitData.avatar_upload_path = null;
      } else if (formData.avatar_upload_path) {
        submitData.avatar_upload_path = formData.avatar_upload_path;
        submitData.avatar_url = null;
      } else {
        submitData.avatar_url = null;
        submitData.avatar_upload_path = null;
      }

      await api.updateUserProfile(submitData);
      toast.success("Профиль успешно обновлен");
      
      // Обновляем данные пользователя в контексте
      window.location.reload(); // Простое решение для обновления данных
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      toast.error(error.message || "Ошибка при сохранении профиля");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Новые пароли не совпадают");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Новый пароль должен быть не менее 6 символов");
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.changeUserPassword(passwordData.oldPassword, passwordData.newPassword);
      toast.success("Пароль успешно изменен");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Failed to change password:", error);
      toast.error(error.message || "Ошибка при смене пароля");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Профиль</CardTitle>
                <CardDescription>
                  Обновите информацию о вашем аккаунте
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="space-y-2">
                  <Label>Аватар</Label>
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={!useAvatarUpload ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseAvatarUpload(false);
                          setAvatarFile(null);
                          setAvatarPreview(formData.avatar_url || "");
                          setFormData({ ...formData, avatar_upload_path: "" });
                        }}
                      >
                        URL
                      </Button>
                      <Button
                        type="button"
                        variant={useAvatarUpload ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseAvatarUpload(true);
                          setFormData({ ...formData, avatar_url: "" });
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Загрузить файл
                      </Button>
                    </div>

                    {!useAvatarUpload && (
                      <Input
                        id="avatar_url"
                        value={formData.avatar_url}
                        onChange={(e) => {
                          setFormData({ ...formData, avatar_url: e.target.value });
                          setAvatarPreview(e.target.value);
                        }}
                        placeholder="https://example.com/avatar.jpg"
                      />
                    )}

                    {useAvatarUpload && (
                      <div className="space-y-2">
                        <input
                          id="avatar_file"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            document.getElementById("avatar_file")?.click();
                          }}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {avatarFile ? avatarFile.name : "Выберите файл"}
                        </Button>
                      </div>
                    )}

                    {avatarPreview && (
                      <div className="relative inline-block">
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="h-20 w-20 rounded-full object-cover border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={handleRemoveAvatarFile}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Имя *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Ваше имя"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    placeholder="your@email.com"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving || isUploading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving || isUploading ? "Сохранение..." : "Сохранить"}
                </Button>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle>Смена пароля</CardTitle>
                <CardDescription>
                  Измените пароль вашего аккаунта
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Старый пароль *</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        oldPassword: e.target.value,
                      })
                    }
                    required
                    placeholder="Введите текущий пароль"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Новый пароль *</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    required
                    placeholder="Минимум 6 символов"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Подтвердите новый пароль *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    placeholder="Повторите новый пароль"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Изменение..." : "Изменить пароль"}
                </Button>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Внешний вид</CardTitle>
                <CardDescription>
                  Настройте внешний вид интерфейса
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base">Цвет темы</Label>
                  <RadioGroup value={theme} onValueChange={handleThemeChange}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label
                        htmlFor="light"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Sun className="h-4 w-4" />
                        Светлая тема
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label
                        htmlFor="dark"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Moon className="h-4 w-4" />
                        Темная тема
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
      </div>
    </DashboardLayout>
  );
}

