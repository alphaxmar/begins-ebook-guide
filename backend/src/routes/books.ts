import { Hono } from 'hono';
import { paginationSchema, searchSchema } from '../utils/validation';
import { optionalAuth } from '../middleware/auth';
import { Env } from '../index';

const books = new Hono<{ Bindings: Env }>();

// Get all books with search and pagination
books.get('/', optionalAuth, async (c) => {
  try {
    const query = c.req.query();
    const pagination = paginationSchema.parse(query);
    const search = searchSchema.parse(query);
    
    const offset = (pagination.page - 1) * pagination.limit;
    
    // Build WHERE clause
    let whereClause = "WHERE b.status = 'published'";
    const bindings: any[] = [];
    
    if (search.q) {
      whereClause += " AND (b.title LIKE ? OR b.author LIKE ? OR b.description LIKE ?)";
      const searchTerm = `%${search.q}%`;
      bindings.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (search.category) {
      whereClause += " AND c.name_en = ?";
      bindings.push(search.category);
    }
    
    if (search.minPrice !== undefined) {
      whereClause += " AND b.price >= ?";
      bindings.push(search.minPrice);
    }
    
    if (search.maxPrice !== undefined) {
      whereClause += " AND b.price <= ?";
      bindings.push(search.maxPrice);
    }

    // Build ORDER BY clause
    const orderBy = `ORDER BY b.${search.sortBy} ${search.sortOrder}`;

    // Get books
    const booksQuery = `
      SELECT 
        b.id,
        b.title,
        b.description,
        b.author,
        b.price,
        b.original_price,
        b.cover_image_url,
        b.file_type,
        b.file_format,
        b.duration,
        b.is_featured,
        b.downloads_count,
        b.rating,
        b.reviews_count,
        b.created_at,
        c.name as category_name,
        c.name_en as category_name_en,
        u.first_name as seller_first_name,
        u.last_name as seller_last_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN users u ON b.seller_id = u.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const result = await c.env.DB.prepare(booksQuery)
      .bind(...bindings, pagination.limit, offset)
      .all();

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      ${whereClause}
    `;

    const countResult = await c.env.DB.prepare(countQuery)
      .bind(...bindings)
      .first();

    const total = countResult?.total as number || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    const booksData = result.results.map(book => ({
      id: book.id,
      title: book.title,
      description: book.description,
      author: book.author,
      price: book.price,
      originalPrice: book.original_price,
      coverImageUrl: book.cover_image_url,
      fileType: book.file_type,
      fileFormat: book.file_format,
      duration: book.duration,
      isFeatured: book.is_featured,
      downloadsCount: book.downloads_count,
      rating: book.rating,
      reviewsCount: book.reviews_count,
      createdAt: book.created_at,
      category: {
        name: book.category_name,
        nameEn: book.category_name_en
      },
      seller: {
        firstName: book.seller_first_name,
        lastName: book.seller_last_name
      }
    }));

    return c.json({
      books: booksData,
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
    
    console.error('Get books error:', error);
    return c.json({ error: 'Failed to fetch books' }, 500);
  }
});

// Get featured books
books.get('/featured', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        b.id,
        b.title,
        b.description,
        b.author,
        b.price,
        b.original_price,
        b.cover_image_url,
        b.file_type,
        b.downloads_count,
        b.rating,
        b.reviews_count,
        c.name as category_name,
        c.name_en as category_name_en
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.status = 'published' AND b.is_featured = true
      ORDER BY b.created_at DESC
      LIMIT 8
    `).all();

    const featuredBooks = result.results.map(book => ({
      id: book.id,
      title: book.title,
      description: book.description,
      author: book.author,
      price: book.price,
      originalPrice: book.original_price,
      coverImageUrl: book.cover_image_url,
      fileType: book.file_type,
      downloadsCount: book.downloads_count,
      rating: book.rating,
      reviewsCount: book.reviews_count,
      category: {
        name: book.category_name,
        nameEn: book.category_name_en
      }
    }));

    return c.json({
      books: featuredBooks
    });

  } catch (error) {
    console.error('Get featured books error:', error);
    return c.json({ error: 'Failed to fetch featured books' }, 500);
  }
});

// Get book by ID
books.get('/:id', optionalAuth, async (c) => {
  try {
    const bookId = parseInt(c.req.param('id'));
    
    if (isNaN(bookId)) {
      return c.json({ error: 'Invalid book ID' }, 400);
    }

    const book = await c.env.DB.prepare(`
      SELECT 
        b.id,
        b.title,
        b.description,
        b.author,
        b.price,
        b.original_price,
        b.cover_image_url,
        b.file_type,
        b.file_format,
        b.file_size,
        b.duration,
        b.is_featured,
        b.downloads_count,
        b.rating,
        b.reviews_count,
        b.created_at,
        c.name as category_name,
        c.name_en as category_name_en,
        u.first_name as seller_first_name,
        u.last_name as seller_last_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN users u ON b.seller_id = u.id
      WHERE b.id = ? AND b.status = 'published'
    `).bind(bookId).first();

    if (!book) {
      return c.json({ error: 'Book not found' }, 404);
    }

    // Check if user owns this book
    let isOwned = false;
    const user = c.get('user');
    if (user) {
      const ownership = await c.env.DB.prepare(`
        SELECT id FROM user_library WHERE user_id = ? AND book_id = ?
      `).bind(user.userId, bookId).first();
      
      isOwned = !!ownership;
    }

    return c.json({
      book: {
        id: book.id,
        title: book.title,
        description: book.description,
        author: book.author,
        price: book.price,
        originalPrice: book.original_price,
        coverImageUrl: book.cover_image_url,
        fileType: book.file_type,
        fileFormat: book.file_format,
        fileSize: book.file_size,
        duration: book.duration,
        isFeatured: book.is_featured,
        downloadsCount: book.downloads_count,
        rating: book.rating,
        reviewsCount: book.reviews_count,
        createdAt: book.created_at,
        isOwned,
        category: {
          name: book.category_name,
          nameEn: book.category_name_en
        },
        seller: {
          firstName: book.seller_first_name,
          lastName: book.seller_last_name
        }
      }
    });

  } catch (error) {
    console.error('Get book error:', error);
    return c.json({ error: 'Failed to fetch book' }, 500);
  }
});

export default books;