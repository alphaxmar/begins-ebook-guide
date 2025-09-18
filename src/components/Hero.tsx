import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Users, Download } from 'lucide-react';
import heroBooks from '@/assets/hero-books.jpg';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-kanit font-bold leading-tight">
                แพลตฟอร์ม
                <br />
                <span className="text-primary-glow">Ebook ออนไลน์</span>
                <br />
                ที่ใหญ่ที่สุด
              </h1>
              <p className="text-xl lg:text-2xl font-noto text-white/90 leading-relaxed">
                ซื้อและขายหนังสืออิเล็กทรอนิกส์ได้ง่ายๆ 
                พร้อมคอลเลคชั่นที่หลากหลายจากผู้เขียนทั่วโลก
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="font-noto text-lg px-8">
                เริ่มต้นอ่าน
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="font-noto text-lg px-8 border-white/30 text-white hover:bg-white/10">
                ขายหนังสือของคุณ
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <BookOpen className="h-8 w-8 text-primary-glow" />
                </div>
                <div className="text-2xl font-kanit font-bold">50K+</div>
                <div className="font-noto text-sm text-white/80">หนังสือ</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Users className="h-8 w-8 text-primary-glow" />
                </div>
                <div className="text-2xl font-kanit font-bold">10K+</div>
                <div className="font-noto text-sm text-white/80">ผู้ใช้งาน</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Download className="h-8 w-8 text-primary-glow" />
                </div>
                <div className="text-2xl font-kanit font-bold">100K+</div>
                <div className="font-noto text-sm text-white/80">ดาวน์โหลด</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img
                src={heroBooks}
                alt="Digital books and reading"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;