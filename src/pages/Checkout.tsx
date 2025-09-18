import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export default function Checkout() {
  const { items, totalAmount, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    email: '',
    phone: '',
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      handleInputChange('cardNumber', formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      handleInputChange('expiryDate', formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      handleInputChange('cvv', value);
    }
  };

  const validateForm = () => {
    if (paymentMethod === 'credit_card') {
      const { cardNumber, expiryDate, cvv, cardName } = formData;
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        toast.error('กรุณากรอกหมายเลขบัตรให้ครบ 16 หลัก');
        return false;
      }
      if (!expiryDate || expiryDate.length < 5) {
        toast.error('กรุณากรอกวันหมดอายุบัตร');
        return false;
      }
      if (!cvv || cvv.length < 3) {
        toast.error('กรุณากรอกรหัส CVV');
        return false;
      }
      if (!cardName.trim()) {
        toast.error('กรุณากรอกชื่อผู้ถือบัตร');
        return false;
      }
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      const orderData = {
        items: items.map(item => ({
          bookId: item.book.id,
          price: item.book.price
        })),
        paymentMethod,
        paymentDetails: paymentMethod === 'credit_card' ? {
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          cardName: formData.cardName
        } : {}
      };

      const response = await apiClient.createOrder(orderData);
      
      if (response.success) {
        clearCart();
        toast.success('ชำระเงินสำเร็จ! หนังสือได้ถูกเพิ่มเข้าห้องสมุดของคุณแล้ว');
        navigate('/library');
      } else {
        toast.error(response.error || 'เกิดข้อผิดพลาดในการชำระเงิน');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <p className="text-gray-600 mb-6">
            คุณต้องเข้าสู่ระบบเพื่อดำเนินการชำระเงิน
          </p>
          <Button asChild>
            <Link to="/login">เข้าสู่ระบบ</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ไม่มีสินค้าในตะกร้า
          </h1>
          <p className="text-gray-600 mb-6">
            กรุณาเลือกสินค้าก่อนดำเนินการชำระเงิน
          </p>
          <Button asChild>
            <Link to="/books">เลือกซื้อหนังสือ</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/cart">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับไปยังตะกร้า
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">ชำระเงิน</h1>
          <p className="text-gray-600 mt-2">
            กรอกข้อมูลการชำระเงินเพื่อซื้อหนังสือ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="space-y-6">
            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  วิธีการชำระเงิน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card">บัตรเครดิต/เดบิต</Label>
                  </div>
                  <div className="flex items-center space-x-2 opacity-50">
                    <RadioGroupItem value="promptpay" id="promptpay" disabled />
                    <Label htmlFor="promptpay">PromptPay (เร็วๆ นี้)</Label>
                  </div>
                  <div className="flex items-center space-x-2 opacity-50">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" disabled />
                    <Label htmlFor="bank_transfer">โอนเงินผ่านธนาคาร (เร็วๆ นี้)</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Credit Card Form */}
            {paymentMethod === 'credit_card' && (
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลบัตรเครดิต/เดบิต</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">หมายเลขบัตร</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">วันหมดอายุ</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={handleExpiryChange}
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={handleCvvChange}
                        maxLength={4}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="cardName">ชื่อผู้ถือบัตร</Label>
                    <Input
                      id="cardName"
                      placeholder="ชื่อตามที่ปรากฏบนบัตร"
                      value={formData.cardName}
                      onChange={(e) => handleInputChange('cardName', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Notice */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800">การชำระเงินปลอดภัย</h3>
                    <p className="text-sm text-green-700 mt-1">
                      ข้อมูลการชำระเงินของคุณได้รับการเข้ารหัสและปกป้องด้วยมาตรฐาน SSL
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>สรุปคำสั่งซื้อ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={item.book.coverImageUrl}
                        alt={item.book.title}
                        className="w-12 h-16 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/48x64/e5e7eb/6b7280?text=${encodeURIComponent(item.book.title)}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.book.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {item.book.author}
                        </p>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatPrice(item.book.price)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>จำนวนสินค้า</span>
                    <span>{items.length} รายการ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>ราคารวม</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <span className="text-blue-600">{formatPrice(totalAmount)}</span>
                </div>

                {/* Checkout Button */}
                <Button 
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      ชำระเงิน {formatPrice(totalAmount)}
                    </>
                  )}
                </Button>

                <div className="text-xs text-gray-500 text-center space-y-1">
                  <p>• ซื้อครั้งเดียว เป็นเจ้าของตลอดไป</p>
                  <p>• ดาวน์โหลดได้ทันทีหลังชำระเงิน</p>
                  <p>• รองรับการอ่านบนอุปกรณ์ทุกประเภท</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}