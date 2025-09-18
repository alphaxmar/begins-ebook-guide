import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  MoreHorizontal,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardStats {
  totalBooks: number;
  publishedBooks: number;
  totalSales: number;
  totalRevenue: number;
}

interface SellerBook {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImageUrl: string;
  status: 'draft' | 'published';
  categoryName: string;
  fileType: 'ebook' | 'audiobook';
  createdAt: string;
  salesCount: number;
}

export default function SellerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    publishedBooks: 0,
    totalSales: 0,
    totalRevenue: 0
  });
  const [books, setBooks] = useState<SellerBook[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<SellerBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDashboardData = async () => {
    if (!isAuthenticated || user?.role !== 'seller') return;

    setIsLoading(true);
    try {
      // Fetch dashboard stats
      const statsResponse = await apiClient.getSellerStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Fetch seller books
      const booksResponse = await apiClient.getSellerBooks(currentPage, 10);
      if (booksResponse.success && booksResponse.data) {
        setBooks(booksResponse.data.books);
        setFilteredBooks(booksResponse.data.books);
        setTotalPages(booksResponse.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAuthenticated, user, currentPage]);

  useEffect(() => {
    let filtered = books;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(book => book.status === statusFilter);
    }

    setFilteredBooks(filtered);
  }, [books, searchQuery, statusFilter]);

  const handlePublishToggle = async (bookId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const response = await apiClient.updateBookStatus(bookId, newStatus);
      
      if (response.success) {
        setBooks(prev => prev.map(book => 
          book.id === bookId ? { ...book, status: newStatus as 'draft' | 'published' } : book
        ));
        toast.success(newStatus === 'published' ? 'เผยแพร่หนังสือแล้ว' : 'ยกเลิกการเผยแพร่แล้ว');
      } else {
        toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      }
    } catch (error) {
      console.error('Error updating book status:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบหนังสือ "${title}"?`)) {
      return;
    }

    try {
      const response = await apiClient.deleteBook(bookId);
      
      if (response.success) {
        setBooks(prev => prev.filter(book => book.id !== bookId));
        toast.success('ลบหนังสือสำเร็จ');
        fetchDashboardData(); // Refresh stats
      } else {
        toast.error('เกิดข้อผิดพลาดในการลบหนังสือ');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('เกิดข้อผิดพลาดในการลบหนังสือ');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated || user?.role !== 'seller') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="text-gray-600 mb-6">
            คุณต้องเป็นผู้ขายเพื่อเข้าถึงแดชบอร์ดนี้
          </p>
          <Button asChild>
            <Link to="/">กลับหน้าหลัก</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">แดชบอร์ดผู้ขาย</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">แดชบอร์ดผู้ขาย</h1>
            <p className="text-gray-600">จัดการหนังสือและติดตามยอดขาย</p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link to="/seller/books/new">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มหนังสือใหม่
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">หนังสือทั้งหมด</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground">
                เผยแพร่แล้ว {stats.publishedBooks} เล่ม
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ยอดขายรวม</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                หนังสือที่ขายได้
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                รายได้ทั้งหมด
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ลูกค้า</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                ผู้ซื้อทั้งหมด
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Books Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>จัดการหนังสือ</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
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

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="published">เผยแพร่แล้ว</SelectItem>
                    <SelectItem value="draft">ร่าง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'ไม่พบหนังสือที่ค้นหา' : 'ยังไม่มีหนังสือ'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่' 
                    : 'เริ่มต้นสร้างหนังสือเล่มแรกของคุณ'
                  }
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button asChild>
                    <Link to="/seller/books/new">
                      <Plus className="h-4 w-4 mr-2" />
                      เพิ่มหนังสือใหม่
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBooks.map((book) => (
                  <div key={book.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                    {/* Book Cover */}
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/64x80/e5e7eb/6b7280?text=${encodeURIComponent(book.title)}`;
                      }}
                    />

                    {/* Book Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        โดย {book.author}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
                          {book.status === 'published' ? 'เผยแพร่แล้ว' : 'ร่าง'}
                        </Badge>
                        <span>{book.categoryName}</span>
                        <span>{book.fileType === 'ebook' ? 'E-book' : 'Audiobook'}</span>
                        <span>ขายได้ {book.salesCount} เล่ม</span>
                      </div>
                    </div>

                    {/* Price and Date */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-blue-600 mb-1">
                        {formatPrice(book.price)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(book.createdAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/seller/books/${book.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            แก้ไข
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePublishToggle(book.id, book.status)}
                        >
                          {book.status === 'published' ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              ยกเลิกการเผยแพร่
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              เผยแพร่
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteBook(book.id, book.title)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          ลบ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8 space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      ก่อนหน้า
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      ถัดไป
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}