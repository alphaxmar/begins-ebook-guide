import { Hono } from 'hono';
import { Env } from '../index';

const categories = new Hono<{ Bindings: Env }>();

// Get all categories
categories.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        c.id,
        c.name,
        c.name_en,
        c.description,
        c.icon,
        c.gradient,
        COUNT(b.id) as book_count
      FROM categories c
      LEFT JOIN books b ON c.id = b.category_id AND b.status = 'published'
      GROUP BY c.id, c.name, c.name_en, c.description, c.icon, c.gradient
      ORDER BY c.name
    `).all();

    const categoriesData = result.results.map(cat => ({
      id: cat.id,
      name: cat.name,
      nameEn: cat.name_en,
      description: cat.description,
      icon: cat.icon,
      gradient: cat.gradient,
      bookCount: cat.book_count || 0
    }));

    return c.json({
      categories: categoriesData
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// Get category by ID
categories.get('/:id', async (c) => {
  try {
    const categoryId = parseInt(c.req.param('id'));
    
    if (isNaN(categoryId)) {
      return c.json({ error: 'Invalid category ID' }, 400);
    }

    const category = await c.env.DB.prepare(`
      SELECT 
        c.id,
        c.name,
        c.name_en,
        c.description,
        c.icon,
        c.gradient,
        COUNT(b.id) as book_count
      FROM categories c
      LEFT JOIN books b ON c.id = b.category_id AND b.status = 'published'
      WHERE c.id = ?
      GROUP BY c.id, c.name, c.name_en, c.description, c.icon, c.gradient
    `).bind(categoryId).first();

    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    return c.json({
      category: {
        id: category.id,
        name: category.name,
        nameEn: category.name_en,
        description: category.description,
        icon: category.icon,
        gradient: category.gradient,
        bookCount: category.book_count || 0
      }
    });

  } catch (error) {
    console.error('Get category error:', error);
    return c.json({ error: 'Failed to fetch category' }, 500);
  }
});

export default categories;