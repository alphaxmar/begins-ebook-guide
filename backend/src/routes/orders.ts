import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { createOrderSchema, paginationSchema } from '../utils/validation';
import { Env } from '../index';

const orders = new Hono<{ Bindings: Env }>();

// Get user's orders
orders.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const pagination = paginationSchema.parse(query);
    
    const offset = (pagination.page - 1) * pagination.limit;

    // Get orders with items
    const result = await c.env.DB.prepare(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.payment_method,
        o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id, o.total_amount, o.status, o.payment_method, o.created_at
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.userId, pagination.limit, offset).all();

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM orders WHERE user_id = ?
    `).bind(user.userId).first();

    const total = countResult?.total as number || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    const ordersData = result.results.map(order => ({
      id: order.id,
      totalAmount: order.total_amount,
      status: order.status,
      paymentMethod: order.payment_method,
      itemCount: order.item_count,
      createdAt: order.created_at
    }));

    return c.json({
      orders: ordersData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ 
        error: 'Invalid query parameters', 
        details: error.errors 
      }, 400);
    }
    
    console.error('Get orders error:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Get order details
orders.get('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const orderId = parseInt(c.req.param('id'));

    if (isNaN(orderId)) {
      return c.json({ error: 'Invalid order ID' }, 400);
    }

    // Get order
    const order = await c.env.DB.prepare(`
      SELECT 
        id, total_amount, status, payment_method, payment_id, created_at
      FROM orders 
      WHERE id = ? AND user_id = ?
    `).bind(orderId, user.userId).first();

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Get order items
    const itemsResult = await c.env.DB.prepare(`
      SELECT 
        oi.price,
        b.id as book_id,
        b.title,
        b.author,
        b.cover_image_url,
        b.file_type,
        c.name as category_name
      FROM order_items oi
      JOIN books b ON oi.book_id = b.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE oi.order_id = ?
    `).bind(orderId).all();

    const items = itemsResult.results.map(item => ({
      price: item.price,
      book: {
        id: item.book_id,
        title: item.title,
        author: item.author,
        coverImageUrl: item.cover_image_url,
        fileType: item.file_type,
        categoryName: item.category_name
      }
    }));

    return c.json({
      order: {
        id: order.id,
        totalAmount: order.total_amount,
        status: order.status,
        paymentMethod: order.payment_method,
        paymentId: order.payment_id,
        createdAt: order.created_at,
        items
      }
    });

  } catch (error) {
    console.error('Get order error:', error);
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

// Create order (checkout)
orders.post('/checkout', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validatedData = createOrderSchema.parse(body);

    // Get cart items
    const cartItems = await c.env.DB.prepare(`
      SELECT 
        ci.book_id,
        b.price,
        b.title
      FROM cart_items ci
      JOIN books b ON ci.book_id = b.id
      WHERE ci.user_id = ? AND b.status = 'published'
    `).bind(user.userId).all();

    if (cartItems.results.length === 0) {
      return c.json({ error: 'Cart is empty' }, 400);
    }

    // Calculate total
    const totalAmount = cartItems.results.reduce(
      (sum, item) => sum + (item.price as number), 
      0
    );

    // Create order
    const orderResult = await c.env.DB.prepare(`
      INSERT INTO orders (user_id, total_amount, payment_method, status)
      VALUES (?, ?, ?, 'pending')
    `).bind(user.userId, totalAmount, validatedData.paymentMethod).run();

    if (!orderResult.success) {
      throw new Error('Failed to create order');
    }

    const orderId = orderResult.meta.last_row_id as number;

    // Create order items
    for (const item of cartItems.results) {
      await c.env.DB.prepare(`
        INSERT INTO order_items (order_id, book_id, price)
        VALUES (?, ?, ?)
      `).bind(orderId, item.book_id, item.price).run();
    }

    // In a real implementation, you would integrate with Stripe here
    // For now, we'll simulate a successful payment
    
    // Update order status to completed
    await c.env.DB.prepare(`
      UPDATE orders SET status = 'completed', payment_id = ? WHERE id = ?
    `).bind(`sim_${Date.now()}`, orderId).run();

    // Add books to user library
    for (const item of cartItems.results) {
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO user_library (user_id, book_id)
        VALUES (?, ?)
      `).bind(user.userId, item.book_id).run();

      // Update download count
      await c.env.DB.prepare(`
        UPDATE books SET downloads_count = downloads_count + 1 WHERE id = ?
      `).bind(item.book_id).run();
    }

    // Clear cart
    await c.env.DB.prepare(`
      DELETE FROM cart_items WHERE user_id = ?
    `).bind(user.userId).run();

    return c.json({
      message: 'Order completed successfully',
      orderId,
      totalAmount,
      status: 'completed'
    }, 201);

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400);
    }
    
    console.error('Checkout error:', error);
    return c.json({ error: 'Checkout failed' }, 500);
  }
});

export default orders;