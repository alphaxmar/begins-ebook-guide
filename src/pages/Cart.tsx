import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Cart() {
  const { items, totalAmount, removeFromCart, clearCart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <p className="text-gray-600 mb-6">
            คุณต้องเข้าสู่ระบบเพื่อดูตะกร้าสินค้า
          </p>
          <div className="space-x-4">
            <Button asChild>
              <Link to="/login">เข้าสู่ระบบ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/register">สมัครสมาชิก</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">ตะกร้าสินค้า</h1>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ตะกร้าสินค้าว่างเปล่า
          </h1>
          <p className="text-gray-600 mb-6">
            คุณยังไม่มีสินค้าในตะกร้า เริ่มเลือกซื้อหนังสือกันเลย!
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/books">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับไปเลือกซื้อ
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">ตะกร้าสินค้า</h1>
          <p className="text-gray-600 mt-2">
            คุณมีสินค้า {items.length} รายการในตะกร้า
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Book Cover */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.book.coverImageUrl}
                        alt={item.book.title}
                        className="w-20 h-28 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/80x112/e5e7eb/6b7280?text=${encodeURIComponent(item.book.title)}`;
                        }}
                      />
                    </div>

                    {/* Book Details */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/books/${item.book.id}`}
                        className="block hover:text-blue-600 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                          {item.book.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 mb-2">
                        โดย {item.book.author}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {item.book.categoryName} • {item.book.fileType === 'ebook' ? 'E-book' : 'Audiobook'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(item.book.price)}
                          </span>
                          {item.book.originalPrice && item.book.originalPrice > item.book.price && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                              {formatPrice(item.book.originalPrice)}
                            </span>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.book.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          ลบ
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Clear Cart */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                ล้างตะกร้าทั้งหมด
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>สรุปคำสั่งซื้อ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="space-y-3">
                  <Button asChild className="w-full" size="lg">
                    <Link to="/checkout">
                      ดำเนินการชำระเงิน
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/books">
                      เลือกซื้อเพิ่มเติม
                    </Link>
                  </Button>
                </div>

                <div className="text-xs text-gray-500 text-center">
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