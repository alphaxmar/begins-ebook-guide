# Error Handling System Guide

## ภาพรวม

ระบบ error handling ใหม่ของ Ebook Haven ได้รับการปรับปรุงให้มีความสมบูรณ์และใช้งานง่ายขึ้น โดยมีการจัดการ error แบบมาตรฐานทั้งใน frontend และ backend

## Frontend Error Handling

### 1. Error Handler Utilities (`src/lib/errorHandler.ts`)

#### ErrorType Enum
```typescript
enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION', 
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}
```

#### หลักฟังก์ชัน

- `handleError(error, fallbackMessage?)` - จัดการ error และแสดง toast notification
- `parseApiError(error)` - แปลง error เป็น AppError object
- `createAppError(message, type, details?)` - สร้าง error object มาตรฐาน
- `withRetry(fn, maxRetries?, delay?)` - เพิ่มความสามารถ retry ให้กับ function
- `validateFormData(data, rules)` - validate form data

### 2. Error Boundary (`src/components/ErrorBoundary.tsx`)

React Error Boundary สำหรับจับ JavaScript errors ที่เกิดขึ้นใน component tree

```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 3. Loading Components (`src/components/ui/loading.tsx`)

- `Loading` - Loading spinner พร้อม text
- `BookCardSkeleton` - Skeleton สำหรับ book cards
- `TableRowSkeleton` - Skeleton สำหรับ table rows
- `CardSkeleton` - Skeleton สำหรับ cards

### 4. Error Display Components (`src/components/ui/error-display.tsx`)

- `ErrorDisplay` - Component แสดง error พร้อม action buttons
- `NetworkError` - Error สำหรับปัญหาเครือข่าย
- `NotFoundError` - Error สำหรับหน้าที่ไม่พบ
- `UnauthorizedError` - Error สำหรับการไม่มีสิทธิ์
- `ServerError` - Error สำหรับปัญหาเซิร์ฟเวอร์

## Backend Error Handling

### 1. Error Handler Middleware (`backend/src/middleware/errorHandler.ts`)

#### AppError Class
```typescript
class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;
}
```

#### หลักฟังก์ชัน

- `handleError(err, c)` - จัดการ error และส่ง response
- `createApiError(error, message?, details?, code?)` - สร้าง API error response
- `asyncHandler(fn)` - Wrapper สำหรับ async functions
- `errors` - Object ที่มี error creators สำเร็จรูป

### 2. Error Types ที่รองรับ

- **Zod Validation Errors** - แปลงเป็น 400 Bad Request
- **JWT Errors** - แปลงเป็น 401 Unauthorized
- **Database Constraint Errors** - แปลงเป็น 409 Conflict หรือ 400 Bad Request
- **Network Errors** - แปลงเป็น 503 Service Unavailable
- **Custom App Errors** - ใช้ status code ที่กำหนด

## การใช้งาน

### Frontend

#### 1. การจัดการ Error ใน API Calls

```typescript
import { handleError } from '@/lib/errorHandler';

try {
  const result = await api.someFunction();
  // handle success
} catch (error) {
  handleError(error, 'ข้อความ fallback');
}
```

#### 2. การ Validate Form Data

```typescript
import { validateFormData } from '@/lib/errorHandler';

const validation = validateFormData(formData, {
  email: { required: true, type: 'email', message: 'กรุณากรอกอีเมลที่ถูกต้อง' },
  password: { required: true, minLength: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
});

if (!validation.isValid) {
  validation.errors.forEach(error => toast.error(error));
  return;
}
```

#### 3. การใช้ Retry Mechanism

```typescript
import { withRetry } from '@/lib/errorHandler';

const fetchDataWithRetry = withRetry(async () => {
  return await api.getData();
}, 3, 1000); // retry 3 ครั้ง, delay 1 วินาที
```

#### 4. การแสดง Loading และ Error States

```typescript
import { Loading } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-display';

if (isLoading) return <Loading text="กำลังโหลดข้อมูล..." />;
if (error) return <ErrorDisplay onRetry={refetch} onGoHome={() => navigate('/')} />;
```

### Backend

#### 1. การสร้าง Custom Errors

```typescript
import { errors } from '../middleware/errorHandler';

// ใน route handler
if (!user) {
  throw errors.notFound('User');
}

if (!hasPermission) {
  throw errors.forbidden('You cannot access this resource');
}
```

#### 2. การใช้ Async Handler

```typescript
import { asyncHandler } from '../middleware/errorHandler';

router.get('/users', asyncHandler(async (c) => {
  // ถ้าเกิด error จะถูกจับโดย error handler อัตโนมัติ
  const users = await getUsersFromDB();
  return c.json(users);
}));
```

## การปรับปรุงที่ทำไปแล้ว

### Frontend
- ✅ สร้าง error handler utilities
- ✅ เพิ่ม ErrorBoundary ใน App.tsx
- ✅ ปรับปรุง API client ให้มี error handling ที่ดีขึ้น
- ✅ ปรับปรุง AuthContext ให้ใช้ error handling ใหม่
- ✅ ปรับปรุง CartContext ให้ใช้ error handling ใหม่
- ✅ ปรับปรุง Login และ Register pages
- ✅ ปรับปรุง Profile page
- ✅ สร้าง Loading และ Error Display components

### Backend
- ✅ สร้าง error handler middleware
- ✅ ปรับปรุง main error handler ใน index.ts
- ✅ รองรับ error types ต่างๆ (Zod, JWT, Database, etc.)

## ประโยชน์ของระบบใหม่

1. **ความสม่ำเสมอ** - Error handling ที่เป็นมาตรฐานทั่วทั้งแอป
2. **User Experience ที่ดีขึ้น** - ข้อความ error ที่เข้าใจง่ายและมีประโยชน์
3. **การ Debug ที่ง่ายขึ้น** - Error logging และ tracking ที่ดีขึ้น
4. **ความยืดหยุ่น** - สามารถปรับแต่ง error handling ได้ตามต้องการ
5. **Retry Mechanism** - ลดปัญหาจาก network issues ชั่วคราว
6. **Loading States** - UX ที่ดีขึ้นขณะรอข้อมูล

## การพัฒนาต่อไป

1. **Error Analytics** - เก็บสถิติ error เพื่อปรับปรุงระบบ
2. **Offline Support** - จัดการกรณีที่ไม่มีอินเทอร์เน็ต
3. **Error Recovery** - กลไกการกู้คืนอัตโนมัติ
4. **Performance Monitoring** - ติดตาม performance และ error rates
5. **User Feedback** - ให้ผู้ใช้รายงาน error ได้