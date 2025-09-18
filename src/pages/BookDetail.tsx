import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Download, ShoppingCart, Clock, FileText, Headphones, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const { data: book, isLoading, error } = useQuery({
    queryKey: ['book', id],
    queryFn: () => api.getBook(id!),
    enabled: !!id,
  });

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
      return;
    }
    if (book?.book) {
      await addToCart(book.book.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ชั่วโมง ${mins} นาที`;
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">ไม่พบหนังสือที่ค้นหา</p>
          <Button asChild>
            <Link to="/books">กลับไปหน้าหนังสือ</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Skeleton className="w-full h-96 rounded-lg" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>
    );
  }

  const bookData = book?.book;

  if (!bookData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ไม่พบข้อมูลหนังสือ</p>
          <Button asChild>
            <Link to="/books">กลับไปหน้าหนังสือ</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/books">
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไปหน้าหนังสือ
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Book Cover */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={bookData.coverImageUrl}
                  alt={bookData.title}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/300x400/e5e7eb/6b7280?text=${encodeURIComponent(bookData.title)}`;
                  }}
                />
                {bookData.isFeatured && (
                  <Badge className="absolute top-4 left-4 bg-yellow-500">
                    แนะนำ
                  </Badge>
                )}
                <Badge 
                  variant="secondary" 
                  className="absolute top-4 right-4"
                >
                  {bookData.fileType === 'ebook' ? (
                    <>
                      <FileText className="h-3 w-3 mr-1" />
                      E-book
                    </>
                  ) : (
                    <>
                      <Headphones className="h-3 w-3 mr-1" />
                      Audiobook
                    </>
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Card */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(bookData.price)}
                    </span>
                    {bookData.originalPrice && bookData.originalPrice > bookData.price && (
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(bookData.originalPrice)}
                      </span>
                    )}
                  </div>
                  {bookData.originalPrice && bookData.originalPrice > bookData.price && (
                    <div className="text-sm text-green-600 font-medium">
                      ประหยัด {formatPrice(bookData.originalPrice - bookData.price)}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleAddToCart}
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  เพิ่มลงตะกร้า
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  ซื้อครั้งเดียว เป็นเจ้าของตลอดไป
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Book Details */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Title and Author */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {bookData.title}
              </h1>
              <p className="text-lg text-gray-600 mb-2">โดย {bookData.author}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>หมวดหมู่: {bookData.categoryName}</span>
                <span>รูปแบบ: {bookData.fileFormat.toUpperCase()}</span>
                {bookData.duration && (
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(bookData.duration)}
                  </span>
                )}
              </div>
            </div>

            {/* Rating and Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(bookData.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{bookData.rating.toFixed(1)}</span>
                <span className="text-gray-500">({bookData.reviewsCount} รีวิว)</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Download className="h-4 w-4 mr-1" />
                {bookData.downloadsCount} ดาวน์โหลด
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-3">เกี่ยวกับหนังสือ</h2>
              <div className="prose max-w-none">
                {bookData.description ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {bookData.description}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">ไม่มีคำอธิบาย</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Book Info */}
            <div>
              <h2 className="text-xl font-semibold mb-3">รายละเอียด</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">ประเภทไฟล์</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="font-medium">
                      {bookData.fileType === 'ebook' ? 'E-book' : 'Audiobook'}
                    </p>
                    <p className="text-sm text-gray-500">
                      รูปแบบ: {bookData.fileFormat.toUpperCase()}
                    </p>
                  </CardContent>
                </Card>

                {bookData.duration && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">ระยะเวลา</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="font-medium">
                        {formatDuration(bookData.duration)}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">วันที่เผยแพร่</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="font-medium">
                      {new Date(bookData.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">สถานะ</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant={bookData.status === 'published' ? 'default' : 'secondary'}>
                      {bookData.status === 'published' ? 'เผยแพร่แล้ว' : 'ร่าง'}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}