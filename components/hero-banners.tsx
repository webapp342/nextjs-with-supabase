'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

interface HeroBanner {
  id: string
  title: string
  subtitle?: string
  description?: string
  image_url: string
  mobile_image_url?: string
  link_url?: string
  link_text?: string
  background_color: string
  text_color: string
  button_color: string
  sort_order: number
  is_active: boolean
}

export default function HeroBanners() {
  const [banners, setBanners] = useState<HeroBanner[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) {
        console.error('Error fetching hero banners:', error)
        return
      }

      setBanners(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex gap-4 px-4 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-80 h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (banners.length === 0) {
    return null
  }

  return (
    <div className="py-8">
      <div 
        className="flex gap-4 px-4 overflow-x-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' }
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="flex-shrink-0 w-80 h-48 rounded-lg overflow-hidden shadow-md relative"
            style={{ backgroundColor: banner.background_color }}
          >
            {banner.link_url ? (
              <Link href={banner.link_url} className="block w-full h-full">
                <BannerContent banner={banner} />
              </Link>
            ) : (
              <BannerContent banner={banner} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BannerContent({ banner }: { banner: HeroBanner }) {
  return (
    <div className="relative w-full h-full flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          className="object-cover opacity-20"
          sizes="(max-width: 768px) 320px, 320px"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 p-6 w-full">
        <div className="text-right">
          {/* Subtitle */}
          {banner.subtitle && (
            <div 
              className="text-sm font-medium mb-1"
              style={{ color: banner.text_color }}
            >
              {banner.subtitle}
            </div>
          )}
          
          {/* Title */}
          <h3 
            className="text-lg font-bold mb-2 leading-tight"
            style={{ color: banner.text_color }}
          >
            {banner.title}
          </h3>
          
          {/* Description */}
          {banner.description && (
            <p 
              className="text-xs mb-4 opacity-80 leading-relaxed"
              style={{ color: banner.text_color }}
            >
              {banner.description}
            </p>
          )}
          
          {/* Button */}
          {banner.link_text && (
            <button
              className="px-4 py-2 text-xs font-medium rounded-md text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: banner.button_color }}
            >
              {banner.link_text}
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 