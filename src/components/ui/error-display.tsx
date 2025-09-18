import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'fullscreen';
}

export function ErrorDisplay({
  title = 'เกิดข้อผิดพลาด',
  message = 'ขออภัย เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง',
  onRetry,
  onGoHome,
  onGoBack,
  className,
  variant = 'default'
}: ErrorDisplayProps) {
  const isFullscreen = variant === 'fullscreen';
  const isMinimal = variant === 'minimal';

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      isFullscreen ? 'min-h-screen px-4' : 'py-8 px-4',
      className
    )}>
      {!isMinimal && (
        <div className="mb-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
        </div>
      )}
      
      <h2 className={cn(
        'font-semibold text-gray-900 mb-2',
        isMinimal ? 'text-lg' : 'text-2xl'
      )}>
        {title}
      </h2>
      
      <p className={cn(
        'text-gray-600 mb-6 max-w-md',
        isMinimal ? 'text-sm' : 'text-base'
      )}>
        {message}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button 
            onClick={onRetry}
            className="flex items-center gap-2"
            size={isMinimal ? 'sm' : 'default'}
          >
            <RefreshCw className="w-4 h-4" />
            ลองใหม่
          </Button>
        )}
        
        {onGoBack && (
          <Button 
            onClick={onGoBack}
            variant="outline"
            className="flex items-center gap-2"
            size={isMinimal ? 'sm' : 'default'}
          >
            <ArrowLeft className="w-4 h-4" />
            ย้อนกลับ
          </Button>
        )}
        
        {onGoHome && (
          <Button 
            onClick={onGoHome}
            variant="outline"
            className="flex items-center gap-2"
            size={isMinimal ? 'sm' : 'default'}
          >
            <Home className="w-4 h-4" />
            กลับหน้าหลัก
          </Button>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-white z-50">
        {content}
      </div>
    );
  }

  return content;
}

// Specific error components
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      title="ไม่สามารถเชื่อมต่อได้"
      message="กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ"
      onRetry={onRetry}
      variant="minimal"
    />
  );
}

export function NotFoundError({ onGoHome, onGoBack }: { 
  onGoHome?: () => void;
  onGoBack?: () => void;
}) {
  return (
    <ErrorDisplay
      title="ไม่พบหน้าที่ต้องการ"
      message="หน้าที่คุณกำลังมองหาอาจถูกย้ายหรือลบไปแล้ว"
      onGoHome={onGoHome}
      onGoBack={onGoBack}
    />
  );
}

export function UnauthorizedError({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <ErrorDisplay
      title="ไม่มีสิทธิ์เข้าถึง"
      message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเข้าสู่ระบบ"
      onGoHome={onGoHome}
      variant="minimal"
    />
  );
}

export function ServerError({ onRetry, onGoHome }: { 
  onRetry?: () => void;
  onGoHome?: () => void;
}) {
  return (
    <ErrorDisplay
      title="เซิร์ฟเวอร์ขัดข้อง"
      message="เกิดปัญหาที่เซิร์ฟเวอร์ กรุณาลองใหม่ในภายหลัง"
      onRetry={onRetry}
      onGoHome={onGoHome}
    />
  );
}