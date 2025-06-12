import { CategoriesGrid } from "@/components/categories-grid";
import { ProductList } from "@/components/product-list";
import { CategoryBanners } from "@/components/category-banners";
import { BestsellersSection } from "@/components/bestsellers-section";
import { ThemeSwitcher } from "@/components/theme-switcher";
import HeroBanners from "@/components/hero-banners";

export default function Home() {
  return (
    <>
      {/* Hero Banners Section */}
      <div className="w-full">
        <HeroBanners />
      </div>

      {/* Category Banners Section */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <CategoryBanners limit={6} />
        </div>
      </div>

      {/* Categories Section - Hidden on mobile since we have mobile menu */}
      <div className="hidden md:block w-full">
        <CategoriesGrid />
      </div>

      {/* Bestsellers Section */}
      <div className="w-full">
        <BestsellersSection />
      </div>

      {/* Products Section */}
      <div className="w-full">
        <div className="px-2 py-6">
          <ProductList />
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16 bg-muted/30 mt-auto">
        <p>
          Powered by{" "}
          <a
            href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
            target="_blank"
            className="font-bold hover:underline"
            rel="noreferrer"
          >
            Supabase
          </a>
        </p>
        <ThemeSwitcher />
      </footer>
    </>
  );
}
