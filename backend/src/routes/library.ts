import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { paginationSchema } from '../utils/validation';
import { Env } from '../index';

const library = new Hono<{ Bindings: Env }>();

// Get user's library (purchased books)
library.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const pagination = paginationSchema.parse(query);
    
    const offset = (pagination.page - 1) * pagination.limit;

    // Get purchased books
    const result = await c.env.DB.prepare(`
      SELECT 
        ul.purchased_at,
        b.id,
        b.title,
        b.description,
        b.author,
        b.cover_image_url,
        b.file_type,
        b.file_format,
        b.file_size,
        b.duration,
        b.rating,
        b.reviews_count,
        c.name as category_name,
        c.name_en as category_name_en
      FROM user_library ul
      JOIN books b ON ul.book_id = b.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE ul.user_id = ?
      ORDER BY ul.purchased_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.userId, pagination.limit, offset).all();

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM user_library WHERE user_id = ?
    `).bind(user.userId).first();

    const total = countResult?.total as number || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    const libraryBooks = result.results.map(book => ({
      purchasedAt: book.purchased_at,
      book: {
        id: book.id,
        title: book.title,
        description: book.description,
        author: book.author,
        coverImageUrl: book.cover_image_url,
        fileType: book.file_type,
        fileFormat: book.file_format,
        fileSize: book.file_size,
        duration: book.duration,
        rating: book.rating,
        reviewsCount: book.reviews_count,
        category: {
          name: book.category_name,
          nameEn: book.category_name_en
        }
      }
    }));

    return c.json({
      books: libraryBooks,
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
    
    console.error('Get library error:', error);
    return c.json({ error: 'Failed to fetch library' }, 500);
  }
});

// Get download link for owned book
library.get('/download/:bookId', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const bookId = parseInt(c.req.param('bookId'));

    if (isNaN(bookId)) {
      return c.json({ error: 'Invalid book ID' }, 400);
    }

    // Verify ownership
    const ownership = await c.env.DB.prepare(`
      SELECT ul.id, b.file_url, b.title, b.file_format
      FROM user_library ul
      JOIN books b ON ul.book_id = b.id
      WHERE ul.user_id = ? AND ul.book_id = ?
    `).bind(user.userId, bookId).first();

    if (!ownership) {
      return c.json({ error: 'Book not found in your library' }, 404);
    }

    // In a real implementation, you would generate a signed URL from R2
    // For now, we'll return the file URL directly
    return c.json({
      downloadUrl: ownership.file_url,
      title: ownership.title,
      format: ownership.file_format,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
    });

  } catch (error) {
    console.error('Get download link error:', error);
    return c.json({ error: 'Failed to generate download link' }, 500);
  }
});

// Get reading progress (placeholder for future implementation)
library.get('/progress/:bookId', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const bookId = parseInt(c.req.param('bookId'));

    if (isNaN(bookId)) {
      return c.json({ error: 'Invalid book ID' }, 400);
    }

    // Verify ownership
    const ownership = await c.env.DB.prepare(`
      SELECT id FROM user_library WHERE user_id = ? AND book_id = ?
    `).bind(user.userId, bookId).first();

    if (!ownership) {
      return c.json({ error: 'Book not found in your library' }, 404);
    }

    // For now, return placeholder data
    // In the future, this would track actual reading progress
    return c.json({
      bookId,
      progress: 0,
      lastReadAt: null,
      currentPage: 0,
      totalPages: 100
    });

  } catch (error) {
    console.error('Get reading progress error:', error);
    return c.json({ error: 'Failed to fetch reading progress' }, 500);
  }
});

export default library;