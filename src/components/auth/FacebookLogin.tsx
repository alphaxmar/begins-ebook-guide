import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FacebookLoginProps {
  onSuccess?: () => void;
}

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function FacebookLoginButton({ onSuccess }: FacebookLoginProps) {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const initializeFacebookSDK = () => {
    return new Promise<void>((resolve) => {
      // Load Facebook SDK
      if (window.FB) {
        resolve();
        return;
      }

      window.fbAsyncInit = function() {
        window.FB.init({
          appId: '1234567890', // Replace with your Facebook App ID
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        resolve();
      };

      // Load the SDK asynchronously
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://connect.facebook.net/th_TH/sdk.js';
      document.head.appendChild(script);
    });
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    
    try {
      await initializeFacebookSDK();

      window.FB.login((response: any) => {
        if (response.authResponse) {
          // Get user profile
          window.FB.api('/me', { fields: 'id,name,email,first_name,last_name,picture' }, async (profile: any) => {
            try {
              // Send to backend
              const backendResponse = await fetch('/api/auth/facebook', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  accessToken: response.authResponse.accessToken,
                  profile: profile
                }),
              });

              const data = await backendResponse.json();

              if (backendResponse.ok) {
                localStorage.setItem('token', data.token);
                await login(data.token);
                toast.success('เข้าสู่ระบบด้วย Facebook สำเร็จ');
                onSuccess?.();
              } else {
                toast.error(data.error || 'ไม่สามารถเข้าสู่ระบบด้วย Facebook ได้');
              }
            } catch (error) {
              console.error('Facebook login error:', error);
              toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            } finally {
              setLoading(false);
            }
          });
        } else {
          toast.error('การเข้าสู่ระบบด้วย Facebook ถูกยกเลิก');
          setLoading(false);
        }
      }, { scope: 'email,public_profile' });

    } catch (error) {
      console.error('Facebook SDK error:', error);
      toast.error('ไม่สามารถโหลด Facebook SDK ได้');
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleFacebookLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 border-blue-300 hover:bg-blue-50 text-blue-600"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          กำลังเข้าสู่ระบบ...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          เข้าสู่ระบบด้วย Facebook
        </>
      )}
    </Button>
  );
}

// Demo version for development (without real Facebook integration)
export function DemoFacebookLoginButton({ onSuccess }: FacebookLoginProps) {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleDemoFacebookLogin = async () => {
    setLoading(true);
    
    try {
      // Simulate Facebook login with demo data
      const demoProfile = {
        id: 'demo_facebook_user',
        email: 'demo@facebook.com',
        first_name: 'Demo',
        last_name: 'User',
        name: 'Demo User',
        picture: {
          data: {
            url: 'https://via.placeholder.com/100x100?text=FB'
          }
        }
      };

      const response = await fetch('/api/auth/facebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: 'demo_access_token',
          profile: demoProfile
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        await login(data.token);
        toast.success('เข้าสู่ระบบด้วย Facebook สำเร็จ (Demo)');
        onSuccess?.();
      } else {
        toast.error(data.error || 'ไม่สามารถเข้าสู่ระบบด้วย Facebook ได้');
      }
    } catch (error) {
      console.error('Demo Facebook login error:', error);
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDemoFacebookLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 border-blue-300 hover:bg-blue-50 text-blue-600"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          กำลังเข้าสู่ระบบ...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          เข้าสู่ระบบด้วย Facebook (Demo)
        </>
      )}
    </Button>
  );
}