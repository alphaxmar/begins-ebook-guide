import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import { createBookSchema, updateBookSchema, paginationSchema } from '../utils/validation';
import { Env } from '../index';

const seller = new Hono<{ Bindings: Env }>();

// Apply seller role requirement to all routes
seller.use('*', authMiddleware);
seller.use('*', requireRole(['seller', 'admin']));

// Get seller dashboard stats
seller.get('/dashboard', async (c) => {
  try {
    const user = c.get('user');

    // Get book count
    const bookCountResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM books WHERE seller_id = ?
    `).bind(user.userId).first();

    // Get total sales
    const salesResult = await c.env.DB.prepare(`
      SELECT 
        COUNT(oi.id) as total_sales,
        COALESCE(SUM(oi.price), 0) as total_revenue
      FROM order_items oi
      JOIN books b ON oi.book_id = b.id
      JOIN orders o ON oi.order_id = o.id
      WHERE b.seller_id = ? AND o.status = 'completed'
    `).bind(user.userId).first();

    // Get recent orders
    const recentOrdersResult = await c.env.DB.prepare(`
      SELECT 
        o.id as order_id,
        o.created_at,
        oi.price,
        b.title as book_title,
        u.first_name,
        u.last_name
      FROM order_items oi
      JOIN books b ON oi.book_id = b.id
      JOIN orders o ON oi.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE b.seller_id = ? AND o.status = 'completed'
      ORDER BY o.created_at DESC
      LIMIT 10
    `).bind(user.userId).all();

    const recentOrders = recentOrdersResult.results.map(order => ({
      orderId: order.order_id,
      createdAt: order.created_at,
      price: order.price,
      bookTitle: order.book_title,
      buyerName: `${order.first_name} ${order.last_name}`
    }));

    return c.json({
      stats: {
        totalBooks: bookCountResult?.total || 0,
        totalSales: salesResult?.total_sales || 0,
        totalRevenue: salesResult?.total_revenue || 0
      },
      recentOrders
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    return c.json({ error: 'Failed to fetch dashboard data' }, 500);
  }
});

// Get seller's books
seller.get('/books', async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const pagination = paginationSchema.parse(query);
    
    const offset = (pagination.page - 1) * pagination.limit;

    const result = await c.env.DB.prepare(`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.price,
        b.status,
        b.is_featured,
        b.downloads_count,
        b.rating,
        b.reviews_count,
        b.created_at,
        c.name as category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.seller_id = ?
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.userId, pagination.limit, offset).all();

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM books WHERE seller_id = ?
    `).bind(user.userId).first();

    const total = countResult?.total as number || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    const books = result.results.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      status: book.status,
      isFeatured: book.is_featured,
      downloadsCount: book.downloads_count,
      rating: book.rating,
      reviewsCount: book.reviews_count,
      createdAt: book.created_at,
      categoryName: book.category_name
    }));

    return c.json({
      books,
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
    
    console.error('Get seller books error:', error);
    return c.json({ error: 'Failed to fetch books' }, 500);
  }
});

// Create new book
seller.post('/books', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validatedData = createBookSchema.parse(body);

    // For now, we'll use placeholder URLs for file storage
    // In a real implementation, you would handle file upload to R2
    const fileUrl = `https://storage.begins-guide.com/books/${Date.now()}.${validatedData.fileFormat}`;
    const coverImageUrl = `https://storage.begins-guide.com/covers/${Date.now()}.jpg`;

    const result = await c.env.DB.prepare(`
      INSERT INTO books (
        title, description, author, category_id, price, original_price,
        cover_image_url, file_url, file_type, file_format, duration, seller_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      validatedData.title,
      validatedData.description || null,
      validatedData.author,
      validatedData.categoryId,
      validatedData.price,
      validatedData.originalPrice || null,
      coverImageUrl,
      fileUrl,
      validatedData.fileType,
      validatedData.fileFormat,
      validatedData.duration || null,
      user.userId
    ).run();

    if (!result.success) {
      throw new Error('Failed to create book');
    }

    return c.json({
      message: 'Book created successfully',
      bookId: result.meta.last_row_id
    }, 201);

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400);
    }
    
    console.error('Create book error:', error);
    return c.json({ error: 'Failed to create book' }, 500);
  }
});

// Update book
seller.put('/books/:id', async (c) => {
  try {
    const user = c.get('user');
    const bookId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const validatedData = updateBookSchema.parse(body);

    if (isNaN(bookId)) {
      return c.json({ error: 'Invalid book ID' }, 400);
    }

    // Verify ownership
    const book = await c.env.DB.prepare(`
      SELECT id FROM books WHERE id = ? AND seller_id = ?
    `).bind(bookId, user.userId).first();

    if (!book) {
      return c.json({ error: 'Book not found or access denied' }, 404);
    }

    // Build update query
    const updateFields: string[] = [];
    const values: any[] = [];

    if (validatedData.title !== undefined) {
      updateFields.push('title = ?');
      values.push(validatedData.title);
    }
    if (validatedData.description !== undefined) {
      updateFields.push('description = ?');
      values.push(validatedData.description);
    }
    if (validatedData.author !== undefined) {
      updateFields.push('author = ?');
      values.push(validatedData.author);
    }
    if (validatedData.categoryId !== undefined) {
      updateFields.push('category_id = ?');
      values.push(validatedData.categoryId);
    }
    if (validatedData.price !== undefined) {
      updateFields.push('price = ?');
      values.push(validatedData.price);
    }
    if (validatedData.originalPrice !== undefined) {
      updateFields.push('original_price = ?');
      values.push(validatedData.originalPrice);
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updateFields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(bookId);

    await c.env.DB.prepare(`
      UPDATE books SET ${updateFields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({ message: 'Book updated successfully' });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400);
    }
    
    console.error('Update book error:', error);
    return c.json({ error: 'Failed to update book' }, 500);
  }
});

