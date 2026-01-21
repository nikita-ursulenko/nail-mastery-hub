// dotenv.config() должен быть ПЕРВЫМ, до всех импортов, которые используют переменные окружения
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import userAuthRoutes from './routes/userAuth';
import userCoursesRoutes from './routes/userCourses';
import adminRoutes from './routes/admin';
import testimonialsRoutes from './routes/testimonials';
import contactsRoutes from './routes/contacts';
import founderRoutes from './routes/founder';
import teamRoutes from './routes/team';
import blogRoutes from './routes/blog';
import seoRoutes from './routes/seo';
import adminCoursesRoutes from './routes/adminCourses';
import adminUsersRoutes from './routes/adminUsers';
import adminSettingsRoutes from './routes/adminSettings';
import adminOrdersRoutes from './routes/adminOrders';
import uploadRoutes from './routes/upload';
import publicRoutes from './routes/public';
import paymentsRoutes from './routes/payments';
import referralAuthRoutes from './routes/referralAuth';
import referralTrackingRoutes from './routes/referralTracking';
import referralDashboardRoutes from './routes/referralDashboard';
import referralWithdrawalsRoutes from './routes/referralWithdrawals';
import referralNotificationsRoutes from './routes/referralNotifications';
import adminReferralRoutes from './routes/adminReferral';
import sitemapRoutes from './routes/sitemap';
import { securityHeaders, preventNoSqlInjection } from './middleware/security';
import { sanitize } from './middleware/validation';
import { apiRateLimit, loginRateLimit, uploadRateLimit } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { injectSeoMiddleware } from './middleware/seoInjector';
import { handleWebhook } from './controllers/paymentController';
import { asyncHandler } from './middleware/asyncHandler';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Security middleware (должен быть первым)
app.use(securityHeaders);
app.use(preventNoSqlInjection);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Webhook для Stripe должен быть ДО express.json() (нужен raw body)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Body parsing с ограничением размера
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Санитизация входных данных
app.use(sanitize);

// Rate limiting
app.use('/api/auth/login', loginRateLimit); // Админский логин
app.use('/api/user/auth/login', loginRateLimit); // Пользовательский логин
app.use('/api/user/auth/register', loginRateLimit); // Регистрация
app.use('/api/admin', apiRateLimit);
app.use('/api/public', apiRateLimit);

// Статические файлы (для загруженных изображений) с кэшированием
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
  maxAge: '1y', // Кэшируем статические файлы на 1 год
  etag: true,
  lastModified: true,
}));

// Routes
app.use('/api/auth', authRoutes); // Админская авторизация
app.use('/api/user/auth', userAuthRoutes); // Пользовательская авторизация
app.use('/api/user', userCoursesRoutes); // Пользовательские курсы
app.use('/api/admin', adminRoutes);
app.use('/api/admin/testimonials', testimonialsRoutes);
app.use('/api/admin/contacts', contactsRoutes);
app.use('/api/admin/founder', founderRoutes);
app.use('/api/admin/team', teamRoutes);
app.use('/api/admin/blog', blogRoutes);
app.use('/api/admin/seo', seoRoutes);
app.use('/api/admin', adminCoursesRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/referral/auth', referralAuthRoutes);
app.use('/api/referral/tracking', referralTrackingRoutes);
app.use('/api/referral/dashboard', referralDashboardRoutes);
app.use('/api/referral/withdrawals', referralWithdrawalsRoutes);
app.use('/api/referral/notifications', referralNotificationsRoutes);
app.use('/api/admin/referral', adminReferralRoutes);

// Sitemap
app.use('/', sitemapRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// SEO Injector - инжектит мета-теги в HTML перед отправкой
// Должен быть перед notFoundHandler, но после всех API роутов
// Это catch-all для всех не-API роутов
app.get('*', injectSeoMiddleware);

// Обработчик для несуществующих роутов (должен быть после всех роутов)
app.use(notFoundHandler);

// Обработчик ошибок (должен быть последним)
app.use(errorHandler);

app.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    console.log(`🚀 Server is running on port ${PORT}`);
  } else {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  }
});

