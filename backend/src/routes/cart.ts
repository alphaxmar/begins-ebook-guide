import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { addToCartSchema } from '../utils/validation';
import { Env } from '../index';

const cart = new Hono<{ Bindings: Env }>();

// Get user's cart
cart.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    const result = await c.env.DB.prepare(`
      SELECT 
        ci.id as cart_item_id,
        ci.created_at as added_at,
        b.id,
        b.title,
        b.author,
        b.price,
        b.original_price,
        b.cover_image_url,
        b.file_type,
        c.name as category_name
      FROM cart_items ci
      JOIN books b ON ci.book_id = b.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE ci.user_id = ? AND b.status = 'published'
      ORDER BY ci.created_at DESC
    `).bind(user.userId).all();

    const cartItems = result.results.map(item => ({
      cartItemId: item.cart_item_id,
      addedAt: item.added_at,
      book: {
        id: item.id,
        title: item.title,
        author: item.author,
        price: item.price,
        originalPrice: item.original_price,
        coverImageUrl: item.cover_image_url,
        fileType: item.file_type,
        categoryName: item.category_name
      }
    }));

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.book.price as number), 0);

    return c.json({
      items: cartItems,
      totalAmount,
      itemCount: cartItems.length
    });

  } catch (error) {
    console.error('Get cart error:', error);
    return c.json({ error: 'Failed to fetch cart' }, 500);
  }
});

// Add item to cart
cart.post('/add', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validatedData = addToCartSchema.parse(body);

    // Check if book exists and is published
    const book = await c.env.DB.prepare(`
      SELECT id, title, price FROM books 
      WHERE id = ? AND status = 'published'
    `).bind(validatedData.bookId).first();

    if (!book) {
      return c.json({ error: 'Book not found or not available' }, 404);
    }

    // Check if user already owns this book
    const ownership = await c.env.DB.prepare(`
      SELECT id FROM user_library WHERE user_id = ? AND book_id = ?
    `).bind(user.userId, validatedData.bookId).first();

    if (ownership) {
      return c.json({ error: 'You already own this book' }, 400);
    }

    // Check if item is already in cart
    const existingItem = await c.env.DB.prepare(`
      SELECT id FROM cart_items WHERE user_id = ? AND book_id = ?
    `).bind(user.userId, validatedData.bookId).first();

    if (existingItem) {
      return c.json({ error: 'Book is already in your cart' }, 400);
    }

    // Add to cart
    const result = await c.env.DB.prepare(`
      INSERT INTO cart_items (user_id, book_id)
      VALUES (?, ?)
    `).bind(user.userId, validatedData.bookId).run();

    if (!result.success) {
      throw new Error('Failed to add item to cart');
    }

    return c.json({
      message: 'Book added to cart successfully',
      cartItemId: result.meta.last_row_id
    }, 201);

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400);
    }
    
    console.error('Add to cart error:', error);
    return c.json({ error: 'Failed to add item to cart' }, 500);
  }
});

// Remove item from cart
cart.delete('/:cartItemId', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const cartItemId = parseInt(c.req.param('cartItemId'));

    if (isNaN(cartItemId)) {
      return c.json({ error: 'Invalid cart item ID' }, 400);
    }

    // Verify ownership and delete
    const result = await c.env.DB.prepare(`
      DELETE FROM cart_items 
      WHERE id = ? AND user_id = ?
    `).bind(cartItemId, user.userId).run();

    if (result.changes === 0) {
      return c.json({ error: 'Cart item not found' }, 404);
    }

    return c.json({ message: 'Item removed from cart successfully' });

  } catch (error) {
    console.error('Remove from cart error:', error);
    return c.json({ error: 'Failed to remove item from cart' }, 500);
  }
});

// Clear cart
cart.delete('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    await c.env.DB.prepare(`
      DELETE FROM cart_items WHERE user_id = ?
    `).bind(user.userId).run();

    return c.json({ message: 'Cart cleared successfully' });

  } catch (error) {
    console.error('Clear cart error:', error);
    return c.json({ error: 'Failed to clear cart' }, 500);
  }
});

export default cart;