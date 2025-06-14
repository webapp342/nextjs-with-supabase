'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

interface PositionedBanner {
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
  position: string;
  is_active: boolean;
}

interface PositionedBannersProps {
  position: string;
  className?: string;
}

export function PositionedBanners({ position, className = '' }: PositionedBannersProps) {
  const [banners, setBanners] = useState<PositionedBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchBanners();
  }, [position]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('positioned_banners')
        .select('*')
        .eq('position', position)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching positioned banners:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || banners.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {banners.map((banner, index) => (
        <div key={banner.id} className={index > 0 ? 'mt-4' : ''}>
          <Link href={banner.link_url}>
            <div 
              className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden group cursor-pointer"
              style={{ backgroundColor: banner.background_color }}
            >
              {/* Desktop Image */}
              <div className="hidden md:block relative w-full h-full">
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
              
              {/* Mobile Image */}
              <div className="block md:hidden relative w-full h-full">
                <Image
                  src={banner.mobile_image_url || banner.image_url}
                  alt={banner.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="text-center p-6" style={{ color: banner.text_color }}>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h2>
                  {banner.subtitle && (
                    <p className="text-lg md:text-xl mb-2">{banner.subtitle}</p>
                  )}
                  {banner.description && (
                    <p className="text-sm md:text-base mb-4 max-w-md mx-auto">{banner.description}</p>
                  )}
                  {banner.link_text && (
                    <span 
                      className="inline-block px-6 py-2 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: banner.button_color }}
                    >
                      {banner.link_text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 