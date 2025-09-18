import { Hono } from 'hono';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { registerSchema, loginSchema } from '../utils/validation';
import { authMiddleware } from '../middleware/auth';
import { Env } from '../index';

const auth = new Hono<{ Bindings: Env }>();

// Register
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(validatedData.email).first();

    if (existingUser) {
      return c.json({ error: 'User already exists with this email' }, 400);
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const result = await c.env.DB.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      validatedData.email,
      passwordHash,
      validatedData.firstName,
      validatedData.lastName,
      validatedData.role
    ).run();

    if (!result.success) {
      throw new Error('Failed to create user');
    }

    // Generate JWT token
    const token = generateToken({
      userId: result.meta.last_row_id as number,
      email: validatedData.email,
      role: validatedData.role
    }, c.env.JWT_SECRET);

    return c.json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.meta.last_row_id,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role
      }
    }, 201);

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400);
    }
    
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await c.env.DB.prepare(`
      SELECT id, email, password_hash, first_name, last_name, role, is_verified
      FROM users WHERE email = ?
    `).bind(validatedData.email).first();

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      validatedData.password, 
      user.password_hash as string
    );

    if (!isValidPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id as number,
      email: user.email as string,
      role: user.role as string
    }, c.env.JWT_SECRET);

    return c.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified
      }
    });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400);
    }
    
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Get current user profile
auth.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    const userProfile = await c.env.DB.prepare(`
      SELECT id, email, first_name, last_name, role, is_verified, created_at
      FROM users WHERE id = ?
    `).bind(user.userId).first();

    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user: {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        role: userProfile.role,
        isVerified: userProfile.is_verified,
        createdAt: userProfile.created_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Failed to get user profile' }, 500);
  }
});

// Update user profile
auth.put('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const updateData: any = {};
    if (body.firstName) updateData.first_name = body.firstName;
    if (body.lastName) updateData.last_name = body.lastName;
    
    if (Object.keys(updateData).length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updateData.updated_at = new Date().toISOString();

    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);

    await c.env.DB.prepare(`
      UPDATE users SET ${setClause} WHERE id = ?
    `).bind(...values, user.userId).run();

    return c.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

export default auth;