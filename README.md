# Next.js + Supabase E-Ticaret Projesi - Kapsamlı Dokümantasyon

Bu proje, **Next.js 15** ve **Supabase** kullanılarak geliştirilmiş modern bir e-ticaret platformudur. Kapsamlı marka, kategori ve ürün yönetimi sistemi ile Fars dili desteği sunan gelişmiş bir sistemdir.

## 🎯 Ana Özellikler
- ✅ **Gelişmiş Kategori Sistemi**: Hierarchical kategori yapısı (3 seviye)
- ✅ **Marka Yönetimi**: Brand-specific ürün tipleri ve filtreleme
- ✅ **Dual-Level Breadcrumb**: Kategori + Marka navigasyonu (khanoumi.com benzeri)
- ✅ **RTL Desteği**: Fars dili için right-to-left layout
- ✅ **Professional Upload Form**: Gelişmiş ürün yükleme sistemi
- ✅ **Real-time Data**: Supabase ile canlı veri senkronizasyonu
- ✅ **Responsive Design**: Mobile-first yaklaşım
- ✅ **Theme Support**: Dark/Light mode

## 🗄 Database Schema - Detaylı

### 1. `brands` - Marka Yönetimi
```sql
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL UNIQUE,           -- "NIVEA", "اینترافارم"
  slug varchar NOT NULL UNIQUE,           -- "nivea", "intrapharm"
  description text,                       -- Marka açıklaması
  logo_url text,                         -- Marka logosu URL
  website_url text,                      -- Marka web sitesi
  is_active boolean DEFAULT true,        -- Aktif/pasif durumu
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2. `categories_new` - Hierarchical Kategori Sistemi
```sql
CREATE TABLE categories_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,                 -- "مکمل غذایی و ورزشی"
  slug varchar NOT NULL UNIQUE,          -- "supplements-sports"
  description text,                      -- Kategori açıklaması
  icon varchar,                         -- İkon ismi
  parent_id uuid REFERENCES categories_new(id), -- Parent kategori
  level integer NOT NULL DEFAULT 0,     -- Kategori seviyesi (1,2,3)
  sort_order integer DEFAULT 0,         -- Sıralama
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Kategori Hiyerarşi Örneği:**
```
مکمل غذایی و ورزشی (Level 1)
├── ویتامین و مواد معدنی (Level 2)
│   ├── آهن و فولیک اسید (Level 3)
│   └── ویتامین D (Level 3)
└── پروتئین و آمینو اسید (Level 2)
    ├── پروتئین وی (Level 3)
    └── آمینو اسید (Level 3)
```

