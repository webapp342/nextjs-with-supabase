# Gelişmiş Breadcrumb Sistemi - Kurulum Talimatları

Bu sistem, https://www.khanoumi.com/ sitesinde olduğu gibi iki seviyeli breadcrumb sistemi sağlar:

## 🗂️ Breadcrumb Türleri

### 1. **Üst Breadcrumb**: Kategori Hiyerarşisi
```
Ana Sayfa > Kozmetik > Yüz Bakımı > Foundation
```

### 2. **Alt Breadcrumb**: Marka ve Ürün Tipi
```
Maybelline > Liquid Foundation
```

## 🚀 Kurulum Adımları

### 1. Database Güncellemesi
```bash
# Supabase SQL Editor'de aşağıdaki dosyayı çalıştırın:
database_breadcrumb_enhancement.sql
```

Bu dosya şunları ekler:
- `product_types` tablosu
- `products.product_type_id` sütunu  
- Breadcrumb verilerini kolayca getirmek için `breadcrumb_data` view'i
- Örnek ürün çeşitleri

### 2. Breadcrumb Bileşenini Güncelle

Ürün detay sayfalarında eski breadcrumb yerine yeni breadcrumb'ı kullanın:

```typescript
// Eski:
import { Breadcrumb } from '@/components/breadcrumb';

// Yeni:
import { EnhancedBreadcrumb } from '@/components/enhanced-breadcrumb';

// Kullanım:
<EnhancedBreadcrumb />
```

### 3. Ürün Yükleme Formu

Artık ürün yüklerken aşağıdaki alanları seçebilirsiniz:
- **Kategori**: Ana kategoriler ve alt kategoriler
- **Marka**: Mevcut markalardan seçim
- **Ürün Çeşidi**: Seçili marka ve kategoriye göre dinamik olarak filtrelenir

## 📋 Ürün Çeşidi Örnekleri

### Maybelline - Foundation Kategorisi:
- Liquid Foundation (Maybelline > Liquid Foundation)
- Cream Foundation (Maybelline > Cream Foundation)

### Maybelline - Mascara Kategorisi:
- Volumizing Mascara (Maybelline > Volumizing Mascara)
- Waterproof Mascara (Maybelline > Waterproof Mascara)

### L'Oréal - Lipstick Kategorisi:
- Liquid Lipstick (L'Oréal > Liquid Lipstick)
- Matte Lipstick (L'Oréal > Matte Lipstick)

## 🌐 URL Yapısı

### Kategori Sayfaları:
```
/category/makeup
/category/makeup/foundation
/category/skincare/moisturizer
```

### Marka Sayfaları:
```
/brand/maybelline                     # Tüm Maybelline ürünleri
/brand/maybelline/liquid-foundation   # Maybelline Liquid Foundation ürünleri
/brand/loreal/matte-lipstick         # L'Oréal Matte Lipstick ürünleri
```

## 🔧 Yeni Ürün Çeşidi Ekleme

### Manual SQL ile:
```sql
INSERT INTO product_types (name, slug, brand_id, category_id, sort_order)
VALUES (
  'Gel Eyeliner',
  'gel-eyeliner', 
  (SELECT id FROM brands WHERE slug = 'maybelline'), 
  (SELECT id FROM categories_new WHERE slug = 'eyeliner'),
  1
);
```

### Ürün Yükleme Formu ile:
1. Marka ve kategori seçin
2. "Yeni Ürün Çeşidi Ekle" butonuna tıklayın
3. Ürün çeşidi adını girin
4. Otomatik olarak oluşturulur ve seçilir

## 📊 Database Yapısı

### product_types Tablosu:
```sql
- id: UUID (Primary Key)
- name: VARCHAR(255) (Örn: "Liquid Foundation")
- slug: VARCHAR(255) (Örn: "liquid-foundation") 
- brand_id: UUID (Foreign Key to brands)
- category_id: UUID (Foreign Key to categories_new)
- description: TEXT (İsteğe bağlı)
- is_active: BOOLEAN
- sort_order: INTEGER
```

### breadcrumb_data View:
Tek sorguda tüm breadcrumb bilgilerini getirir:
- Ürün bilgileri
- Marka bilgileri
- Ürün çeşidi bilgileri
- Kategori hiyerarşisi (3 seviyeye kadar)

## 🎯 Faydalar

### 1. **SEO Dostu URL'ler**
```
/brand/maybelline/liquid-foundation
/category/makeup/foundation
```

### 2. **Kullanıcı Deneyimi**
- Net navigasyon yolu
- Her seviyede geri dönüş linkler
- Hızlı kategori geçişi

### 3. **Yönetim Kolaylığı**
- Marka bazında ürün organizasyonu
- Kategori bazında filtreleme
- Dinamik breadcrumb oluşturma

### 4. **Genişletilebilirlik**
- Yeni ürün çeşitleri kolayca eklenebilir
- Sınırsız kategori derinliği
- Markaya özel ürün tipleri

## 🔍 Test Etme

1. **Database kurulumunu test edin:**
```sql
SELECT * FROM breadcrumb_data LIMIT 5;
```

2. **Ürün yükleme formunu test edin:**
   - Marka seçin
   - Kategori seçin  
   - Ürün çeşidi seçeneklerinin geldiğini kontrol edin

3. **Breadcrumb'ları test edin:**
   - Ürün detay sayfasına gidin
   - Her iki breadcrumb seviyesinin göründüğünü kontrol edin

## 🛠️ Sorun Giderme

### Ürün çeşitleri görünmüyor:
- Marka ve kategori seçildiğinden emin olun
- product_types tablosunda ilgili veriler olduğundan emin olun

### Breadcrumb çalışmıyor:
- breadcrumb_data view'inin oluştuğunu kontrol edin
- Ürün kaydında product_type_id'nin dolu olduğunu kontrol edin

### URL'ler çalışmıyor:
- /brand/[slug]/page.tsx dosyasının var olduğunu kontrol edin
- /brand/[slug]/[productType]/page.tsx dosyasının var olduğunu kontrol edin

## 📝 Notlar

- Ürün çeşidi seçimi isteğe bağlıdır
- Mevcut ürünler için product_type_id NULL olabilir
- Breadcrumb her iki seviyeyi de destekler
- SEO için JSON-LD breadcrumb desteği mevcuttur

Bu sistem sayesinde kullanıcılarınız ürünleri daha kolay bulabilir ve sitenizde daha iyi navigasyon deneyimi yaşar. 