import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Download, Eye } from 'lucide-react';
import featuredBooks from '@/assets/featured-books.jpg';

const books = [
  {
    id: 1,
    title: 'การเงินส่วนบุคคล',
    author: 'สมชาย ใจดี',
    category: 'ธุรกิจ',
    price: 299,
    originalPrice: 399,
    rating: 4.8,
    downloads: '2.3K',
    image: featuredBooks,
    isPopular: true
  },
  {
    id: 2,
    title: 'เทคโนโลยี AI',
    author: 'วิทยา เทคโน',
    category: 'เทคโนโลยี',
    price: 459,
    rating: 4.9,
    downloads: '1.8K',
    image: featuredBooks,
    isNew: true
  },
  {
    id: 3,
    title: 'จิตวิทยาความสำเร็จ',
    author: 'มานะ สร้างสุข',
    category: 'พัฒนาตัวเอง',
    price: 199,
    rating: 4.7,
    downloads: '3.1K',
    image: featuredBooks,
  },
  {
    id: 4,
    title: 'การตลาดดิจิทัล',
    author: 'สุชาติ การตลาด',
    category: 'ธุรกิจ',
    price: 349,
    rating: 4.6,
    downloads: '1.5K',
    image: featuredBooks,
  }
];

const FeaturedBooks = () => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-kanit font-bold text-foreground mb-4">
            หนังสือแนะนำ
          </h2>
          <p className="text-lg font-noto text-muted-foreground max-w-2xl mx-auto">
            คัดสรรหนังสือคุณภาพสูงจากผู้เขียนมืออาชีพ อัปเดตใหม่ทุกสัปดาห์
          </p>
        </div>

        {/* Books Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {books.map((book) => (
            <Card key={book.id} className="group hover:shadow-card-custom transition-all duration-300 hover:-translate-y-1 border-border/50">
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {book.isPopular && (
                      <Badge className="bg-primary text-primary-foreground font-noto text-xs">
                        ยอดนิยม
                      </Badge>
                    )}
                    {book.isNew && (
                      <Badge variant="secondary" className="bg-primary-glow text-white font-noto text-xs">
                        ใหม่
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs font-noto">
                    {book.category}
                  </Badge>
                  <h3 className="font-kanit font-semibold text-lg text-foreground line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="font-noto text-sm text-muted-foreground">
                    โดย {book.author}
                  </p>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 font-medium">{book.rating}</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center text-muted-foreground">
                      <Download className="h-4 w-4 mr-1" />
                      {book.downloads}
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0">
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-kanit font-bold text-primary">
                        ฿{book.price}
                      </span>
                      {book.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ฿{book.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button className="w-full font-noto" variant="premium">
                    เพิ่มในตะกร้า
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button variant="outline" size="lg" className="font-noto">
            ดูหนังสือทั้งหมด
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBooks;