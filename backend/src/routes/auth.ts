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

// Send OTP for phone verification
auth.post('/send-otp', async (c) => {
  try {
    const { phone } = await c.req.json();
    
    if (!phone) {
      return c.json({ error: 'Phone number is required' }, 400);
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to database
    await c.env.DB.prepare(`
      INSERT INTO otp_verifications (phone, otp_code, expires_at)
      VALUES (?, ?, ?)
    `).bind(phone, otpCode, expiresAt.toISOString()).run();

    // In production, send SMS here
    console.log(`OTP for ${phone}: ${otpCode}`);

    return c.json({ 
      message: 'OTP sent successfully',
      // For demo purposes, return OTP (remove in production)
      otp: otpCode 
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return c.json({ error: 'Failed to send OTP' }, 500);
  }
});

// Verify OTP and login/register
auth.post('/verify-otp', async (c) => {
  try {
    const { phone, otp, firstName, lastName } = await c.req.json();

    if (!phone || !otp) {
      return c.json({ error: 'Phone and OTP are required' }, 400);
    }

    // Verify OTP
    const otpRecord = await c.env.DB.prepare(`
      SELECT * FROM otp_verifications 
      WHERE phone = ? AND otp_code = ? AND expires_at > datetime('now') AND verified = FALSE
      ORDER BY created_at DESC LIMIT 1
    `).bind(phone, otp).first();

    if (!otpRecord) {
      return c.json({ error: 'Invalid or expired OTP' }, 400);
    }

    // Mark OTP as verified
    await c.env.DB.prepare(`
      UPDATE otp_verifications SET verified = TRUE WHERE id = ?
    `).bind(otpRecord.id).run();

    // Check if user exists
    let user = await c.env.DB.prepare(`
      SELECT * FROM users WHERE phone = ?
    `).bind(phone).first();

    if (!user) {
      // Create new user
      const result = await c.env.DB.prepare(`
        INSERT INTO users (phone, first_name, last_name, provider, phone_verified, email)
        VALUES (?, ?, ?, 'phone', TRUE, ?)
      `).bind(phone, firstName || 'User', lastName || '', `${phone}@phone.local`).run();

      user = {
        id: result.meta.last_row_id,
        phone,
        first_name: firstName || 'User',
        last_name: lastName || '',
        role: 'user',
        provider: 'phone'
      };
    } else {
      // Update phone verification status
      await c.env.DB.prepare(`
        UPDATE users SET phone_verified = TRUE WHERE id = ?
      `).bind(user.id).run();
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id as number,
      email: user.email as string,
      role: user.role as string
    }, c.env.JWT_SECRET);

    return c.json({
      message: 'Phone verified successfully',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        provider: user.provider
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return c.json({ error: 'Failed to verify OTP' }, 500);
  }
});

// Google OAuth login
auth.post('/google', async (c) => {
  try {
    const { token, profile } = await c.req.json();

    if (!token || !profile) {
      return c.json({ error: 'Google token and profile are required' }, 400);
    }

    // Check if user exists by Google ID
    let user = await c.env.DB.prepare(`
      SELECT * FROM users WHERE google_id = ?
    `).bind(profile.sub).first();

    if (!user) {
      // Check if user exists by email
      user = await c.env.DB.prepare(`
        SELECT * FROM users WHERE email = ?
      `).bind(profile.email).first();

      if (user) {
        // Link Google account to existing user
        await c.env.DB.prepare(`
          UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?
        `).bind(profile.sub, profile.picture, user.id).run();
      } else {
        // Create new user
        const result = await c.env.DB.prepare(`
          INSERT INTO users (email, google_id, first_name, last_name, provider, is_verified, avatar_url)
          VALUES (?, ?, ?, ?, 'google', TRUE, ?)
        `).bind(
          profile.email,
          profile.sub,
          profile.given_name || profile.name,
          profile.family_name || '',
          profile.picture
        ).run();

        user = {
          id: result.meta.last_row_id,
          email: profile.email,
          google_id: profile.sub,
          first_name: profile.given_name || profile.name,
          last_name: profile.family_name || '',
          role: 'user',
          provider: 'google',
          avatar_url: profile.picture
        };
      }
    }

    // Generate JWT token
    const jwtToken = generateToken({
      userId: user.id as number,
      email: user.email as string,
      role: user.role as string
    }, c.env.JWT_SECRET);

    return c.json({
      message: 'Google login successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        provider: user.provider,
        avatarUrl: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    return c.json({ error: 'Google login failed' }, 500);
  }
});

// Facebook OAuth login
auth.post('/facebook', async (c) => {
  try {
    const { accessToken, profile } = await c.req.json();

    if (!accessToken || !profile) {
      return c.json({ error: 'Facebook access token and profile are required' }, 400);
    }

    // Check if user exists by Facebook ID
    let user = await c.env.DB.prepare(`
      SELECT * FROM users WHERE facebook_id = ?
    `).bind(profile.id).first();

    if (!user) {
      // Check if user exists by email
      user = await c.env.DB.prepare(`
        SELECT * FROM users WHERE email = ?
      `).bind(profile.email).first();

      if (user) {
        // Link Facebook account to existing user
        await c.env.DB.prepare(`
          UPDATE users SET facebook_id = ?, avatar_url = ? WHERE id = ?
        `).bind(profile.id, profile.picture?.data?.url, user.id).run();
      } else {
        // Create new user
        const result = await c.env.DB.prepare(`
          INSERT INTO users (email, facebook_id, first_name, last_name, provider, is_verified, avatar_url)
          VALUES (?, ?, ?, ?, 'facebook', TRUE, ?)
        `).bind(
          profile.email,
          profile.id,
          profile.first_name || profile.name,
          profile.last_name || '',
          profile.picture?.data?.url
        ).run();

        user = {
          id: result.meta.last_row_id,
          email: profile.email,
          facebook_id: profile.id,
          first_name: profile.first_name || profile.name,
          last_name: profile.last_name || '',
          role: 'user',
          provider: 'facebook',
          avatar_url: profile.picture?.data?.url
        };
      }
    }

    // Generate JWT token
    const jwtToken = generateToken({
      userId: user.id as number,
      email: user.email as string,
      role: user.role as string
    }, c.env.JWT_SECRET);

    return c.json({
      message: 'Facebook login successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        provider: user.provider,
        avatarUrl: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Facebook login error:', error);
    return c.json({ error: 'Facebook login failed' }, 500);
  }
});

export default auth;