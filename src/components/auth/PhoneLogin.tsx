import React, { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PhoneLoginProps {
  onSuccess?: () => void;
}

export function PhoneLogin({ onSuccess }: PhoneLoginProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');

  const { login } = useAuth();

  const sendOtp = async () => {
    if (!phone) {
      toast.error('กรุณาใส่หมายเลขโทรศัพท์');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setStep('otp');
        setDemoOtp(data.otp); // For demo purposes
        toast.success('รหัส OTP ถูกส่งแล้ว');
      } else {
        toast.error(data.error || 'ไม่สามารถส่ง OTP ได้');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      toast.error('กรุณาใส่รหัส OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone, 
          otp, 
          firstName: firstName || 'User',
          lastName: lastName || ''
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        await login(data.token);
        toast.success('เข้าสู่ระบบสำเร็จ');
        onSuccess?.();
      } else {
        toast.error(data.error || 'รหัส OTP ไม่ถูกต้อง');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    setFirstName('');
    setLastName('');
    setOtpSent(false);
    setDemoOtp('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Phone className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle>เข้าสู่ระบบด้วยเบอร์โทร</CardTitle>
        <CardDescription>
          {step === 'phone' 
            ? 'ใส่หมายเลขโทรศัพท์เพื่อรับรหัส OTP'
            : 'ใส่รหัส OTP ที่ส่งไปยังโทรศัพท์ของคุณ'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">หมายเลขโทรศัพท์</Label>
              <PhoneInput
                country={'th'}
                value={phone}
                onChange={setPhone}
                inputProps={{
                  name: 'phone',
                  required: true,
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                }}
                containerClass="w-full"
                inputClass="w-full"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">ชื่อ (ไม่บังคับ)</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ชื่อ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">นามสกุล (ไม่บังคับ)</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="นามสกุล"
                />
              </div>
            </div>

            <Button 
              onClick={sendOtp} 
              disabled={loading || !phone}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่ง OTP...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  ส่งรหัส OTP
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="otp">รหัส OTP</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="ใส่รหัส OTP 6 หลัก"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>

            {demoOtp && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Demo OTP:</strong> {demoOtp}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  (ในการใช้งานจริง OTP จะถูกส่งผ่าน SMS)
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="flex-1"
              >
                กลับ
              </Button>
              <Button 
                onClick={verifyOtp} 
                disabled={loading || !otp}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ตรวจสอบ...
                  </>
                ) : (
                  'ยืนยัน OTP'
                )}
              </Button>
            </div>

            <div className="text-center">
              <Button 
                variant="link" 
                onClick={sendOtp}
                disabled={loading}
                className="text-sm"
              >
                ส่งรหัส OTP ใหม่
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}