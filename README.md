# Next.js + Supabase E-Ticaret Projesi - Detaylı Analiz

## 📋 İçindekiler
- [Proje Genel Bakış](#proje-genel-bakış)
- [Teknoloji Stack](#teknoloji-stack)
- [Proje Yapısı](#proje-yapısı)
- [Dosya ve Klasör Detayları](#dosya-ve-klasör-detayları)
- [Bileşenler ve İşlevleri](#bileşenler-ve-işlevleri)
- [Veritabanı Yapısı](#veritabanı-yapısı)
- [Kimlik Doğrulama Sistemi](#kimlik-doğrulama-sistemi)
- [Yönlendirme ve Middleware](#yönlendirme-ve-middleware)
- [UI/UX Bileşenleri](#uiux-bileşenleri)
- [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
- [Sorun Giderme](#sorun-giderme)

## 🎯 Proje Genel Bakış

Bu proje, **Next.js 15** ve **Supabase** kullanılarak geliştirilmiş modern bir e-ticaret platformudur. İki ana kullanıcı türü vardır:
- **Buyer (Alıcı)**: Ürünleri görüntüleyebilir ve satın alabilir
- **Seller (Satıcı)**: Ürün ekleyebilir, düzenleyebilir ve satış yapabilir

### Ana Özellikler:
- ✅ Kullanıcı kayıt/giriş sistemi (Supabase Auth)
- ✅ Rol tabanlı erişim kontrolü (Buyer/Seller)
- ✅ Ürün listeleme ve detay görüntüleme
- ✅ Ürün yükleme (sadece satıcılar için)
- ✅ Görsel yükleme (dosya + URL desteği)
- ✅ Responsive tasarım
- ✅ Dark/Light theme desteği
- ✅ Fars sayı formatlaması
- ✅ Real-time veri senkronizasyonu

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
│   ├── 📄 favicon.ico              # Site ikonu
│   ├── 📁 auth/                    # Kimlik doğrulama sayfaları
│   │   ├── 📁 login/               # Giriş sayfası
│   │   ├── 📁 sign-up/             # Kayıt sayfası
│   │   ├── 📁 sign-up-success/     # Kayıt başarı sayfası
│   │   ├── 📁 forgot-password/     # Şifre sıfırlama
│   │   ├── 📁 update-password/     # Şifre güncelleme
│   │   ├── 📁 confirm/             # Email onayı
│   │   └── 📁 error/               # Auth hata sayfası
│   ├── 📁 protected/               # Korumalı alan (sadece satıcılar)
│   │   ├── 📄 layout.tsx           # Protected layout
│   │   ├── 📄 page.tsx             # Ürün yükleme formu
│   │   └── 📁 delete-products/     # Ürün silme sayfası
│   └── 📁 product-details/         # Ürün detay sayfası
├── 📁 components/                   # UI bileşenleri
│   ├── 📁 ui/                      # shadcn/ui bileşenleri
│   │   ├── 📄 button.tsx           # Button bileşeni
│   │   ├── 📄 card.tsx             # Card bileşeni
│   │   ├── 📄 input.tsx            # Input bileşeni
│   │   ├── 📄 label.tsx            # Label bileşeni
│   │   ├── 📄 textarea.tsx         # Textarea bileşeni
│   │   ├── 📄 checkbox.tsx         # Checkbox bileşeni
│   │   ├── 📄 dropdown-menu.tsx    # Dropdown menu
│   │   └── 📄 badge.tsx            # Badge bileşeni
│   ├── 📄 product-list.tsx         # Ürün listesi bileşeni
│   ├── 📄 product-upload-form.tsx  # Ürün yükleme formu
│   ├── 📄 auth-button.tsx          # Giriş/Çıkış butonu
│   ├── 📄 login-form.tsx           # Giriş formu
│   ├── 📄 sign-up-form.tsx         # Kayıt formu
│   ├── 📄 forgot-password-form.tsx # Şifre sıfırlama formu
│   ├── 📄 update-password-form.tsx # Şifre güncelleme formu
│   ├── 📄 logout-button.tsx        # Çıkış butonu
│   ├── 📄 theme-switcher.tsx       # Theme değiştirici
│   ├── 📄 hero.tsx                 # Hero bölümü
│   ├── 📄 env-var-warning.tsx      # Environment değişken uyarısı
│   └── 📁 tutorial/                # Tutorial bileşenleri
├── 📁 lib/                         # Yardımcı kütüphaneler
│   ├── 📄 utils.ts                 # Genel yardımcı fonksiyonlar
│   └── 📁 supabase/                # Supabase konfigürasyonu
│       ├── 📄 client.ts            # Browser client
│       ├── 📄 server.ts            # Server client
│       └── 📄 middleware.ts        # Middleware helper
├── 📁 public/                      # Statik dosyalar
│   └── 📁 fonts/                   # Font dosyaları
├── 📄 middleware.ts                # Next.js middleware (auth kontrolü)
├── 📄 package.json                 # Proje bağımlılıkları
├── 📄 next.config.ts               # Next.js konfigürasyonu
├── 📄 tailwind.config.ts           # Tailwind CSS konfigürasyonu
├── 📄 tsconfig.json                # TypeScript konfigürasyonu
├── 📄 components.json              # shadcn/ui konfigürasyonu
├── 📄 eslint.config.mjs            # ESLint konfigürasyonu
├── 📄 postcss.config.mjs           # PostCSS konfigürasyonu
├── 📄 .gitignore                   # Git ignore dosyası
└── 📄 README.md                    # Bu dosya
```

## 🔍 Dosya ve Klasör Detayları

### 📁 app/ (Next.js App Router)

#### 📄 app/layout.tsx
- **İşlev**: Ana layout bileşeni, tüm sayfaları sarar
- **İçerik**: 
  - Geist font tanımlaması
  - ThemeProvider (dark/light mode)
  - Metadata tanımları
  - HTML lang="en" ayarı
- **Önemli**: Tüm sayfalarda ortak olan elemanlart (font, theme) burada tanımlı

#### 📄 app/page.tsx  
- **İşlev**: Ana sayfa (/) - ürün listesini gösterir
- **İçerik**:
  - Navigation bar (logo, auth button)
  - ProductList bileşeni
  - Footer (Supabase linki, theme switcher)
- **Önemli**: hasEnvVars kontrolü ile environment değişkenlerinin varlığını kontrol eder

#### 📄 app/globals.css
- **İşlev**: Global CSS stilleri ve CSS değişkenleri
- **İçerik**:
  - Tailwind CSS import'ları
  - Dark/light theme CSS değişkenleri
  - shadcn/ui renk paleti
- **Önemli**: Theme sisteminin renk tanımları burada

### 📁 app/auth/ (Kimlik Doğrulama)

Her klasör bir route oluşturur:
- `/auth/login` - Giriş sayfası
- `/auth/sign-up` - Kayıt sayfası  
- `/auth/sign-up-success` - Kayıt başarı mesajı
- `/auth/forgot-password` - Şifre sıfırlama
- `/auth/update-password` - Şifre güncelleme
- `/auth/confirm` - Email onayı
- `/auth/error` - Auth hataları

### 📁 app/protected/ (Korumalı Alan)

#### 📄 app/protected/layout.tsx
- **İşlev**: Protected sayfalar için özel layout
- **İçerik**: Auth kontrolü ve navigation
- **Önemli**: Sadece seller kullanıcıları erişebilir

#### 📄 app/protected/page.tsx
- **İşlev**: Ürün yükleme sayfası
- **İçerik**: ProductUploadForm bileşeni
- **Önemli**: Kullanıcı oturum kontrolü yapar

### 📁 components/ (UI Bileşenleri)

#### 📄 components/product-list.tsx
- **İşlev**: Ürünleri grid layout'ta listeler
- **Veri Kaynağı**: Supabase `products` tablosu
- **Özellikler**:
  - Loading state gösterimi
  - Error handling
  - Fars sayı formatlaması (toPersianNumber)
  - Text truncation (truncateText)
  - Responsive grid (2-4 columns)
- **Önemli**: Real-time data fetch eder

#### 📄 components/product-upload-form.tsx
- **İşlev**: Yeni ürün ekleme formu
- **Özellikler**:
  - Dosya yükleme (Supabase Storage)
  - URL ile görsel ekleme
  - Form validation
  - Progress indicator
  - UUID ile benzersiz dosya isimleri
- **Önemli**: Sadece authenticated sellers erişebilir

#### 📄 components/auth-button.tsx
- **İşlev**: Dinamik auth button (Login/Logout)
- **Mantık**: User session'a göre farklı buton gösterir

### 📁 components/ui/ (shadcn/ui Bileşenleri)

Tüm UI bileşenleri shadcn/ui standardında:
- **Button**: Çeşitli variant'ları olan buton
- **Card**: İçerik kartları için container
- **Input**: Form input alanları
- **Label**: Form labelları
- **Textarea**: Çok satırlı text input
- **Checkbox**: Onay kutuları
- **Dropdown-menu**: Açılır menüler
- **Badge**: Küçük etiketler

### 📁 lib/ (Yardımcı Kütüphaneler)

#### 📄 lib/utils.ts
- **cn()**: Tailwind class'larını merge eden fonksiyon
- **hasEnvVars**: Environment değişken kontrolü
- **toPersianNumber()**: Sayıları Fars rakamlarına çevirir
- **truncateText()**: Text'i belirtilen satır sayısına keser

#### 📁 lib/supabase/
- **client.ts**: Browser için Supabase client
- **server.ts**: Server-side için Supabase client
- **middleware.ts**: Middleware için auth helper'ları

### 📄 middleware.ts (Route Protection)
- **İşlev**: Request'leri intercept eder, auth kontrolü yapar
- **Mantık**:
  - User session kontrolü
  - User type kontrolü (buyer/seller)
  - Protected route'lara erişim kontrolü
  - Automatic redirect'ler
- **Önemli**: Tüm request'ler buradan geçer

## 🔐 Kimlik Doğrulama Sistemi

### Auth Flow:
1. **Kayıt**: Email + şifre ile kayıt
2. **Email Onayı**: Supabase otomatik email gönderir
3. **Giriş**: Email + şifre ile giriş
4. **Session**: Cookie-based session management
5. **User Type**: Database'de `users` tablosunda `user_type` field'ı

### User Types:
- **buyer**: Normal kullanıcı, sadece ürün görüntüleyebilir
- **seller**: Satıcı, ürün ekleyebilir ve yönetebilir

### Route Protection:
- `/protected/*`: Sadece `seller` kullanıcıları
- `/auth/*`: Sadece anonymous kullanıcılar
- `/`: Herkese açık

## 🗄 Veritabanı Yapısı

### Tablolar:

#### `users` tablosu:
```sql
- id (uuid, primary key) - Supabase auth user id
- user_type (varchar) - 'buyer' | 'seller'
- created_at (timestamp)
- updated_at (timestamp)
```

#### `products` tablosu:
```sql
- id (uuid, primary key)
- name (varchar) - Ürün adı
- description (text) - Ürün açıklaması
- price (decimal) - Fiyat
- category (varchar) - Kategori
- brand (varchar) - Marka
- image_urls (text[]) - Görsel URL'leri array
- user_id (uuid) - Satıcı ID (foreign key)
- created_at (timestamp)
- updated_at (timestamp)
```

### Storage:
- **Bucket**: `products`
- **Path**: `product_images/{uuid}.{extension}`
- **Public**: Evet (public URL'ler)

## 🎨 UI/UX Bileşenleri

### Theme System:
- **Provider**: next-themes
- **Modes**: light, dark, system
- **Toggle**: ThemeSwitcher bileşeni
- **CSS Variables**: globals.css'de tanımlı

### Responsive Design:
- **Mobile**: 2 column grid
- **Tablet**: 3 column grid  
- **Desktop**: 4 column grid
- **Navigation**: Responsive header

### Typography:
- **Font**: Geist (Google Fonts)
- **Sizes**: Tailwind utility classes
- **Colors**: Theme-aware CSS variables

## 🚀 Kurulum ve Çalıştırma

### Ön Gereksinimler:
- Node.js 18+
- npm/yarn/pnpm
- Supabase account

### 1. Projeyi Klonlayın:
```bash
git clone [repository-url]
cd with-supabase-app
```

### 2. Dependencies Kurun:
```bash
npm install
# veya
yarn install
# veya  
pnpm install
```

### 3. Environment Variables:
`.env.local` dosyası oluşturun:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Supabase Setup:
1. [Supabase Dashboard](https://database.new)'da yeni proje oluşturun
2. SQL Editor'da tabloları oluşturun
3. Storage'da `products` bucket'ını oluşturun
4. RLS (Row Level Security) kurallarını ayarlayın

### 5. Development Server:
```bash
npm run dev
```
http://localhost:3000 adresinde çalışacak

### 6. Production Build:
```bash
npm run build
npm start
```

## 🔧 Sorun Giderme

### Yaygın Sorunlar:

#### 1. Environment Variables Hatası:
- **Problem**: "Missing environment variables" uyarısı
- **Çözüm**: `.env.local` dosyasında SUPABASE değişkenlerini kontrol edin
- **Test**: `hasEnvVars` fonksiyonu ile test edin

#### 2. Authentication Sorunları:
- **Problem**: Login işlemi çalışmıyor
- **Çözüm**: Supabase Auth settings'i kontrol edin
- **Debugging**: Browser Developer Tools > Network tab'da auth request'leri kontrol edin

#### 3. Ürün Listeleme Hatası:
- **Problem**: Ürünler görünmüyor
- **Çözüm**: 
  - Database bağlantısını kontrol edin
  - RLS kurallarını kontrol edin
  - Browser Console'da error loglarını kontrol edin

#### 4. Görsel Yükleme Hatası:
- **Problem**: Resim yüklenmiyor
- **Çözüm**:
  - Storage bucket'ının public olduğunu kontrol edin
  - File size limitlerini kontrol edin
  - Supported file formats: jpg, png, gif, webp

#### 5. Middleware Redirect Loop:
- **Problem**: Sürekli redirect oluyor
- **Çözüm**: 
  - `middleware.ts`'deki logic'i kontrol edin
  - User type'ın doğru set edildiğini kontrol edin

#### 6. Theme Switching Sorunu:
- **Problem**: Dark/light mode çalışmıyor
- **Çözüm**: 
  - `next-themes` provider'ının layout'ta doğru wrap edildiğini kontrol edin
  - CSS variables'ların globals.css'de tanımlı olduğunu kontrol edin

### Debug Commands:
```bash
# Linting kontrolü
npm run lint

# Build test (production readiness)
npm run build

# Type checking
npx tsc --noEmit
```

### Geliştirme Notları:
- Hot reload aktif, değişiklikler otomatik yansır
- TypeScript strict mode aktif
- ESLint otomatik format yapar
- Tailwind JIT mode aktif

Bu README dosyası projenin her detayını içermektedir. Herhangi bir sorun yaşadığınızda buraya bakarak kaynağı bulabilirsiniz.
