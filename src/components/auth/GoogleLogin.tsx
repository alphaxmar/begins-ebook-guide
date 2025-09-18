import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GoogleLoginProps {
  onSuccess?: () => void;
}

export function GoogleLoginButton({ onSuccess }: GoogleLoginProps) {
  const { login } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // Decode JWT token to get user profile
      const token = credentialResponse.credential;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const profile = JSON.parse(jsonPayload);

      // Send to backend
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
          profile: profile
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        await login(data.token);
        toast.success('เข้าสู่ระบบด้วย Google สำเร็จ');
        onSuccess?.();
      } else {
        toast.error(data.error || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  const handleGoogleError = () => {
    toast.error('การเข้าสู่ระบบด้วย Google ล้มเหลว');
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        theme="outline"
        size="large"
        width="100%"
        text="signin_with"
        locale="th"
      />
    </div>
  );
}

// Alternative custom button style
export function CustomGoogleLoginButton({ onSuccess }: GoogleLoginProps) {
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      // This would typically use Google's JavaScript SDK
      // For now, we'll show a placeholder
      toast.info('Google Login จะเปิดในหน้าต่างใหม่');
      
      // In a real implementation, you would:
      // 1. Open Google OAuth popup
      // 2. Handle the callback
      // 3. Send the token to your backend
      
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      เข้าสู่ระบบด้วย Google
    </Button>
  );
}