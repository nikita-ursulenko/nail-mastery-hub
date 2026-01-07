import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const pool = new Pool(getDatabaseConfig());

/**
 * Получить все покупки/заказы
 */
export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, status, payment_status, limit, offset } = req.query;
  
  const pageLimit = limit ? parseInt(limit as string) : 50;
  const pageOffset = offset ? parseInt(offset as string) : 0;
  
  let query = `
    SELECT 
      e.id as enrollment_id,
      e.purchased_at,
      e.payment_status,
      e.amount_paid,
      e.payment_id,
      e.status as enrollment_status,
      u.id as user_id,
      u.name as user_name,
      u.email as user_email,
      c.id as course_id,
      c.slug as course_slug,
      c.title as course_title,
      c.image_url as course_image_url,
      c.image_upload_path as course_image_upload_path,
      ct.id as tariff_id,
      ct.name as tariff_name,
      ct.tariff_type,
      ct.price as tariff_price
    FROM enrollments e
    JOIN users u ON e.user_id = u.id
    JOIN courses c ON e.course_id = c.id
    JOIN course_tariffs ct ON e.tariff_id = ct.id
    WHERE e.payment_status = 'paid'
  `;
  
  const params: any[] = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (LOWER(u.name) LIKE $${paramIndex} OR LOWER(u.email) LIKE $${paramIndex} OR LOWER(c.title) LIKE $${paramIndex})`;
    params.push(`%${(search as string).toLowerCase()}%`);
    paramIndex++;
  }

  if (status) {
    query += ` AND e.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (payment_status) {
    query += ` AND e.payment_status = $${paramIndex}`;
    params.push(payment_status);
    paramIndex++;
  }

  // Получаем общее количество
  const countQuery = query.replace(
    /SELECT[\s\S]*?FROM/,
    'SELECT COUNT(*) as total FROM'
  );
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Добавляем ORDER BY, LIMIT и OFFSET
  query += ` ORDER BY e.purchased_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pageLimit, pageOffset);

  const result = await pool.query(query, params);

  const orders = result.rows.map((row: any) => ({
    id: row.enrollment_id,
    purchased_at: row.purchased_at,
    payment_status: row.payment_status,
    amount_paid: row.amount_paid,
    payment_id: row.payment_id,
    enrollment_status: row.enrollment_status,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
    },
    course: {
      id: row.course_id,
      slug: row.course_slug,
      title: row.course_title,
      image_url: row.course_image_upload_path
        ? (row.course_image_upload_path.startsWith('/uploads/')
            ? row.course_image_upload_path
            : `/uploads/${row.course_image_upload_path}`)
        : row.course_image_url,
    },
    tariff: {
      id: row.tariff_id,
      name: row.tariff_name,
      type: row.tariff_type,
      price: row.tariff_price,
    },
  }));

  res.json({ orders, total });
});

/**
 * Получить статистику по заказам
 */
export const getOrdersStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Общая сумма всех покупок
  const totalRevenueResult = await pool.query(
    `SELECT COALESCE(SUM(amount_paid), 0) as total_revenue
     FROM enrollments
     WHERE payment_status = 'paid'`
  );
  const totalRevenue = parseFloat(totalRevenueResult.rows[0].total_revenue || '0');

  // Количество успешных покупок
  const totalOrdersResult = await pool.query(
    `SELECT COUNT(*) as total
     FROM enrollments
     WHERE payment_status = 'paid'`
  );
  const totalOrders = parseInt(totalOrdersResult.rows[0].total || '0');

  // Покупки за сегодня
  const todayOrdersResult = await pool.query(
    `SELECT COUNT(*) as total, COALESCE(SUM(amount_paid), 0) as revenue
     FROM enrollments
     WHERE payment_status = 'paid' 
     AND DATE(purchased_at) = CURRENT_DATE`
  );
  const todayOrders = parseInt(todayOrdersResult.rows[0].total || '0');
  const todayRevenue = parseFloat(todayOrdersResult.rows[0].revenue || '0');

  // Покупки за последние 7 дней
  const weekOrdersResult = await pool.query(
    `SELECT COUNT(*) as total, COALESCE(SUM(amount_paid), 0) as revenue
     FROM enrollments
     WHERE payment_status = 'paid' 
     AND purchased_at >= CURRENT_DATE - INTERVAL '7 days'`
  );
  const weekOrders = parseInt(weekOrdersResult.rows[0].total || '0');
  const weekRevenue = parseFloat(weekOrdersResult.rows[0].revenue || '0');

  // Покупки за последние 30 дней
  const monthOrdersResult = await pool.query(
    `SELECT COUNT(*) as total, COALESCE(SUM(amount_paid), 0) as revenue
     FROM enrollments
     WHERE payment_status = 'paid' 
     AND purchased_at >= CURRENT_DATE - INTERVAL '30 days'`
  );
  const monthOrders = parseInt(monthOrdersResult.rows[0].total || '0');
  const monthRevenue = parseFloat(monthOrdersResult.rows[0].revenue || '0');

  res.json({
    totalRevenue,
    totalOrders,
    today: {
      orders: todayOrders,
      revenue: todayRevenue,
    },
    week: {
      orders: weekOrders,
      revenue: weekRevenue,
    },
    month: {
      orders: monthOrders,
      revenue: monthRevenue,
    },
  });
});

