# Vercel Deployment Guide для Nail Mastery Hub

## 🚀 Быстрый деплой

### 1. Подготовка проекта

Все готово! Проект настроен для деплоя на Vercel.

### 2. Деплой на Vercel

#### Через CLI:
```bash
npm install -g vercel
vercel login
vercel
```

#### Через веб-интерфейс:
1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите "Import Project"
3. Выберите ваш GitHub репозиторий
4. Vercel автоматически обнаружит настройки из `vercel.json`

### 3. Настройка Environment Variables в Vercel

После импорта, добавьте эти переменные в Vercel Dashboard → Settings → Environment Variables:

#### Обязательные переменные:

```bash
# Supabase
VITE_SUPABASE_URL=https://lorwsdylqykweyecrmuh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvcndzZHlscXlrd2V5ZWNybXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjE3ODgsImV4cCI6MjA4NDEzNzc4OH0.Sgi1Um3dxqQeNosvouQpf_TBJlG6tDmslspX7UrHtFY

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=diqlvaasz
VITE_CLOUDINARY_UPLOAD_PRESET=nails_image
VITE_CLOUDINARY_API_KEY=mp2d9PbPHBEiim2NbZTfKntbbm8

# Stripe (ЗАМЕНИТЕ НА PRODUCTION КЛЮЧИ!)
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY

# Analytics (опционально)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FB_PIXEL_ID=YOUR_PIXEL_ID
```

### 4. После деплоя

1. **Обновите Supabase Redirect URLs:**
   - Перейдите в Supabase Dashboard → Authentication → URL Configuration
   - Добавьте: `https://your-domain.vercel.app/**`
   - Добавьте: `https://your-domain.vercel.app/dashboard`

2. **Обновите Stripe Webhooks:**
   - Перейдите в Stripe Dashboard → Webhooks
   - Создайте новый webhook endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Скопируйте Signing Secret и добавьте как `STRIPE_WEBHOOK_SECRET` в Vercel

3. **Настройте Custom Domain (опционально):**
   - Vercel Dashboard → Settings → Domains
   - Добавьте ваш домен

## ✅ Что уже настроено:

- ✅ `window.location.origin` используется для автоопределения URL
- ✅ Security headers настроены в `vercel.json`
- ✅ API routes проксируются через `/api/*`
- ✅ Build оптимизирован для production
- ✅ Environment variables подготовлены

## 🔧 Проверка после деплоя:

```bash
# Проверьте что сайт работает
curl https://your-domain.vercel.app

# Проверьте API
curl https://your-domain.vercel.app/api/health
```

## 📝 Важные заметки:

1. **Stripe Keys**: Обязательно замените тестовые ключи на production!
2. **Supabase**: Проверьте Row Level Security (RLS) policies
3. **Analytics**: Настройте GA4 и Facebook Pixel в production
4. **CORS**: Убедитесь что Supabase настроен для вашего домена

## 🐛 Troubleshooting:

### Проблема: "Failed to fetch"
**Решение**: Проверьте CORS настройки в Supabase

### Проблема: Redirect не работает
**Решение**: Добавьте URL в Site URL и Redirect URLs в Supabase

### Проблема: Images не загружаются
**Решение**: Проверьте Cloudinary credentials

---

**Готово к деплою!** 🎉
