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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div className="relative w-full h-auto rounded-lg overflow-hidden cursor-pointer">
              {/* Desktop Image */}
              <div className="hidden md:block relative w-full">
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  width={800}
                  height={400}
                  className="w-full h-auto"
                  sizes="100vw"
                  quality={100}
                  style={{ 
                    objectFit: 'contain',
                    objectPosition: 'center'
                  }}
                />
              </div>
              
              {/* Mobile Image */}
              <div className="block md:hidden relative w-full">
                <Image
                  src={banner.mobile_image_url || banner.image_url}
                  alt={banner.title}
                  width={400}
                  height={200}
                  className="w-full h-auto"
                  sizes="100vw"
                  quality={100}
                  style={{ 
                    objectFit: 'contain',
                    objectPosition: 'center'
                  }}
                />
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 