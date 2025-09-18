import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Star, Download, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api, Book, Category } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Books() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  // Fetch books
  const { data: booksData, isLoading, error } = useQuery({
    queryKey: ['books', currentPage, searchQuery, selectedCategory],
    queryFn: () => api.getBooks({
      page: currentPage,
      limit: 12,
      search: searchQuery || undefined,
      category: selectedCategory || undefined,
    }),
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (currentPage > 1) params.set('page', currentPage.toString());
    setSearchParams(params);
  }, [searchQuery, selectedCategory, currentPage, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleAddToCart = async (bookId: number) => {
    if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
      return;
    }
    await addToCart(bookId);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            ลองใหม่
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">หนังสือทั้งหมด</h1>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="ค้นหาหนังสือ..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="หมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">ทุกหมวดหมู่</SelectItem>
              {categoriesData?.categories?.map((category: Category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Info */}
        {booksData && (
          <div className="text-sm text-gray-600">
            แสดง {booksData.books?.length || 0} จาก {booksData.pagination?.total || 0} รายการ
            {searchQuery && ` สำหรับ "${searchQuery}"`}
          </div>
        )}
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-48 w-full" />
              </CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : booksData?.books?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">ไม่พบหนังสือที่ค้นหา</p>
          <Button 
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setCurrentPage(1);
            }}
            variant="outline"
            className="mt-4"
          >
            ล้างตัวกรอง
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {booksData?.books?.map((book: Book) => (
            <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="relative">
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="h-48 w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/300x400/e5e7eb/6b7280?text=${encodeURIComponent(book.title)}`;
                    }}
                  />
                  {book.isFeatured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500">
                      แนะนำ
                    </Badge>
                  )}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2"
                  >
                    {book.fileType === 'ebook' ? 'E-book' : 'Audiobook'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <Link 
                  to={`/books/${book.id}`}
                  className="block hover:text-blue-600 transition-colors"
                >
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {book.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 mb-2">โดย {book.author}</p>
                <p className="text-xs text-gray-500 mb-3">{book.categoryName}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{book.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({book.reviewsCount})</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Download className="h-3 w-3 mr-1" />
                    {book.downloadsCount}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(book.price)}
                    </span>
                    {book.originalPrice && book.originalPrice > book.price && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        {formatPrice(book.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button 
                  onClick={() => handleAddToCart(book.id)}
                  className="w-full"
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  เพิ่มลงตะกร้า
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {booksData?.pagination && booksData.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!booksData.pagination.hasPrev}
          >
            ก่อนหน้า
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, booksData.pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!booksData.pagination.hasNext}
          >
            ถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}