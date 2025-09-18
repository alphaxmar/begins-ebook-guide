import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, BookOpen, Search, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string;
  fileType: 'ebook' | 'audiobook';
  categoryName: string;
  purchaseDate: string;
  downloadUrl?: string;
}

export default function Library() {
  const { isAuthenticated } = useAuth();
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<LibraryBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLibraryBooks = async (page = 1) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.getLibraryBooks(page, 12);
      if (response.success && response.data) {
        setBooks(response.data.books);
        setFilteredBooks(response.data.books);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
      }
    } catch (error) {
      console.error('Error fetching library books:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดห้องสมุด');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryBooks();
  }, [isAuthenticated]);

  useEffect(() => {
    let filtered = books;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(book => book.fileType === filterType);
    }

    setFilteredBooks(filtered);
  }, [books, searchQuery, filterType]);

  const handleDownload = async (bookId: string, title: string) => {
    try {
      const response = await apiClient.getDownloadLink(bookId);
      if (response.success && response.data?.downloadUrl) {
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `${title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('เริ่มดาวน์โหลดแล้ว');
      } else {
        toast.error('ไม่สามารถดาวน์โหลดได้ในขณะนี้');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('เกิดข้อผิดพลาดในการดาวน์โหลด');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <p className="text-gray-600 mb-6">
            คุณต้องเข้าสู่ระบบเพื่อดูห้องสมุดส่วนตัว
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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">ห้องสมุดของฉัน</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-3 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ห้องสมุดของฉัน</h1>
          <p className="text-gray-600">
            หนังสือที่คุณซื้อแล้ว {books.length} เล่ม
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาหนังสือ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            {/* Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="ebook">E-book</SelectItem>
                <SelectItem value="audiobook">Audiobook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Books Grid/List */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || filterType !== 'all' ? 'ไม่พบหนังสือที่ค้นหา' : 'ยังไม่มีหนังสือในห้องสมุด'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterType !== 'all' 
                ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่' 
                : 'เริ่มเลือกซื้อหนังสือเพื่อสร้างห้องสมุดของคุณ'
              }
            </p>
            {!searchQuery && filterType === 'all' && (
              <Button asChild>
                <Link to="/books">เลือกซื้อหนังสือ</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredBooks.map((book) => (
                  <Card key={book.id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] mb-4 relative overflow-hidden rounded-lg">
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://via.placeholder.com/300x400/e5e7eb/6b7280?text=${encodeURIComponent(book.title)}`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                          <Button
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDownload(book.id, book.title)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            ดาวน์โหลด
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm line-clamp-2 text-gray-900">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600">
                          โดย {book.author}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant={book.fileType === 'ebook' ? 'default' : 'secondary'}>
                            {book.fileType === 'ebook' ? 'E-book' : 'Audiobook'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          ซื้อเมื่อ {formatDate(book.purchaseDate)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBooks.map((book) => (
                  <Card key={book.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://via.placeholder.com/64x80/e5e7eb/6b7280?text=${encodeURIComponent(book.title)}`;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {book.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            โดย {book.author}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <Badge variant={book.fileType === 'ebook' ? 'default' : 'secondary'}>
                              {book.fileType === 'ebook' ? 'E-book' : 'Audiobook'}
                            </Badge>
                            <span>{book.categoryName}</span>
                            <span>ซื้อเมื่อ {formatDate(book.purchaseDate)}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDownload(book.id, book.title)}
                          className="flex-shrink-0"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          ดาวน์โหลด
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                <Button
                  variant="outline"
                  onClick={() => fetchLibraryBooks(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ก่อนหน้า
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    onClick={() => fetchLibraryBooks(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => fetchLibraryBooks(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ถัดไป
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}