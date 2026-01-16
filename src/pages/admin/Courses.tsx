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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Course {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  image_url?: string | null;
  image_upload_path?: string | null;
  video_preview_url?: string | null;
  level: string;
  category: string;
  duration: string;
  students_count: number;
  rating: number;
  reviews_count: number;
  is_new: boolean;
  is_featured: boolean;
  display_order: number;
  includes: string[];
  instructor_id?: number | null;
  is_active: boolean;
  instructor_name?: string | null;
}

interface Module {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  lessons?: Lesson[];
}

interface Lesson {
  id: number;
  module_id: number;
  title: string;
  description?: string;
  video_url?: string | null;
  video_upload_path?: string | null;
  duration?: string | null;
  order_index: number;
  is_preview: boolean;
  is_active: boolean;
}

interface Tariff {
  id: number;
  course_id: number;
  tariff_type: string;
  name: string;
  price: number;
  old_price?: number | null;
  features: string[];
  not_included: string[];
  is_popular: boolean;
  display_order: number;
  homework_reviews_limit?: number | null;
  curator_support_months?: number | null;
  is_active: boolean;
}

interface Material {
  id: number;
  course_id: number;
  name: string;
  price_info?: string | null;
  link?: string | null;
  display_order: number;
  is_active: boolean;
}

const levels = ['beginner', 'intermediate', 'advanced'];
const categories = ['basics', 'hardware', 'extension', 'design'];

const levelLabels: { [key: string]: string } = {
  beginner: 'Для начинающих',
  intermediate: 'Средний уровень',
  advanced: 'Продвинутый',
};

