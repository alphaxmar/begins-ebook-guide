import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Edit, Save, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleError, validateFormData } from '@/lib/errorHandler';

export default function Profile() {
  const { user, updateProfile, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validate form data
    const validation = validateFormData(formData, {
      name: { required: true, message: 'กรุณากรอกชื่อ' },
      email: { required: true, type: 'email', message: 'กรุณากรอกอีเมลที่ถูกต้อง' }
    });

    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setIsLoading(true);
    try {
      const success = await updateProfile(formData);
      if (success) {
        setIsEditing(false);
        toast.success('อัปเดตข้อมูลสำเร็จ');
      } else {
        toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      handleError(error, 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'seller':
        return 'default';
      case 'user':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'seller':
        return 'ผู้ขาย';
      case 'user':
        return 'ผู้ซื้อ';
      default:
        return role;
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <p className="text-gray-600 mb-6">
            คุณต้องเข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์
          </p>
          <Button asChild>
            <a href="/login">เข้าสู่ระบบ</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">โปรไฟล์ของฉัน</h1>
          <p className="text-gray-600">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  ข้อมูลส่วนตัว
                </CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      ยกเลิก
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          บันทึก
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name */}
                <div>
                  <Label htmlFor="name">ชื่อ</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="กรอกชื่อของคุณ"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {user.name || 'ไม่ได้ระบุ'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">อีเมล</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="กรอกอีเมลของคุณ"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      {user.email}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="กรอกเบอร์โทรศัพท์ (ไม่บังคับ)"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      {user.phone || 'ไม่ได้ระบุ'}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Role */}
                <div>
                  <Label>บทบาท</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center">
                    <Shield className="h-4 w-4 text-gray-400 mr-2" />
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                </div>

                {/* Created Date */}
                <div>
                  <Label>วันที่สมัครสมาชิก</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    {formatDate(user.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Summary */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>สถานะบัญชี</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">สถานะ</span>
                    <Badge variant="default">ใช้งานได้</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ประเภทบัญชี</span>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">สมาชิกตั้งแต่</span>
                    <span className="text-sm font-medium">
                      {new Date(user.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>การดำเนินการด่วน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  เปลี่ยนรหัสผ่าน
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  การแจ้งเตือน
                </Button>
                {user.role === 'seller' && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/seller">
                      <User className="h-4 w-4 mr-2" />
                      แดชบอร์ดผู้ขาย
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>ต้องการความช่วยเหลือ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  หากคุณมีคำถามหรือต้องการความช่วยเหลือ สามารถติดต่อทีมสนับสนุนได้
                </p>
                <Button variant="outline" className="w-full">
                  ติดต่อฝ่ายสนับสนุน
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}