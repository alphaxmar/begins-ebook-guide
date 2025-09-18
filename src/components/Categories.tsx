import { Card, CardContent } from '@/components/ui/card';
import { 
  BookOpen, 
  Briefcase, 
  Code, 
  Heart, 
  Palette, 
  GraduationCap,
  TrendingUp,
  Globe
} from 'lucide-react';

const categories = [
  {
    id: 1,
    name: 'ธุรกิจ',
    count: '2,341',
    icon: Briefcase,
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 2,
    name: 'เทคโนโลยี',
    count: '1,892',
    icon: Code,
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 3,
    name: 'พัฒนาตัวเอง',
    count: '3,124',
    icon: TrendingUp,
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 4,
    name: 'การศึกษา',
    count: '1,567',
    icon: GraduationCap,
    gradient: 'from-orange-500 to-orange-600'
  },
  {
    id: 5,
    name: 'วรรณกรรม',
    count: '2,789',
    icon: BookOpen,
    gradient: 'from-red-500 to-red-600'
  },
  {
    id: 6,
    name: 'ศิลปะ',
    count: '987',
    icon: Palette,
    gradient: 'from-pink-500 to-pink-600'
  },
  {
    id: 7,
    name: 'สุขภาพ',
    count: '1,234',
    icon: Heart,
    gradient: 'from-teal-500 to-teal-600'
  },
  {
    id: 8,
    name: 'ต่างประเทศ',
    count: '1,876',
    icon: Globe,
    gradient: 'from-indigo-500 to-indigo-600'
  }
];

const Categories = () => {
  return (
    <section className="py-16 lg:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-kanit font-bold text-foreground mb-4">
            หมวดหมู่หนังสือ
          </h2>
          <p className="text-lg font-noto text-muted-foreground max-w-2xl mx-auto">
            เลือกหมวดหมู่ที่คุณสนใจ เพื่อค้นหาหนังสือที่ตรงใจได้ง่ายขึ้น
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.id} 
                className="group hover:shadow-card-custom transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border/50"
              >
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${category.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-kanit font-semibold text-lg text-foreground mb-2">
                    {category.name}
                  </h3>
                  <p className="font-noto text-sm text-muted-foreground">
                    {category.count} หนังสือ
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;