// Publish/unpublish book
seller.patch('/books/:id/status', async (c) => {
  try {
    const user = c.get('user');
    const bookId = parseInt(c.req.param('id'));
    const body = await c.req.json();

    if (isNaN(bookId)) {
      return c.json({ error: 'Invalid book ID' }, 400);
    }

    const { status } = body;
    if (!['draft', 'published'].includes(status)) {
      return c.json({ error: 'Invalid status. Must be "draft" or "published"' }, 400);
    }

    // Verify ownership
    const book = await c.env.DB.prepare(`
      SELECT id FROM books WHERE id = ? AND seller_id = ?
    `).bind(bookId, user.userId).first();

    if (!book) {
      return c.json({ error: 'Book not found or access denied' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE books SET status = ?, updated_at = ? WHERE id = ?
    `).bind(status, new Date().toISOString(), bookId).run();

    return c.json({ 
      message: `Book ${status === 'published' ? 'published' : 'unpublished'} successfully` 
    });

  } catch (error) {
    console.error('Update book status error:', error);
    return c.json({ error: 'Failed to update book status' }, 500);
  }
});

// Delete book
seller.delete('/books/:id', async (c) => {
  try {
    const user = c.get('user');
    const bookId = parseInt(c.req.param('id'));

    if (isNaN(bookId)) {
      return c.json({ error: 'Invalid book ID' }, 400);
    }

    // Verify ownership and check if book has been sold
    const book = await c.env.DB.prepare(`
      SELECT 
        b.id,
        COUNT(oi.id) as sales_count
      FROM books b
      LEFT JOIN order_items oi ON b.id = oi.book_id
      WHERE b.id = ? AND b.seller_id = ?
      GROUP BY b.id
    `).bind(bookId, user.userId).first();

    if (!book) {
      return c.json({ error: 'Book not found or access denied' }, 404);
    }

    if ((book.sales_count as number) > 0) {
      return c.json({ 
        error: 'Cannot delete book that has been sold. You can unpublish it instead.' 
      }, 400);
    }

    // Delete the book
    await c.env.DB.prepare(`
      DELETE FROM books WHERE id = ?
    `).bind(bookId).run();

    return c.json({ message: 'Book deleted successfully' });

  } catch (error) {
    console.error('Delete book error:', error);
    return c.json({ error: 'Failed to delete book' }, 500);
  }
});

export default seller;