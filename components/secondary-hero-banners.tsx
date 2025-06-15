'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

interface SecondaryHeroBanner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  mobile_image_url?: string;
  link_url: string;
  link_text?: string;
  background_color: string;
  text_color: string;
  button_color: string;
  sort_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

export default function SecondaryHeroBanners() {
  const [banners, setBanners] = useState<SecondaryHeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('secondary_hero_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching secondary hero banners:', error);
        return;
      }

      // Filter banners by date if they have date restrictions
      const now = new Date();
      const activeBanners = (data || []).filter(banner => {
        if (banner.start_date && new Date(banner.start_date) > now) return false;
        if (banner.end_date && new Date(banner.end_date) < now) return false;
        return true;
      });

      setBanners(activeBanners);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Auto-slide functionality
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const currentScroll = container.scrollLeft;
        const bannerWidth = container.clientWidth;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        // Move to next banner (LTR) - more smoothly
        const nextScroll = currentScroll + bannerWidth;
        
        // If we're near the end, jump to the beginning seamlessly
        if (nextScroll >= maxScroll - 10) { // Small buffer to prevent issues
          setTimeout(() => {
            container.scrollLeft = 0;
          }, 300); // Delay to allow smooth scroll to complete
        } else {
          container.scrollTo({
            left: nextScroll,
            behavior: 'smooth'
          });
        }
      }
    }, 4000); // Increased to 4 seconds for smoother experience

    return () => clearInterval(interval);
  }, [banners.length]);

  // Initialize scroll position to beginning for LTR
  useEffect(() => {
    if (banners.length > 1 && scrollContainerRef.current) {
      setTimeout(() => {
        const container = scrollContainerRef.current;
        if (container) {
          container.scrollLeft = 0; // Start at beginning for LTR
        }
      }, 100);
    }
  }, [banners]);

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex gap-3 px-4 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[calc(100vw-80px)] md:w-[calc(100vw-120px)] h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  // Create infinite loop by duplicating banners
  const infiniteBanners = banners.length > 1 ? [...banners, ...banners, ...banners] : banners;

  return (
    <div className="py-6">
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 px-4 overflow-x-auto snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {infiniteBanners.map((banner, index) => (
          <div
            key={`${banner.id}-${index}`}
            className={`flex-shrink-0 rounded-xl overflow-hidden relative snap-center ${
              banners.length === 1 
                ? 'w-[calc(100vw-32px)] md:w-[calc(100vw-64px)]' 
                : 'w-[calc(100vw-80px)] md:w-[calc(100vw-120px)]'
            }`}
          >
            {banner.link_url ? (
              <Link href={banner.link_url} className="block w-full">
                <BannerContent banner={banner} />
              </Link>
            ) : (
              <BannerContent banner={banner} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BannerContent({ banner }: { banner: SecondaryHeroBanner }) {
  return (
    <div className="relative w-full">
      {/* Background Image - Desktop */}
      <div className="hidden md:block">
        <Image
          src={banner.image_url}
          alt={banner.title}
          width={1200}
          height={0}
          className="w-full h-auto"
          sizes="(min-width: 1024px) 100vw, 100vw"
          quality={100}
          priority
          style={{ height: 'auto' }}
        />
      </div>
      
      {/* Background Image - Mobile */}
      <div className="block md:hidden">
        <Image
          src={banner.mobile_image_url || banner.image_url}
          alt={banner.title}
          width={800}
          height={0}
          className="w-full h-auto"
          sizes="100vw"
          quality={100}
          priority
          style={{ height: 'auto' }}
        />
      </div>
    </div>
  );
}