### 3. `product_types` - Marka-Specific Ürün Tipleri
```sql
CREATE TABLE product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,                 -- "کپسول ففول"
  slug varchar NOT NULL,                 -- "fefol-capsules"
  description text,                      -- Ürün tipi açıklaması
  brand_id uuid REFERENCES brands(id),   -- Hangi markaya ait
  category_id uuid REFERENCES categories_new(id), -- Hangi kategoride
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 4. `products` - Ana Ürün Tablosu
```sql
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,                    -- "کپسول ففول اینترافارم بسته 50 عددی"
  description text,                      -- Ürün detay açıklaması
  price numeric NOT NULL,               -- Fiyat
  image_urls text[],                    -- Ürün görselleri array
  brand_id uuid REFERENCES brands(id), -- Yeni marka sistemi
  category_id uuid REFERENCES categories_new(id), -- Yeni kategori sistemi
  product_type_id uuid REFERENCES product_types(id), -- Ürün tipi
  user_id uuid REFERENCES auth.users(id), -- Satıcı ID
  stock_quantity integer DEFAULT 0,    -- Stok miktarı
  short_description text,              -- Kısa açıklama
  compare_price numeric,               -- Karşılaştırma fiyatı
  sku varchar,                         -- Stok kodu
  weight numeric,                      -- Ağırlık
  tags text[],                         -- Etiketler array
  is_active boolean DEFAULT true,      -- Aktif/pasif
  is_featured boolean DEFAULT false,   -- Öne çıkan ürün
  is_bestseller boolean DEFAULT false, -- En çok satan
  sales_count integer DEFAULT 0,      -- Satış sayısı
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 5. `users` - Kullanıcı Profil Sistemi
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  user_type text NOT NULL              -- "buyer" | "seller"
);
```

## 🍞 Breadcrumb Sistemi

### Dual-Level Breadcrumb Konsepti (khanoumi.com benzeri)

Sistem iki seviyeli breadcrumb kullanır:

#### 1. **Kategori Breadcrumb** (Üst seviye)
```
مکمل غذایی و ورزشی ← ویتامین و مواد معدنی ← آهن و فولیک اسید ← کپسول ففول
```

#### 2. **Marka + Ürün Tipi Breadcrumb** (Alt seviye)  
```
اینترافارم ← کپسول ففول
```

### `EnhancedBreadcrumb` Bileşeni Modları

```typescript
interface EnhancedBreadcrumbProps {
  showOnlyCategory?: boolean;      // Sadece kategori breadcrumb
  showOnlyBrand?: boolean;         // Sadece marka breadcrumb
  showBrandProductType?: boolean;  // Marka + ürün tipi özel mod
  brandName?: string;             // Marka adı (dışarıdan)
  brandSlug?: string;             // Marka slug
  productTypeName?: string;       // Ürün tipi adı
  productTypeSlug?: string;       // Ürün tipi slug
  categoryId?: string;            // Kategori ID (dışarıdan)
}
```

## 🏷️ Marka ve Ürün Tipi Sistemi

### Marka-Specific Ürün Tipleri

Her marka kendi ürün tiplerine sahip:

#### Intrapharm Markası:
- `فولیک اسید` → `/brand/intrapharm/folic-acid`
- `کپسول ففول` → `/brand/intrapharm/fefol-capsules`
- `کپسول ویتامین` → `/brand/intrapharm/vitamin-capsules`

#### NIVEA Markası:
- `کرم مرطوب کننده صورت` → `/brand/nivea/face-moisturizer`
- `کرم ضد آفتاب` → `/brand/nivea/sunscreen-cream`
- `لوسیون بدن` → `/brand/nivea/body-lotion`

### SEO-Friendly URL Yapısı

```
/brand/[brand-slug]                     # Tüm marka ürünleri
/brand/[brand-slug]/[product-type-slug] # Belirli ürün tipi
```

**Örnekler:**
- `/brand/intrapharm` → "اینترافارم (4 کالا)"
- `/brand/intrapharm/fefol-capsules` → "اینترافارم کپسول ففول (2 کالا)"
- `/brand/nivea/face-moisturizer` → "نیویا کرم مرطوب کننده صورت (2 کالا)"

## 🧩 Bileşenler ve İşlevleri

### 📄 `ProfessionalProductUploadForm` - Gelişmiş Ürün Yükleme

#### Yeni Özellikler:
- ✅ **Marka Seçimi**: Dropdown ile marka seçimi
- ✅ **Kategori Seçimi**: Hierarchical kategori seçimi  
- ✅ **Ürün Tipi Seçimi**: Seçilen markaya göre dinamik filtreleme
- ✅ **Form Validation**: Tüm alanlar için doğrulama
- ✅ **Real-time Updates**: Seçimlere göre otomatik güncelleme

### 📄 `ProductList` - Gelişmiş Ürün Listesi

#### Yeni Props:
```typescript
interface ProductListProps {
  filters?: {
    brand_id?: string;
    category_id?: string;
    product_type_id?: string;
  };
  showFilters?: boolean;    // Filter UI göster/gizle
  showHeader?: boolean;     // Header göster/gizle
}
```

### 📄 `EnhancedBreadcrumb` - Akıllı Breadcrumb Sistemi

#### RTL Layout Support:
```tsx
<div className="text-sm text-gray-600 text-right" dir="rtl">
  <div className="flex items-center gap-2 justify-end">
    {/* Breadcrumb items */}
  </div>
</div>
```

## 🎨 UI/UX Özellikleri

### RTL (Right-to-Left) Desteği:
- Fars rakamları: `toPersianNumber()` fonksiyonu
- RTL layout: `dir="rtl"`, `flex-row-reverse`
- Text alignment: `text-right`, `justify-end`
- Arrow direction: `←` (left arrow for Persian)

### Responsive Design:
```css
/* Mobile */
grid-cols-2        /* 2 sütun */

