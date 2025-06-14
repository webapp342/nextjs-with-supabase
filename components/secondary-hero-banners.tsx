'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('secondary_hero_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      // Filter banners by date if they have date restrictions
      const now = new Date();
      const activeBanners = (data || []).filter(banner => {
        if (banner.start_date && new Date(banner.start_date) > now) return false;
        if (banner.end_date && new Date(banner.end_date) < now) return false;
        return true;
      });

      setBanners(activeBanners);
    } catch (error) {
      console.error('Error fetching secondary hero banners:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-slide functionality
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg"></div>
    );
  }

  if (banners.length === 0) {
    return null; // Don't render anything if no banners
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden rounded-lg group">
      {/* Banner Image and Content */}
      <div 
        className="relative w-full h-full flex items-center justify-center text-center"
        style={{ backgroundColor: currentBanner.background_color }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={currentBanner.mobile_image_url && typeof window !== 'undefined' && window.innerWidth < 768 
              ? currentBanner.mobile_image_url 
              : currentBanner.image_url}
            alt={currentBanner.title}
            fill
            className="object-cover"
            priority={currentIndex === 0}
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>

        {/* Content */}
        <div 
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ color: currentBanner.text_color }}
        >
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">
            {currentBanner.title}
          </h2>
          
          {currentBanner.subtitle && (
            <h3 className="text-lg md:text-xl lg:text-2xl font-medium mb-2 md:mb-4 opacity-90">
              {currentBanner.subtitle}
            </h3>
          )}
          
          {currentBanner.description && (
            <p className="text-sm md:text-base lg:text-lg mb-4 md:mb-6 opacity-80 max-w-2xl mx-auto">
              {currentBanner.description}
            </p>
          )}
          
          {currentBanner.link_text && (
            <Link href={currentBanner.link_url}>
              <Button 
                size="lg"
                className="text-white font-semibold px-6 py-3 md:px-8 md:py-4"
                style={{ 
                  backgroundColor: currentBanner.button_color,
                  borderColor: currentBanner.button_color
                }}
              >
                {currentBanner.link_text}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Transition Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="w-full h-full transition-opacity duration-500"
          style={{ 
            opacity: 1,
            background: `linear-gradient(45deg, ${currentBanner.background_color}00, ${currentBanner.background_color}20)`
          }}
        />
      </div>
    </div>
  );
}