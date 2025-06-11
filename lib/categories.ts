export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export const categories: Category[] = [
  {
    id: '1',
    name: 'آرایشی',
    icon: '💄',
    slug: 'cosmetics'
  },
  {
    id: '2', 
    name: 'برندها',
    icon: '📋',
    slug: 'brands'
  },
  {
    id: '3',
    name: 'پیشنهاد ویژه', 
    icon: '⭐',
    slug: 'special-offers'
  },
  {
    id: '4',
    name: 'مراقبت پوست',
    icon: '🧴',
    slug: 'skincare'
  },
  {
    id: '5',
    name: 'بهداشت شخصی',
    icon: '🚿',
    slug: 'personal-hygiene'
  },
  {
    id: '6',
    name: 'مراقبت و زیبایی مو',
    icon: '🧴',
    slug: 'hair-care'
  },
  {
    id: '7',
    name: 'لوازم برقی',
    icon: '📹',
    slug: 'electronics'
  },
  {
    id: '8',
    name: 'عطر و اسپری',
    icon: '🌸',
    slug: 'perfumes'
  },
  {
    id: '9',
    name: 'مد و پوشاک',
    icon: '👕',
    slug: 'fashion'
  },
  {
    id: '10',
    name: 'مکمل غذایی و ورزشی',
    icon: '🏋️',
    slug: 'supplements'
  },
  {
    id: '11',
    name: 'طلا و نقره',
    icon: '💍',
    slug: 'jewelry'
  },
  {
    id: '12',
    name: 'کالای دیجیتال',
    icon: '📱',
    slug: 'digital'
  },
  {
    id: '13',
    name: 'مجله خانومی',
    icon: '📖',
    slug: 'magazine'
  }
]; 