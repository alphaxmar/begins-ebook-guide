-- Add phone and social login fields to users table
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE users ADD COLUMN facebook_id TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'email' CHECK (provider IN ('email', 'google', 'facebook', 'phone'));

-- Create OTP verification table
CREATE TABLE otp_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create social accounts table for linking multiple providers
CREATE TABLE social_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook')),
    provider_id TEXT NOT NULL,
    provider_email TEXT,
    provider_data TEXT, -- JSON data from provider
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(provider, provider_id)
);

-- Add indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_facebook_id ON users(facebook_id);
CREATE INDEX idx_otp_phone ON otp_verifications(phone);
CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_provider ON social_accounts(provider, provider_id);