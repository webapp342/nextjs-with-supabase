'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const fetchBanners = useCallback(async () => {
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
  }, [supabase])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex gap-4 px-4 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-80 h-44 md:w-96 md:h-56 bg-gray-200 rounded-lg animate-pulse" />
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
          msOverflowStyle: 'none'
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
            className="flex-shrink-0 w-80 h-44 md:w-96 md:h-56 rounded-lg overflow-hidden shadow-lg relative"
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
    <div className="relative w-full h-full">
      {/* Background Image - Desktop */}
      <div className="absolute inset-0 hidden md:block">
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          className="object-cover w-full h-full"
          sizes="(max-width: 768px) 100vw, 384px"
          quality={100}
          priority
          unoptimized
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      </div>
      
      {/* Background Image - Mobile */}
      <div className="absolute inset-0 block md:hidden">
        <Image
          src={banner.mobile_image_url || banner.image_url}
          alt={banner.title}
          fill
          className="object-cover w-full h-full"
          sizes="(max-width: 768px) 100vw, 384px"
          quality={100}
          priority
          unoptimized
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
} 