/* Tablet */
md:grid-cols-3     /* 3 sütun */

/* Desktop */
lg:grid-cols-4     /* 4 sütun */
```

## 🚀 Kurulum ve Çalıştırma

### 1. Environment Setup:
```bash
# .env.local dosyası oluştur
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Database Setup:
```bash
# SQL Editor'da çalıştır:
# create_nivea_database_compatible.sql (örnek veri için)
```

### 3. Installation:
```bash
npm install
npm run dev
```

### 4. Test URLs:
- `http://localhost:3000` - Ana sayfa
- `http://localhost:3000/brand/intrapharm` - Intrapharm markası
- `http://localhost:3000/brand/intrapharm/fefol-capsules` - Fefol kapsülleri
- `http://localhost:3000/brand/nivea/face-moisturizer` - NIVEA yüz kremleri
- `http://localhost:3000/protected` - Ürün yükleme (seller only)

## 📁 Proje Dosya Yapısı

### Kalan SQL Dosyaları:
- ✅ `create_nivea_database_compatible.sql` - NIVEA örnek sistemi
- ✅ `database_setup.sql` - Ana database kurulumu
- ✅ `sample_data.sql` - Örnek veriler
- ✅ `bestsellers_data.sql` - En çok satanlar
- ✅ `hero_banners_data.sql` - Ana sayfa banner'ları

### Temizlenen Dosyalar:
- ❌ `test_*.sql` - Test verileri
- ❌ `debug_*.sql` - Debug sorguları
- ❌ `fix_*.sql` - Geçici düzeltmeler
- ❌ `BREADCRUMB_SETUP_INSTRUCTIONS.md` - Eski talimatlar

## 🔧 Sorun Giderme

### Database İlişki Sorunları:
```sql
-- Foreign key constraint hatası
-- Çözüm: İlişkili tabloları doğru sırada oluşturun:
-- 1. brands
-- 2. categories_new  
-- 3. product_types
-- 4. products
```

### RTL Layout Bozukluğu:
```css
/* Problem: Fars metinler yanlış yönde */
/* Çözüm: dir="rtl" ve flex-row-reverse kullanın */
.breadcrumb {
  direction: rtl;
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
}
```

Bu dokümantasyon projenin mevcut durumunu tamamen yansıtır ve gelecekteki geliştirmeler için referans sağlar.

