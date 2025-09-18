import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BookOpen, Eye, EyeOff, Mail, Phone, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneLogin } from '@/components/auth/PhoneLogin';
import { CustomGoogleLoginButton } from '@/components/auth/GoogleLogin';
import { DemoFacebookLoginButton } from '@/components/auth/FacebookLogin';
import { handleError, parseApiError, ErrorType } from '@/lib/errorHandler';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate(from);
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Parse error to provide better user experience
      const appError = parseApiError(err);
      
      // For login form, show error in the form instead of toast
      if (appError.type === ErrorType.AUTHENTICATION) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (appError.type === ErrorType.NETWORK) {
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } else {
        setError(appError.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLoginSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">เข้าสู่ระบบ</CardTitle>
          <CardDescription>
            เลือกวิธีการเข้าสู่ระบบที่คุณต้องการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                อีเมล
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                เบอร์โทร
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Social
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="รหัสผ่านของคุณ"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังเข้าสู่ระบบ...
                    </>
                  ) : (
                    'เข้าสู่ระบบ'
                  )}
                </Button>
              </form>

              <Separator className="my-4" />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-center text-gray-700">
                  บัญชีทดสอบ (Demo Accounts)
                </h3>
                <div className="grid gap-2 text-xs">
                  <div className="p-2 bg-gray-50 rounded border">
                    <strong>Admin:</strong> admin@ebook.com / admin123
                  </div>
                  <div className="p-2 bg-gray-50 rounded border">
                    <strong>User:</strong> user@ebook.com / user123
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="phone" className="mt-6">
              <PhoneLogin onSuccess={handleSocialLoginSuccess} />
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-6">
              <div className="space-y-3">
                <CustomGoogleLoginButton onSuccess={handleSocialLoginSuccess} />
                <DemoFacebookLoginButton onSuccess={handleSocialLoginSuccess} />
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-center text-sm text-gray-600">
                <p>การเข้าสู่ระบบด้วย Social Media จะสร้างบัญชีใหม่โดยอัตโนมัติ</p>
                <p>หากยังไม่เคยมีบัญชีในระบบ</p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ยังไม่มีบัญชี?{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                สมัครสมาชิก
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}