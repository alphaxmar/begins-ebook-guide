-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    gradient TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT NOT NULL,
    category_id INTEGER,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    cover_image_url TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('ebook', 'audiobook')),
    file_format TEXT NOT NULL,
    file_size INTEGER,
    duration INTEGER, -- for audiobooks in seconds
    seller_id INTEGER NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'suspended')),
    is_featured BOOLEAN DEFAULT FALSE,
    downloads_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Orders table
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    payment_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order items table
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- User library (purchased books)
CREATE TABLE user_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- Shopping cart
CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- Reviews table
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- Insert default categories
INSERT INTO categories (name, name_en, description, icon, gradient) VALUES
('ธุรกิจ', 'Business', 'หนังสือเกี่ยวกับการทำธุรกิจ การลงทุน และการเงิน', 'Briefcase', 'from-blue-500 to-blue-600'),
('เทคโนโลยี', 'Technology', 'หนังสือเกี่ยวกับเทคโนโลยี โปรแกรมมิ่ง และนวัตกรรม', 'Code', 'from-purple-500 to-purple-600'),
('พัฒนาตัวเอง', 'Self Development', 'หนังสือเกี่ยวกับการพัฒนาตัวเอง แรงบันดาลใจ และการเติบโต', 'TrendingUp', 'from-green-500 to-green-600'),
('การศึกษา', 'Education', 'หนังสือเกี่ยวกับการศึกษา วิชาการ และความรู้', 'GraduationCap', 'from-orange-500 to-orange-600'),
('วรรณกรรม', 'Literature', 'นิยาย เรื่องสั้น บทกวี และวรรณกรรม', 'BookOpen', 'from-red-500 to-red-600'),
('ศิลปะ', 'Arts', 'หนังสือเกี่ยวกับศิลปะ ดีไซน์ และความคิดสร้างสรรค์', 'Palette', 'from-pink-500 to-pink-600'),
('สุขภาพ', 'Health', 'หนังสือเกี่ยวกับสุขภาพ การออกกำลังกาย และการดูแลตัวเอง', 'Heart', 'from-teal-500 to-teal-600'),
('ต่างประเทศ', 'International', 'หนังสือแปลจากต่างประเทศ', 'Globe', 'from-indigo-500 to-indigo-600');