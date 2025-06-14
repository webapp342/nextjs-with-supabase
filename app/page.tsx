import { CategoriesGrid } from "@/components/categories-grid";
import { CategoryBanners } from "@/components/category-banners";
import { BestsellersSection } from "@/components/bestsellers-section";
import { RecommendedSection } from "@/components/recommended-section";
import { NewProductsSection } from "@/components/new-products-section";
import { ThemeSwitcher } from "@/components/theme-switcher";
import HeroBanners from "@/components/hero-banners";
import { QuickAccessButtons } from "@/components/quick-access-buttons";
import { CategoryImageButtons } from "@/components/category-image-buttons";
import { PositionedBanners } from "@/components/positioned-banners";
import SecondaryHeroBanners from "@/components/secondary-hero-banners";

export default function Home() {
  return (
    <>
      {/* 1. Quick Access Buttons Section */}
      <QuickAccessButtons />

      {/* 2. Hero Banners Section */}
      <div className="w-full">
        <HeroBanners />
      </div>

      {/* 3. Category Image Buttons Section */}
      <CategoryImageButtons />

      {/* 4. Bestsellers Section */}
      <div className="w-full">
        <BestsellersSection />
      </div>

      {/* 5. Middle Banners */}
      <div className="w-full px-4 py-6 space-y-4">
        <PositionedBanners position="home_middle_1" />
        <PositionedBanners position="home_middle_2" />
      </div>

      {/* 6. Recommended Section */}
      <div className="w-full">
        <RecommendedSection />
      </div>

      {/* 7. Secondary Hero Banners (Slide edilebilen) */}
      <div className="w-full px-4 py-6">
        <SecondaryHeroBanners />
      </div>

      {/* 8. New Products Section */}
      <div className="w-full">
        <NewProductsSection />
      </div>

      {/* 9. Bottom Banners */}
      <div className="w-full px-4 py-6 space-y-4">
        <PositionedBanners position="home_bottom_1" />
        <PositionedBanners position="home_bottom_2" />
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