## 📋 İçindekiler
- [Proje Genel Bakış](#proje-genel-bakış)
- [Teknoloji Stack](#teknoloji-stack)
- [Proje Yapısı](#proje-yapısı)
- [Database Schema - Detaylı](#database-schema---detaylı)
- [Breadcrumb Sistemi](#breadcrumb-sistemi)
- [Marka ve Ürün Tipi Sistemi](#marka-ve-ürün-tipi-sistemi)
- [Bileşenler ve İşlevleri](#bileşenler-ve-işlevleri)
- [Kimlik Doğrulama Sistemi](#kimlik-doğrulama-sistemi)
- [Yönlendirme ve Middleware](#yönlendirme-ve-middleware)
- [UI/UX Bileşenleri](#uiux-bileşenleri)
- [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
- [Sorun Giderme](#sorun-giderme)

## 🎯 Proje Genel Bakış

Bu proje, **Next.js 15** ve **Supabase** kullanılarak geliştirilmiş modern bir e-ticaret platformudur. Kapsamlı marka, kategori ve ürün yönetimi sistemi ile Fars dili desteği sunan gelişmiş bir sistemdir.

### Ana Özellikler:
- ✅ **Gelişmiş Kategori Sistemi**: Hierarchical kategori yapısı (3 seviye)
- ✅ **Marka Yönetimi**: Brand-specific ürün tipleri ve filtreleme
- ✅ **Dual-Level Breadcrumb**: Kategori + Marka navigasyonu (khanoumi.com benzeri)
- ✅ **RTL Desteği**: Fars dili için right-to-left layout
- ✅ **Kullanıcı Sistemi**: Buyer/Seller rol tabanlı erişim
- ✅ **Professional Upload Form**: Gelişmiş ürün yükleme sistemi
- ✅ **Real-time Data**: Supabase ile canlı veri senkronizasyonu
- ✅ **Responsive Design**: Mobile-first yaklaşım
- ✅ **Theme Support**: Dark/Light mode

## 🛠 Teknoloji Stack

### Frontend
- **Next.js 15**: React framework (App Router)
- **React 19**: UI kütüphanesi
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI bileşenleri
- **Lucide React**: İkonlar
- **next-themes**: Theme yönetimi

### Backend & Database
- **Supabase**: Backend-as-a-Service
  - PostgreSQL veritabanı
  - Real-time subscriptions
  - Authentication
  - File storage
  - Row Level Security (RLS)
  - Views for complex queries

### Development Tools
- **ESLint**: Code linting
- **Autoprefixer**: CSS vendor prefixes
- **PostCSS**: CSS processing
- **uuid**: Unique ID generation

## 📁 Proje Yapısı

```
with-supabase-app/
├── 📁 app/                          # Next.js App Router
│   ├── 📄 layout.tsx               # Ana layout (font, theme provider)
│   ├── 📄 page.tsx                 # Ana sayfa (ürün listesi)
│   ├── 📄 globals.css              # Global CSS stilleri
│   ├── 📁 auth/                    # Kimlik doğrulama sayfaları
│   │   ├── 📁 login/               # Giriş sayfası
│   │   ├── 📁 sign-up/             # Kayıt sayfası
│   │   └── 📁 [diğer auth routes]/ # Auth flow sayfaları
│   ├── 📁 protected/               # Korumalı alan (sadece satıcılar)
│   │   ├── 📄 layout.tsx           # Protected layout
│   │   ├── 📄 page.tsx             # Gelişmiş ürün yükleme formu
│   │   └── 📁 delete-products/     # Ürün silme sayfası
│   ├── 📁 product-details/         # Ürün detay sayfası (Enhanced Breadcrumb)
│   ├── 📁 brand/                   # Marka sayfaları
│   │   └── 📁 [slug]/              # Dinamik marka sayfası
│   │       ├── 📄 page.tsx         # Marka ürün listesi
│   │       └── 📁 [productType]/   # Dinamik ürün tipi sayfası
│   │           └── 📄 page.tsx     # Marka + ürün tipi ürünleri
│   └── 📁 category/                # Kategori sayfaları (future)
├── 📁 components/                   # UI bileşenleri
│   ├── 📁 ui/                      # shadcn/ui bileşenleri
│   ├── 📄 product-list.tsx         # Gelişmiş ürün listesi (filtering)
│   ├── 📄 professional-product-upload-form.tsx # Professional upload form
│   ├── 📄 enhanced-breadcrumb.tsx  # Dual-level breadcrumb sistemi
│   ├── 📄 auth-button.tsx          # Dinamik auth button
│   └── 📄 [diğer bileşenler]       # Çeşitli UI bileşenleri
├── 📁 lib/                         # Yardımcı kütüphaneler
│   ├── 📄 utils.ts                 # Fars sayı formatı ve yardımcılar
│   └── 📁 supabase/                # Supabase konfigürasyonu
└── 📄 create_nivea_database_compatible.sql # Database setup script
```

## 🗄 Database Schema - Detaylı

### 📊 Ana Tablolar

#### 1. `brands` - Marka Yönetimi
```sql
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL UNIQUE,           -- "NIVEA", "اینترافارم"
  slug varchar NOT NULL UNIQUE,           -- "nivea", "intrapharm"
  description text,                       -- Marka açıklaması
  logo_url text,                         -- Marka logosu URL
  website_url text,                      -- Marka web sitesi
  is_active boolean DEFAULT true,        -- Aktif/pasif durumu
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 2. `categories_new` - Hierarchical Kategori Sistemi
```sql
CREATE TABLE categories_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,                 -- "مکمل غذایی و ورزشی"
  slug varchar NOT NULL UNIQUE,          -- "supplements-sports"
  description text,                      -- Kategori açıklaması
  icon varchar,                         -- İkon ismi
  parent_id uuid REFERENCES categories_new(id), -- Parent kategori
  level integer NOT NULL DEFAULT 0,     -- Kategori seviyesi (1,2,3)
  sort_order integer DEFAULT 0,         -- Sıralama
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Kategori Hiyerarşi Örneği:**
```
مکمل غذایی و ورزشی (Level 1)
├── ویتامین و مواد معدنی (Level 2)
│   ├── آهن و فولیک اسید (Level 3)
│   └── ویتامین D (Level 3)
└── پروتئین و آمینو اسید (Level 2)
    ├── پروتئین وی (Level 3)
    └── آمینو اسید (Level 3)
```

#### 3. `product_types` - Marka-Specific Ürün Tipleri
```sql
CREATE TABLE product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,                 -- "کپسول ففول"
  slug varchar NOT NULL,                 -- "fefol-capsules"
  description text,                      -- Ürün tipi açıklaması
  brand_id uuid REFERENCES brands(id),   -- Hangi markaya ait
  category_id uuid REFERENCES categories_new(id), -- Hangi kategoride
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 4. `products` - Ana Ürün Tablosu
```sql
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,                    -- "کپسول ففول اینترافارم بسته 50 عددی"
  description text,                      -- Ürün detay açıklaması
  price numeric NOT NULL,               -- Fiyat
  image_urls text[],                    -- Ürün görselleri array
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id), -- Satıcı ID
  category text,                        -- Legacy kategori (nullable)
  brand text,                          -- Legacy marka (nullable)
  main_category_id uuid,               -- Legacy (nullable)
  sub_category_id uuid,                -- Legacy (nullable)
  brand_id uuid REFERENCES brands(id), -- Yeni marka sistemi
  short_description text,              -- Kısa açıklama
  compare_price numeric,               -- Karşılaştırma fiyatı
  sku varchar,                         -- Stok kodu
  barcode varchar,                     -- Barkod
  weight numeric,                      -- Ağırlık
  length numeric,                      -- Uzunluk
  width numeric,                       -- Genişlik
  height numeric,                      -- Yükseklik
  stock_quantity integer DEFAULT 0,    -- Stok miktarı
  min_stock_level integer DEFAULT 0,   -- Minimum stok seviyesi
  tags text[],                         -- Etiketler array
  seo_title varchar,                   -- SEO başlığı
  seo_description text,                -- SEO açıklaması
  is_active boolean DEFAULT true,      -- Aktif/pasif
  is_featured boolean DEFAULT false,   -- Öne çıkan ürün
  is_on_sale boolean DEFAULT false,    -- İndirimde
  updated_at timestamptz DEFAULT now(),
  category_id uuid REFERENCES categories_new(id), -- Yeni kategori sistemi
  is_bestseller boolean DEFAULT false, -- En çok satan
  sales_count integer DEFAULT 0,      -- Satış sayısı
  product_type_id uuid REFERENCES product_types(id) -- Ürün tipi
);
```

#### 5. `users` - Kullanıcı Profil Sistemi
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  user_type text NOT NULL              -- "buyer" | "seller"
);
```

### 🔍 Database Views

#### `breadcrumb_data` - Breadcrumb Verilerini Optimize Eden View
```sql
CREATE VIEW breadcrumb_data AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  b.name as brand_name,
  b.slug as brand_slug,
  pt.name as product_type_name,
  pt.slug as product_type_slug,
  c.name as category_name,
  c.slug as category_slug,
  c.level as category_level,
  pc.name as parent_category_name,
  pc.slug as parent_category_slug,
  gc.name as grandparent_category_name,
  gc.slug as grandparent_category_slug
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_types pt ON p.product_type_id = pt.id
LEFT JOIN categories_new c ON p.category_id = c.id
LEFT JOIN categories_new pc ON c.parent_id = pc.id
LEFT JOIN categories_new gc ON pc.parent_id = gc.id
WHERE p.is_active = true;
```

### 📈 İlişkiler ve Constraints

```sql
-- Foreign Key İlişkileri:
products.brand_id → brands.id
products.category_id → categories_new.id
products.product_type_id → product_types.id
products.user_id → auth.users.id
product_types.brand_id → brands.id
product_types.category_id → categories_new.id
categories_new.parent_id → categories_new.id (self-reference)
users.id → auth.users.id

-- Unique Constraints:
brands.name (UNIQUE)
brands.slug (UNIQUE)  
categories_new.slug (UNIQUE)

-- Not Null Constraints:
brands.name (NOT NULL)
categories_new.name (NOT NULL)
products.name (NOT NULL)
products.price (NOT NULL)
users.user_type (NOT NULL)
```

## 🍞 Breadcrumb Sistemi

### Dual-Level Breadcrumb Konsepti (khanoumi.com benzeri)

Sistem iki seviyeli breadcrumb kullanır:

#### 1. **Kategori Breadcrumb** (Üst seviye)
```
مکمل غذایی و ورزشی ← ویتامین و مواد معدنی ← آهن و فولیک اسید ← کپسول ففول
```

#### 2. **Marka + Ürün Tipi Breadcrumb** (Alt seviye)  
```
اینترافارم ← کپسول ففول
```

### `EnhancedBreadcrumb` Bileşeni Modları

```typescript
interface EnhancedBreadcrumbProps {
  showOnlyCategory?: boolean;      // Sadece kategori breadcrumb
  showOnlyBrand?: boolean;         // Sadece marka breadcrumb
  showBrandProductType?: boolean;  // Marka + ürün tipi özel mod
  brandName?: string;             // Marka adı (dışarıdan)
  brandSlug?: string;             // Marka slug
  productTypeName?: string;       // Ürün tipi adı
  productTypeSlug?: string;       // Ürün tipi slug
  categoryId?: string;            // Kategori ID (dışarıdan)
}
```

### Kullanım Senaryoları

#### 1. **Ürün Detay Sayfası** (`/product-details?id=xxx`)
```tsx
<EnhancedBreadcrumb /> // Default mod - her iki breadcrumb da
```
**Sonuç:**
- Üstte: Kategori hiyerarşisi
- Altta: Marka + ürün tipi

#### 2. **Marka Sayfası** (`/brand/nivea`)
```tsx
<EnhancedBreadcrumb showOnlyBrand={true} />
```
**Sonuç:** Sadece `NIVEA ← [ürün tipi]` (tıklanabilir linkler)

#### 3. **Marka + Ürün Tipi Sayfası** (`/brand/nivea/face-moisturizer`)
```tsx
<EnhancedBreadcrumb 
  showBrandProductType={true}
  brandName="NIVEA"
  brandSlug="nivea"
  productTypeName="کرم مرطوب کننده صورت"
  productTypeSlug="face-moisturizer"
  categoryId="xxx-category-id"
/>
```
**Sonuç:**
- Üstte: Kategori hiyerarşisi (categoryId'den oluşur)
- Altta: `NIVEA ← کرم مرطوب کننده صورت`

### RTL Layout Desteği

```css
/* Fars dili için RTL düzeni */
dir="rtl"
flex-row-reverse
justify-end
text-right
```

**Ok yönü:** `←` (soldan sağa Fars okları)

## 🏷️ Marka ve Ürün Tipi Sistemi

### Marka-Specific Ürün Tipleri

Her marka kendi ürün tiplerine sahip:

#### Intrapharm Markası:
- `فولیک اسید` → `/brand/intrapharm/folic-acid`
- `کپسول ففول` → `/brand/intrapharm/fefol-capsules`
- `کپسول ویتامین` → `/brand/intrapharm/vitamin-capsules`

#### NIVEA Markası:
- `کرم مرطوب کننده صورت` → `/brand/nivea/face-moisturizer`
- `کرم ضد آفتاب` → `/brand/nivea/sunscreen-cream`
- `لوسیون بدن` → `/brand/nivea/body-lotion`

### SEO-Friendly URL Yapısı

```
/brand/[brand-slug]                     # Tüm marka ürünleri
/brand/[brand-slug]/[product-type-slug] # Belirli ürün tipi
```

**Örnekler:**
- `/brand/intrapharm` → "اینترافارم (4 کالا)"
- `/brand/intrapharm/fefol-capsules` → "اینترافارم کپسول ففول (2 کالا)"
- `/brand/nivea/face-moisturizer` → "نیویا کرم مرطوب کننده صورت (2 کالا)"

### Marka Sayfası Özellikleri

#### Simple Brand Layout (khanoumi.com benzeri):
- Temiz, minimal tasarım
- Sadece marka adı + ürün sayısı header
- Filter ve sıralama kontrolleri
- Full-width layout (`px-2`)
- Responsive ürün grid'i

## 🧩 Bileşenler ve İşlevleri

### 📄 `ProfessionalProductUploadForm` - Gelişmiş Ürün Yükleme

#### Yeni Özellikler:
- ✅ **Marka Seçimi**: Dropdown ile marka seçimi
- ✅ **Kategori Seçimi**: Hierarchical kategori seçimi  
- ✅ **Ürün Tipi Seçimi**: Seçilen markaya göre dinamik filtreleme
- ✅ **Form Validation**: Tüm alanlar için doğrulama
- ✅ **Real-time Updates**: Seçimlere göre otomatik güncelleme

#### Form Alanları:
```typescript
interface FormData {
  name: string;                // Ürün adı
  description: string;         // Ürün açıklaması
  shortDescription: string;    // Kısa açıklama
  price: number;              // Fiyat
  comparePrice?: number;      // Karşılaştırma fiyatı
  brandId: string;            // Seçilen marka ID
  categoryId: string;         // Seçilen kategori ID
  productTypeId: string;      // Seçilen ürün tipi ID
  stockQuantity: number;      // Stok miktarı
  sku?: string;              // Stok kodu
  weight?: number;           // Ağırlık
  tags: string[];            // Etiketler
  images: File[];            // Yüklenen görseller
}
```

#### Dynamic Filtering Logic:
```typescript
// Seçilen markaya göre ürün tiplerini filtrele
const filteredProductTypes = productTypes.filter(
  pt => pt.brand_id === selectedBrandId && 
        pt.category_id === selectedCategoryId
);
```

### 📄 `ProductList` - Gelişmiş Ürün Listesi

#### Yeni Props:
```typescript
interface ProductListProps {
  filters?: {
    brand_id?: string;
    category_id?: string;
    product_type_id?: string;
  };
  showFilters?: boolean;    // Filter UI göster/gizle
  showHeader?: boolean;     // Header göster/gizle
}
```

#### Kullanım Örnekleri:
```tsx
// Ana sayfa - tüm ürünler
<ProductList />

// Marka sayfası - sadece marka ürünleri
<ProductList 
  filters={{ brand_id: "xxx" }}
  showFilters={false}
  showHeader={false}
/>

// Marka + ürün tipi sayfası
<ProductList 
  filters={{ 
    brand_id: "xxx", 
    product_type_id: "yyy" 
  }}
  showFilters={false}
  showHeader={false}
/>
```

### 📄 `EnhancedBreadcrumb` - Akıllı Breadcrumb Sistemi

#### Automatic Data Fetching:
- URL'den otomatik veri çekimi
- `breadcrumb_data` view'ından optimize edilmiş sorgular
- Category ID'den hiyerarşi oluşturma
- Real-time güncellemeler

#### RTL Layout Support:
```tsx
<div className="text-sm text-gray-600 text-right" dir="rtl">
  <div className="flex items-center gap-2 justify-end">
    {/* Breadcrumb items */}
  </div>
</div>
```

## 🔐 Kimlik Doğrulama Sistemi

### Auth Flow:
1. **Kayıt**: Email + şifre + user_type seçimi
2. **Email Onayı**: Supabase otomatik email
3. **User Profile**: `users` tablosunda `user_type` kaydı
4. **Session Management**: Cookie-based session
5. **Route Protection**: Middleware ile kontrol

### User Types:
- **buyer**: Ürün görüntüleme, satın alma
- **seller**: Ürün ekleme, yönetme, satış

### Protected Routes:
- `/protected/*`: Sadece `seller` kullanıcıları
- `/auth/*`: Sadece anonymous kullanıcılar
- Marka sayfaları: Herkese açık
- Admin sayfaları: Future enhancement

## 🛣️ Yönlendirme ve Middleware

### Route Structure:
```
/                           # Ana sayfa (ürün listesi)
/auth/login                 # Giriş
/auth/sign-up              # Kayıt
/protected/                 # Ürün yükleme (seller only)
/brand/[slug]              # Marka sayfası
/brand/[slug]/[productType] # Marka + ürün tipi
/product-details?id=xxx     # Ürün detay
/category/[...slug]         # Kategori sayfaları (future)
```

### Middleware Logic:
```typescript
// User authentication kontrolü
const user = await createClient().auth.getUser();

// Route-based access control
if (pathname.startsWith('/protected/')) {
  // Sadece seller kullanıcıları
  if (userType !== 'seller') {
    return NextResponse.redirect('/auth/login');
  }
}
```

## 🎨 UI/UX Bileşenleri

### RTL (Right-to-Left) Desteği:
- Fars rakamları: `toPersianNumber()` fonksiyonu
- RTL layout: `dir="rtl"`, `flex-row-reverse`
- Text alignment: `text-right`, `justify-end`
- Arrow direction: `←` (left arrow for Persian)

### Responsive Design:
```css
/* Mobile */
grid-cols-2        /* 2 sütun */

/* Tablet */
md:grid-cols-3     /* 3 sütun */

/* Desktop */
lg:grid-cols-4     /* 4 sütun */
```

### Theme Support:
- **CSS Variables**: `globals.css`'de theme-aware renkler
- **Theme Provider**: `next-themes` ile automatic system detection
- **Dark/Light Toggle**: Header'da theme switcher

### Typography:
- **Font**: Geist (optimal for Persian + English)
- **Size Scale**: Tailwind utilities
- **Color System**: Theme-aware CSS variables

## 🚀 Kurulum ve Çalıştırma

### Ön Gereksinimler:
- Node.js 18+
- npm/yarn/pnpm
- Supabase account

### 1. Environment Setup:
```bash
# .env.local dosyası oluştur
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Database Setup:
```bash
# SQL Editor'da çalıştır:
# 1. create_nivea_database_compatible.sql (örnek veri için)
# 2. Veya kendi database_setup.sql'inizi çalıştırın
```

### 3. Installation:
```bash
npm install
npm run dev
```

### 4. Test URLs:
- `http://localhost:3000` - Ana sayfa
- `http://localhost:3000/brand/intrapharm` - Intrapharm markası
- `http://localhost:3000/brand/intrapharm/fefol-capsules` - Fefol kapsülleri
- `http://localhost:3000/brand/nivea/face-moisturizer` - NIVEA yüz kremleri
- `http://localhost:3000/protected` - Ürün yükleme (seller only)

## 🔧 Sorun Giderme

### Database İlişki Sorunları:
```sql
-- Foreign key constraint hatası
-- Çözüm: İlişkili tabloları doğru sırada oluşturun:
-- 1. brands
-- 2. categories_new  
-- 3. product_types
-- 4. products
```

### Breadcrumb Görünmeme:
```typescript
// Problem: breadcrumb_data view'ı bulunamıyor
// Çözüm: View'ı manuel oluşturun veya products'a join'li sorgu yazın
```

### RTL Layout Bozukluğu:
```css
/* Problem: Fars metinler yanlış yönde */
/* Çözüm: dir="rtl" ve flex-row-reverse kullanın */
.breadcrumb {
  direction: rtl;
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
}
```

### Marka Filtreleme Çalışmıyor:
```typescript
// Problem: ProductList'te brand filter çalışmıyor
// Çözüm: filters prop'unu doğru geçtiğinizden emin olun
<ProductList filters={{ brand_id: brandId }} />
```

## 📊 Database Maintenance

### Temizlik Scripti:
Gereksiz SQL dosyalarını temizlemek için bu dosyalar silinebilir:
- `test_*.sql` - Test verileri
- `debug_*.sql` - Debug sorguları
- `fix_*.sql` - Geçici düzeltmeler
- `update_*.sql` - Eski güncellemeler

### Backup Strategy:
```sql
-- Kritik tabloları yedekle:
pg_dump --table=brands > brands_backup.sql
pg_dump --table=categories_new > categories_backup.sql
pg_dump --table=product_types > product_types_backup.sql
pg_dump --table=products > products_backup.sql
```

Bu dokümantasyon projenin mevcut durumunu tamamen yansıtır ve gelecekteki geliştirmeler için referans sağlar. 