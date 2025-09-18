import Header from '@/components/Header';
import Hero from '@/components/Hero';
import FeaturedBooks from '@/components/FeaturedBooks';
import Categories from '@/components/Categories';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Categories />
        <FeaturedBooks />
      </main>
    </div>
  );
};

export default Index;
