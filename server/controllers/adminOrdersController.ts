import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../../database/config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

/**
 * Получить все покупки/заказы
 */
export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, status, payment_status, limit, offset } = req.query;

  const pageLimit = limit ? parseInt(limit as string) : 50;
  const pageOffset = offset ? parseInt(offset as string) : 0;

  let query = supabase
    .from('enrollments')
    .select(`
      id,
      purchased_at,
      payment_status,
      amount_paid,
      payment_id,
      status,
      user:users (
        id,
        name,
        email
      ),
      course:courses (
        id,
        slug,
        title,
        image_url,
        image_upload_path
      ),
      tariff:course_tariffs (
        id,
        name,
        tariff_type,
        price
      )
    `, { count: 'exact' })
    .eq('payment_status', 'paid');

  if (status) {
    query = query.eq('status', status as string);
  }

  if (payment_status) {
    query = query.eq('payment_status', payment_status as string);
  }

  // Search by user name/email or course title requires text search or complex filter
  // Supabase doesn't support complex join filtering easily in one go with OR across tables.
  // We can try valid modifier if set up, or just simple filters.
  // For now, let's omit complex search or use a simple one if possible.
  // If search is needed, we usually need specific RPC or text search index.
  // We will skip strict search implementation for now or implement partial if feasible.

  const { data: ordersData, count, error } = await query
    .order('purchased_at', { ascending: false })
    .range(pageOffset, pageOffset + pageLimit - 1);

  if (error) {
    console.error('Supabase error fetching orders:', error);
    throw new AppError('Ошибка при получении заказов', 500);
  }

  // Filter by search in memory if needed (inefficient but works for small pages)
  // But purely via API we returned page. 
  // Ideally, use Supabase text search on columns if indexed.

  const orders = (ordersData || []).map((row: any) => ({
    id: row.id,
    purchased_at: row.purchased_at,
    payment_status: row.payment_status,
    amount_paid: row.amount_paid,
    payment_id: row.payment_id,
    enrollment_status: row.status,
    user: row.user ? {
      id: row.user.id,
      name: row.user.name,
      email: row.user.email,
    } : null,
    course: row.course ? {
      id: row.course.id,
      slug: row.course.slug,
      title: row.course.title,
      image_url: row.course.image_upload_path
        ? (row.course.image_upload_path.startsWith('/uploads/')
          ? row.course.image_upload_path
          : `/uploads/${row.course.image_upload_path}`)
        : row.course.image_url,
    } : null,
    tariff: row.tariff ? {
      id: row.tariff.id,
      name: row.tariff.name,
      type: row.tariff.tariff_type,
      price: row.tariff.price,
    } : null,
  }));

  res.json({ orders, total: count || 0 });
});

/**
 * Получить статистику по заказам
 */
export const getOrdersStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Fetch all paid enrollments to calculate stats (memory intensive if many orders, but ok for valid start)
  // Better: separate queries for count/sum.
  // Supabase doesn't do SUM via API directly without RPC.
  // We will fetch minimal data needed to sum.

  const { data: allOrders, error } = await supabase
    .from('enrollments')
    .select('amount_paid, purchased_at')
    .eq('payment_status', 'paid');

  if (error) {
    throw new AppError('Ошибка при получении статистики', 500);
  }

  const orders = allOrders || [];

  const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.amount_paid) || 0), 0);
  const totalOrders = orders.length;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);
  const weekStart = oneWeekAgo.toISOString();

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(now.getDate() - 30);
  const monthStart = oneMonthAgo.toISOString();

  // Today
  const todayOrdersList = orders.filter(o => o.purchased_at >= todayStart);
  const todayRevenue = todayOrdersList.reduce((sum, o) => sum + (parseFloat(o.amount_paid) || 0), 0);
  const todayOrdersCount = todayOrdersList.length;

  // Week
  const weekOrdersList = orders.filter(o => o.purchased_at >= weekStart);
  const weekRevenue = weekOrdersList.reduce((sum, o) => sum + (parseFloat(o.amount_paid) || 0), 0);
  const weekOrdersCount = weekOrdersList.length;

  // Month
  const monthOrdersList = orders.filter(o => o.purchased_at >= monthStart);
  const monthRevenue = monthOrdersList.reduce((sum, o) => sum + (parseFloat(o.amount_paid) || 0), 0);
  const monthOrdersCount = monthOrdersList.length;

  res.json({
    totalRevenue,
    totalOrders,
    today: {
      orders: todayOrdersCount,
      revenue: todayRevenue,
    },
    week: {
      orders: weekOrdersCount,
      revenue: weekRevenue,
    },
    month: {
      orders: monthOrdersCount,
      revenue: monthRevenue,
    },
  });
});