const categoryLabels: { [key: string]: string } = {
  basics: 'Базовые',
  hardware: 'Аппаратный',
  extension: 'Наращивание',
  design: 'Дизайн',
};

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  // Диалоги для модулей, уроков, тарифов, материалов
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleFormData, setModuleFormData] = useState({
    title: '',
    description: '',
    order_index: 1,
  });

  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    duration: '',
    order_index: 1,
    is_preview: false,
  });

  const [isTariffDialogOpen, setIsTariffDialogOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [tariffFormData, setTariffFormData] = useState({
    tariff_type: 'self' as 'self' | 'curator' | 'vip',
    name: '',
    price: 0,
    old_price: null as number | null,
    features: [] as string[],
    featureInput: '',
    not_included: [] as string[],
    notIncludedInput: '',
    is_popular: false,
    display_order: 1,
    homework_reviews_limit: null as number | null,
    curator_support_months: null as number | null,
  });

  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialFormData, setMaterialFormData] = useState({
    name: '',
    price_info: '',
    link: '',
    display_order: 1,
  });

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    image_upload_path: '',
    video_preview_url: '',
    level: 'beginner',
    category: 'basics',
    duration: '',
    instructor_id: null as number | null,
    is_featured: false,
    is_new: false,
    display_order: 0,
    includes: [] as string[],
    includeInput: '',
    is_active: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [useImageUpload, setUseImageUpload] = useState(false);

  useEffect(() => {
    loadCourses();
    loadTeamMembers();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseDetails(selectedCourse.id);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setCourses(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке курсов');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const loadCourseDetails = async (courseId: number) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules:course_modules(
            *,
            lessons:course_lessons(*)
          ),
          tariffs:course_tariffs(*),
          materials:course_materials(*)
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;

      // Sort nested arrays manually since deep sort in select is complex
      if (data) {
        if (data.modules) {
          data.modules.sort((a: any, b: any) => a.order_index - b.order_index);
          data.modules.forEach((m: any) => {
            if (m.lessons) m.lessons.sort((a: any, b: any) => a.order_index - b.order_index);
          });
        }
        if (data.tariffs) data.tariffs.sort((a: any, b: any) => a.display_order - b.display_order);
        if (data.materials) data.materials.sort((a: any, b: any) => a.display_order - b.display_order);
      }

      setCourseDetails(data);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке деталей курса');
    }
  };

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      const isUploaded = course.image_upload_path;
      setFormData({
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle || '',
        description: course.description,
        image_url: isUploaded ? '' : (course.image_url || ''),
        image_upload_path: course.image_upload_path || '',
        video_preview_url: course.video_preview_url || '',
        level: course.level,
        category: course.category,
        duration: course.duration,
        instructor_id: course.instructor_id || null,
        is_featured: course.is_featured,
        is_new: course.is_new,
        display_order: course.display_order,
        includes: course.includes || [],
        includeInput: '',
        is_active: course.is_active,
      });
      if (isUploaded) {
        setImagePreview(course.image_upload_path);
        setUseImageUpload(true);
      } else if (course.image_url) {
        setImagePreview(course.image_url);
        setUseImageUpload(false);
      } else {
        setImagePreview('');
        setUseImageUpload(false);
      }
    } else {
      setEditingCourse(null);
      setFormData({
        slug: '',
        title: '',
        subtitle: '',
        description: '',
        image_url: '',
        image_upload_path: '',
        video_preview_url: '',
        level: 'beginner',
        category: 'basics',
        duration: '',
        instructor_id: null,
        is_featured: false,
        is_new: false,
        display_order: 0,
        includes: [],
        includeInput: '',
        is_active: true,
      });
      setImagePreview('');
      setUseImageUpload(false);
    }
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверка типа файла
      if (!file.type.startsWith('image/')) {
        toast.error('Пожалуйста, выберите изображение');
        return;
      }
      // Проверка размера (макс 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 5MB');
        return;
      }
      setImageFile(file);
      // Создаем preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setUseImageUpload(true);
    }
  };

  const handleRemoveImageFile = () => {
    setImageFile(null);
    setImagePreview('');
    setUseImageUpload(false);
    setFormData({ ...formData, image_upload_path: '', image_url: '' });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCourse(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => {
      const newSlug = !prev.slug || prev.slug === generateSlug(prev.title)
        ? generateSlug(title)
        : prev.slug;
      return { ...prev, title, slug: newSlug };
    });
  };

  const handleAddInclude = () => {
    if (formData.includeInput.trim()) {
      setFormData({
        ...formData,
        includes: [...formData.includes, formData.includeInput.trim()],
        includeInput: '',
      });
    }
  };

  const handleRemoveInclude = (index: number) => {
    setFormData({
      ...formData,
      includes: formData.includes.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let submitData: any = {
        ...formData,
        includes: formData.includes,
      };

      // Если есть файл изображения, загружаем его
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-content')
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error('Ошибка при загрузке изображения: ' + uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('course-content')
          .getPublicUrl(filePath);

        submitData.image_upload_path = filePath;
        submitData.image_url = publicUrl;
      } else if (!useImageUpload && formData.image_url) {
        submitData.image_url = formData.image_url;
        submitData.image_upload_path = null;
      } else if (formData.image_upload_path) {
        submitData.image_upload_path = formData.image_upload_path;
        // Keep existing URL if we are keeping the uploaded path
        // The image_url should already be in formData if it was an uploaded image
        // and we are not changing it.
      } else {
        submitData.image_url = null;
        submitData.image_upload_path = null;
      }

      // Cleanup undefined/null fields that Supabase might complain about if not valid
      // But upsert handles it well usually.
      // Need to handle `slug` uniqueness manually if needed, or let DB error catch it.

      // Ensure numeric fields are numbers or null
      if (submitData.instructor_id === "") submitData.instructor_id = null;

      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(submitData)
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast.success('Курс успешно обновлен');
      } else {
        // Remove id for new insertion
        const { id, ...newCourseData } = submitData;
        const { error } = await supabase
          .from('courses')
          .insert([newCourseData]);

        if (error) throw error;
        toast.success('Курс успешно создан');
      }
      loadCourses();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении курса');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот курс? Все связанные модули, уроки, тарифы и материалы также будут удалены.')) {
      try {
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast.success('Курс успешно удален');
        loadCourses();
        if (selectedCourse?.id === id) {
          setSelectedCourse(null);
          setCourseDetails(null);
        }
      } catch (error: any) {
        toast.error(error.message || 'Ошибка при удалении курса');
      }
    }
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Обработчики для модулей
  const handleOpenModuleDialog = (module?: Module) => {
    if (!selectedCourse) {
      toast.error('Сначала выберите курс');
      return;
    }
    if (module) {
      setEditingModule(module);
      setModuleFormData({
        title: module.title,
        description: module.description || '',
        order_index: module.order_index,
      });
    } else {
      setEditingModule(null);
      const maxOrder = courseDetails?.modules?.length
        ? Math.max(...courseDetails.modules.map((m: Module) => m.order_index)) + 1
        : 1;
      setModuleFormData({
        title: '',
        description: '',
        order_index: maxOrder,
      });
    }
    setIsModuleDialogOpen(true);
  };

  const handleCloseModuleDialog = () => {
    setIsModuleDialogOpen(false);
    setEditingModule(null);
  };

  const handleSubmitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      if (editingModule) {
        const { error } = await supabase
          .from('course_modules')
          .update(moduleFormData)
          .eq('id', editingModule.id);
        if (error) throw error;
        toast.success('Модуль успешно обновлен');
      } else {
        const { error } = await supabase
          .from('course_modules')
          .insert([{
            ...moduleFormData,
            course_id: selectedCourse.id,
          }]);
        if (error) throw error;
        toast.success('Модуль успешно создан');
      }
      loadCourseDetails(selectedCourse.id);
      handleCloseModuleDialog();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении модуля');
    }
  };

  const handleDeleteModule = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот модуль? Все уроки в модуле также будут удалены.')) {
      try {
        const { error } = await supabase
          .from('course_modules')
          .delete()
          .eq('id', id);
        if (error) throw error;
        toast.success('Модуль успешно удален');
        if (selectedCourse) {
          loadCourseDetails(selectedCourse.id);
        }
      } catch (error: any) {
        toast.error(error.message || 'Ошибка при удалении модуля');
      }
    }
  };

  // Обработчики для уроков
  const handleOpenLessonDialog = (moduleId: number, lesson?: Lesson) => {
    setSelectedModuleId(moduleId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonFormData({
        title: lesson.title,
        description: lesson.description || '',
        video_url: lesson.video_url || '',
        duration: lesson.duration || '',
        order_index: lesson.order_index,
        is_preview: lesson.is_preview,
      });
    } else {
      setEditingLesson(null);
      const module = courseDetails?.modules?.find((m: Module) => m.id === moduleId);
      const maxOrder = module?.lessons?.length
        ? Math.max(...module.lessons.map((l: Lesson) => l.order_index)) + 1
        : 1;
      setLessonFormData({
        title: '',
        description: '',
        video_url: '',
        duration: '',
        order_index: maxOrder,
        is_preview: false,
      });
    }
    setIsLessonDialogOpen(true);
  };

  const handleCloseLessonDialog = () => {
    setIsLessonDialogOpen(false);
    setEditingLesson(null);
    setSelectedModuleId(null);
  };

  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId) return;
    try {
      if (editingLesson) {
        const { error } = await supabase
          .from('course_lessons')
          .update(lessonFormData)
          .eq('id', editingLesson.id);
        if (error) throw error;
        toast.success('Урок успешно обновлен');
      } else {
        const { error } = await supabase
          .from('course_lessons')
          .insert([{
            ...lessonFormData,
            module_id: selectedModuleId,
          }]);
        if (error) throw error;
        toast.success('Урок успешно создан');
      }
      if (selectedCourse) {
        loadCourseDetails(selectedCourse.id);
      }
      handleCloseLessonDialog();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении урока');
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот урок?')) {
      try {
        const { error } = await supabase
          .from('course_lessons')
          .delete()
          .eq('id', id);
        if (error) throw error;
        toast.success('Урок успешно удален');
        if (selectedCourse) {
          loadCourseDetails(selectedCourse.id);
        }
      } catch (error: any) {
        toast.error(error.message || 'Ошибка при удалении урока');
      }
    }
  };

  // Обработчики для тарифов
  const handleOpenTariffDialog = (tariff?: Tariff) => {
    if (!selectedCourse) {
      toast.error('Сначала выберите курс');
      return;
    }
    if (tariff) {
      setEditingTariff(tariff);
      setTariffFormData({
        tariff_type: tariff.tariff_type as 'self' | 'curator' | 'vip',
        name: tariff.name,
        price: tariff.price,
        old_price: tariff.old_price,
        features: tariff.features || [],
        featureInput: '',
        not_included: tariff.not_included || [],
        notIncludedInput: '',
        is_popular: tariff.is_popular,
        display_order: tariff.display_order,
        homework_reviews_limit: tariff.homework_reviews_limit,
        curator_support_months: tariff.curator_support_months,
      });
    } else {
      setEditingTariff(null);
      const maxOrder = courseDetails?.tariffs?.length
        ? Math.max(...courseDetails.tariffs.map((t: Tariff) => t.display_order)) + 1
        : 1;
      setTariffFormData({
        tariff_type: 'self',
        name: '',
        price: 0,
        old_price: null,
        features: [],
        featureInput: '',
        not_included: [],
        notIncludedInput: '',
        is_popular: false,
        display_order: maxOrder,
        homework_reviews_limit: null,
        curator_support_months: null,
      });
    }
    setIsTariffDialogOpen(true);
  };

  const handleCloseTariffDialog = () => {
    setIsTariffDialogOpen(false);
    setEditingTariff(null);
  };

  const handleAddFeature = () => {
    if (tariffFormData.featureInput.trim()) {
      setTariffFormData({
        ...tariffFormData,
        features: [...tariffFormData.features, tariffFormData.featureInput.trim()],
        featureInput: '',
      });
    }
  };

  const handleRemoveFeature = (index: number) => {
    setTariffFormData({
      ...tariffFormData,
      features: tariffFormData.features.filter((_, i) => i !== index),
    });
  };

  const handleAddNotIncluded = () => {
    if (tariffFormData.notIncludedInput.trim()) {
      setTariffFormData({
        ...tariffFormData,
        not_included: [...tariffFormData.not_included, tariffFormData.notIncludedInput.trim()],
        notIncludedInput: '',
      });
    }
  };

  const handleRemoveNotIncluded = (index: number) => {
    setTariffFormData({
      ...tariffFormData,
      not_included: tariffFormData.not_included.filter((_, i) => i !== index),
    });
  };

  const handleSubmitTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      if (editingTariff) {
        const { error } = await supabase
          .from('course_tariffs')
          .update(tariffFormData)
          .eq('id', editingTariff.id);
        if (error) throw error;
        toast.success('Тариф успешно обновлен');
      } else {
        const { error } = await supabase
          .from('course_tariffs')
          .insert([{
            ...tariffFormData,
            course_id: selectedCourse.id,
          }]);
        if (error) throw error;
        toast.success('Тариф успешно создан');
      }
      loadCourseDetails(selectedCourse.id);
      handleCloseTariffDialog();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении тарифа');
    }
  };

  const handleDeleteTariff = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тариф?')) {
      try {
        const { error } = await supabase
          .from('course_tariffs')
          .delete()
          .eq('id', id);
        if (error) throw error;
        toast.success('Тариф успешно удален');
        if (selectedCourse) {
          loadCourseDetails(selectedCourse.id);
        }
      } catch (error: any) {
        toast.error(error.message || 'Ошибка при удалении тарифа');
      }
    }
  };

  // Обработчики для материалов
  const handleOpenMaterialDialog = (material?: Material) => {
    if (!selectedCourse) {
      toast.error('Сначала выберите курс');
      return;
    }
    if (material) {
      setEditingMaterial(material);
      setMaterialFormData({
        name: material.name,
        price_info: material.price_info || '',
        link: material.link || '',
        display_order: material.display_order,
      });
    } else {
      setEditingMaterial(null);
      const maxOrder = courseDetails?.materials?.length
        ? Math.max(...courseDetails.materials.map((m: Material) => m.display_order)) + 1
        : 1;
      setMaterialFormData({
        name: '',
        price_info: '',
        link: '',
        display_order: maxOrder,
      });
    }
    setIsMaterialDialogOpen(true);
  };

  const handleCloseMaterialDialog = () => {
    setIsMaterialDialogOpen(false);
    setEditingMaterial(null);
  };

  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      if (editingMaterial) {
        const { error } = await supabase
          .from('course_materials')
          .update(materialFormData)
          .eq('id', editingMaterial.id);
        if (error) throw error;
        toast.success('Материал успешно обновлен');
      } else {
        const { error } = await supabase
          .from('course_materials')
          .insert([{
            ...materialFormData,
            course_id: selectedCourse.id,
          }]);
        if (error) throw error;
        toast.success('Материал успешно создан');
      }
      loadCourseDetails(selectedCourse.id);
      handleCloseMaterialDialog();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении материала');
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот материал?')) {
      try {
        const { error } = await supabase
          .from('course_materials')
          .delete()
          .eq('id', id);
        if (error) throw error;
        toast.success('Материал успешно удален');
        if (selectedCourse) {
          loadCourseDetails(selectedCourse.id);
        }
      } catch (error: any) {
        toast.error(error.message || 'Ошибка при удалении материала');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Управление курсами</h1>
            <p className="text-muted-foreground">
              Добавляйте, редактируйте и управляйте курсами
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить курс
          </Button>
        </div>

        {/* Диалог для курса */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? 'Редактировать курс' : 'Добавить курс'}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию о курсе
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      required
                      placeholder="Базовый курс маникюра"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      placeholder="basic-manicure"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Подзаголовок</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="От новичка до профессионала за 4 недели"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    placeholder="Подробное описание курса..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Уровень *</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => setFormData({ ...formData, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {levelLabels[level]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Категория *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {categoryLabels[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Длительность *</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                      placeholder="4 недели"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Изображение курса</Label>
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={!useImageUpload ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setUseImageUpload(false);
                            setImageFile(null);
                            setImagePreview(formData.image_url || '');
                            setFormData({ ...formData, image_upload_path: '' });
                          }}
                        >
                          URL
                        </Button>
                        <Button
                          type="button"
                          variant={useImageUpload ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setUseImageUpload(true);
                            setFormData({ ...formData, image_url: '' });
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Загрузить файл
                        </Button>
                      </div>

                      {!useImageUpload && (
                        <Input
                          id="image_url"
                          value={formData.image_url}
                          onChange={(e) => {
                            setFormData({ ...formData, image_url: e.target.value });
                            setImagePreview(e.target.value);
                          }}
                          placeholder="https://example.com/image.jpg"
                        />
                      )}

                      {useImageUpload && (
                        <div className="space-y-2">
                          <input
                            id="course_image_file"
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              document.getElementById('course_image_file')?.click();
                            }}
                            className="w-full"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {imageFile ? imageFile.name : 'Выберите файл'}
                          </Button>
                        </div>
                      )}

                      {imagePreview && (
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Course Preview"
                            className="h-48 w-full rounded-lg object-cover border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={handleRemoveImageFile}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video_preview_url">Превью видео (URL)</Label>
                    <Input
                      id="video_preview_url"
                      value={formData.video_preview_url}
                      onChange={(e) => setFormData({ ...formData, video_preview_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructor_id">Преподаватель</Label>
                  <Select
                    value={formData.instructor_id?.toString() || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, instructor_id: value === 'none' ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите преподавателя" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без преподавателя</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name} - {member.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Что входит в курс</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.includeInput}
                      onChange={(e) => setFormData({ ...formData, includeInput: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInclude();
                        }
                      }}
                      placeholder="32 видеоурока в HD качестве"
                    />
                    <Button type="button" onClick={handleAddInclude}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.includes.map((item, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {item}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveInclude(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label htmlFor="is_featured">Рекомендуемый</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_new"
                      checked={formData.is_new}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })}
                    />
                    <Label htmlFor="is_new">Новый</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Активен</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Порядок отображения</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingCourse ? 'Сохранить' : 'Создать'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Загрузка курсов...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Список курсов */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Курсы ({courses.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedCourse?.id === course.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                          }`}
                        onClick={() => setSelectedCourse(course)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{course.title}</p>
                            <p className="text-sm opacity-80 truncate">{course.slug}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {course.is_featured && (
                                <Badge variant="secondary" className="text-xs">
                                  Рекомендуемый
                                </Badge>
                              )}
                              {course.is_new && (
                                <Badge variant="secondary" className="text-xs">
                                  Новый
                                </Badge>
                              )}
                              {!course.is_active && (
                                <Badge variant="destructive" className="text-xs">
                                  Неактивен
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDialog(course);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(course.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Детали курса */}
            <div className="lg:col-span-2">
              {selectedCourse ? (
                <Tabs defaultValue="modules" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="modules">Модули и уроки</TabsTrigger>
                    <TabsTrigger value="tariffs">Тарифы</TabsTrigger>
                    <TabsTrigger value="materials">Материалы</TabsTrigger>
                  </TabsList>

                  <TabsContent value="modules" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Модули и уроки</CardTitle>
                          <Button
                            size="sm"
                            onClick={() => handleOpenModuleDialog()}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить модуль
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {courseDetails?.modules && courseDetails.modules.length > 0 ? (
                          <div className="space-y-2">
                            {courseDetails.modules.map((module: Module) => (
                              <div key={module.id} className="border rounded-lg p-4">
                                <div
                                  className="flex items-center justify-between cursor-pointer"
                                  onClick={() => toggleModule(module.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    {expandedModules.has(module.id) ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                    <span className="font-medium">{module.title}</span>
                                    <Badge variant="secondary">
                                      {module.lessons?.length || 0} уроков
                                    </Badge>
                                  </div>
                                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenModuleDialog(module)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteModule(module.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {expandedModules.has(module.id) && (
                                  <div className="mt-4 space-y-2 pl-6">
                                    {module.lessons?.map((lesson: Lesson) => (
                                      <div
                                        key={lesson.id}
                                        className="flex items-center justify-between p-2 bg-muted rounded"
                                      >
                                        <span className="text-sm">{lesson.title}</span>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleOpenLessonDialog(module.id, lesson)}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteLesson(lesson.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => handleOpenLessonDialog(module.id)}
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Добавить урок
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            Модули не добавлены
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="tariffs" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Тарифы</CardTitle>
                          <Button
                            size="sm"
                            onClick={() => handleOpenTariffDialog()}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить тариф
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {courseDetails?.tariffs && courseDetails.tariffs.length > 0 ? (
                          <div className="space-y-4">
                            {courseDetails.tariffs.map((tariff: Tariff) => (
                              <div key={tariff.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{tariff.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {tariff.price} €
                                      {tariff.old_price && (
                                        <span className="line-through ml-2">
                                          {tariff.old_price} €
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenTariffDialog(tariff)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteTariff(tariff.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            Тарифы не добавлены
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="materials" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Материалы</CardTitle>
                          <Button
                            size="sm"
                            onClick={() => handleOpenMaterialDialog()}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить материал
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {courseDetails?.materials && courseDetails.materials.length > 0 ? (
                          <div className="space-y-2">
                            {courseDetails.materials.map((material: Material) => (
                              <div
                                key={material.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{material.name}</p>
                                  {material.price_info && (
                                    <p className="text-sm text-muted-foreground">
                                      {material.price_info}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenMaterialDialog(material)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteMaterial(material.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            Материалы не добавлены
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Выберите курс из списка для просмотра и редактирования
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Диалоги для модулей, уроков, тарифов и материалов - доступны всегда */}
        <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingModule ? 'Редактировать модуль' : 'Добавить модуль'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitModule}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="module_title">Название модуля *</Label>
                  <Input
                    id="module_title"
                    value={moduleFormData.title}
                    onChange={(e) => setModuleFormData({ ...moduleFormData, title: e.target.value })}
                    required
                    placeholder="Модуль 1. Введение в профессию"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module_description">Описание</Label>
                  <Textarea
                    id="module_description"
                    value={moduleFormData.description}
                    onChange={(e) => setModuleFormData({ ...moduleFormData, description: e.target.value })}
                    rows={3}
                    placeholder="Описание модуля..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module_order">Порядок *</Label>
                  <Input
                    id="module_order"
                    type="number"
                    value={moduleFormData.order_index}
                    onChange={(e) => setModuleFormData({ ...moduleFormData, order_index: parseInt(e.target.value) || 1 })}
                    required
                    min={1}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModuleDialog}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingModule ? 'Сохранить' : 'Создать'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? 'Редактировать урок' : 'Добавить урок'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitLesson}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson_title">Название урока *</Label>
                  <Input
                    id="lesson_title"
                    value={lessonFormData.title}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                    required
                    placeholder="Обзор профессии nail-мастера"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson_description">Описание</Label>
                  <Textarea
                    id="lesson_description"
                    value={lessonFormData.description}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                    rows={3}
                    placeholder="Описание урока..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lesson_video_url">Видео (URL)</Label>
                    <Input
                      id="lesson_video_url"
                      value={lessonFormData.video_url}
                      onChange={(e) => setLessonFormData({ ...lessonFormData, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lesson_duration">Длительность</Label>
                    <Input
                      id="lesson_duration"
                      value={lessonFormData.duration}
                      onChange={(e) => setLessonFormData({ ...lessonFormData, duration: e.target.value })}
                      placeholder="15 мин"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lesson_order">Порядок *</Label>
                    <Input
                      id="lesson_order"
                      type="number"
                      value={lessonFormData.order_index}
                      onChange={(e) => setLessonFormData({ ...lessonFormData, order_index: parseInt(e.target.value) || 1 })}
                      required
                      min={1}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      id="lesson_preview"
                      checked={lessonFormData.is_preview}
                      onCheckedChange={(checked) => setLessonFormData({ ...lessonFormData, is_preview: checked })}
                    />
                    <Label htmlFor="lesson_preview">Превью (доступен без покупки)</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseLessonDialog}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingLesson ? 'Сохранить' : 'Создать'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isTariffDialogOpen} onOpenChange={setIsTariffDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTariff ? 'Редактировать тариф' : 'Добавить тариф'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitTariff}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tariff_type">Тип тарифа *</Label>
                    <Select
                      value={tariffFormData.tariff_type}
                      onValueChange={(value: 'self' | 'curator' | 'vip') => setTariffFormData({ ...tariffFormData, tariff_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Самостоятельный</SelectItem>
                        <SelectItem value="curator">С куратором</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tariff_name">Название *</Label>
                    <Input
                      id="tariff_name"
                      value={tariffFormData.name}
                      onChange={(e) => setTariffFormData({ ...tariffFormData, name: e.target.value })}
                      required
                      placeholder="Самостоятельный"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tariff_price">Цена (€) *</Label>
                    <Input
                      id="tariff_price"
                      type="number"
                      step="0.01"
                      value={tariffFormData.price}
                      onChange={(e) => setTariffFormData({ ...tariffFormData, price: parseFloat(e.target.value) || 0 })}
                      required
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tariff_old_price">Старая цена (€)</Label>
                    <Input
                      id="tariff_old_price"
                      type="number"
                      step="0.01"
                      value={tariffFormData.old_price || ''}
                      onChange={(e) => setTariffFormData({ ...tariffFormData, old_price: e.target.value ? parseFloat(e.target.value) : null })}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tariff_order">Порядок</Label>
                    <Input
                      id="tariff_order"
                      type="number"
                      value={tariffFormData.display_order}
                      onChange={(e) => setTariffFormData({ ...tariffFormData, display_order: parseInt(e.target.value) || 1 })}
                      min={1}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Что входит в тариф</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tariffFormData.featureInput}
                      onChange={(e) => setTariffFormData({ ...tariffFormData, featureInput: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      placeholder="Доступ ко всем урокам"
                    />
                    <Button type="button" onClick={handleAddFeature}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tariffFormData.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {feature}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveFeature(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Что не входит (для сравнения)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tariffFormData.notIncludedInput}
                      onChange={(e) => setTariffFormData({ ...tariffFormData, notIncludedInput: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNotIncluded();
                        }
                      }}
                      placeholder="Проверка ДЗ"
                    />
                    <Button type="button" onClick={handleAddNotIncluded}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tariffFormData.not_included.map((item, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {item}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveNotIncluded(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                {(tariffFormData.tariff_type === 'curator' || tariffFormData.tariff_type === 'vip') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="homework_limit">Лимит проверок ДЗ</Label>
                      <Input
                        id="homework_limit"
                        type="number"
                        value={tariffFormData.homework_reviews_limit || ''}
                        onChange={(e) => setTariffFormData({ ...tariffFormData, homework_reviews_limit: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="16 (оставьте пустым для безлимита)"
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="support_months">Месяцев поддержки куратора</Label>
                      <Input
                        id="support_months"
                        type="number"
                        value={tariffFormData.curator_support_months || ''}
                        onChange={(e) => setTariffFormData({ ...tariffFormData, curator_support_months: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="2 (оставьте пустым для бессрочно)"
                        min={0}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tariff_popular"
                    checked={tariffFormData.is_popular}
                    onCheckedChange={(checked) => setTariffFormData({ ...tariffFormData, is_popular: checked })}
                  />
                  <Label htmlFor="tariff_popular">Популярный тариф</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseTariffDialog}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingTariff ? 'Сохранить' : 'Создать'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? 'Редактировать материал' : 'Добавить материал'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitMaterial}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="material_name">Название *</Label>
                  <Input
                    id="material_name"
                    value={materialFormData.name}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, name: e.target.value })}
                    required
                    placeholder="Аппарат для маникюра"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material_price_info">Информация о цене</Label>
                  <Input
                    id="material_price_info"
                    value={materialFormData.price_info}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, price_info: e.target.value })}
                    placeholder="(от 100 €)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material_link">Ссылка на магазин</Label>
                  <Input
                    id="material_link"
                    value={materialFormData.link}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, link: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material_order">Порядок</Label>
                  <Input
                    id="material_order"
                    type="number"
                    value={materialFormData.display_order}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, display_order: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseMaterialDialog}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingMaterial ? 'Сохранить' : 'Создать'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

