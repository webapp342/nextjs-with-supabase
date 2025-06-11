# 📦 Supabase Veritabanı Kurulum Rehberi

Bu rehber, kozmetik e-ticaret uygulaması için Supabase veritabanını kurmak için gerekli adımları içerir.

## 🚀 Kurulum Adımları

### 1. Supabase Dashboard'a Giriş
1. [Supabase](https://supabase.com) hesabınıza giriş yapın
2. Projenizi seçin veya yeni proje oluşturun
3. Sol menüden **SQL Editor**'ı açın

### 2. Kategori Sistemi Kurulumu
1. `database_setup.sql` dosyasının içeriğini kopyalayın
2. Supabase SQL Editor'da yapıştırın
3. **Run** butonuna tıklayın
4. Başarılı mesajı bekleyin

Bu adım şunları oluşturacak:
- ✅ Ana kategoriler tablosu (`main_categories`)
- ✅ Alt kategoriler tablosu (`sub_categories`) 
- ✅ Markalar tablosu (`brands`)
- ✅ Ürün özellikleri tabloları (`attribute_categories`, `attribute_values`)
- ✅ 9 ana kategori (Makyaj, Cilt Bakımı, Saç Bakımı, vb.)
- ✅ 30+ alt kategori (Foundation, Rimel, Şampuan, vb.)
- ✅ 20 popüler kozmetik markası
- ✅ Ürün özellikleri (Yaş grubu, Cilt tipi, Renk, vb.)

### 3. Products Tablosu Güncelleme
1. `update_products_table.sql` dosyasının içeriğini kopyalayın
2. Supabase SQL Editor'da yapıştırın
3. **Run** butonuna tıklayın

Bu adım şunları yapacak:
- 🔄 Mevcut `products` tablosunu yeni kategori sistemiyle uyumlu hale getirir
- ➕ Yeni kolonlar ekler (marka, stok, SEO, vb.)
- 🔗 Foreign key bağlantıları kurar
- 📊 Performans için indexler oluşturur
- 🛡️ RLS (Row Level Security) policies günceller

### 4. Storage Bucket Kontrolü
Supabase Storage'da `products` bucket'ının mevcut olduğundan emin olun:

1. Sol menüden **Storage** → **Buckets**'a gidin
2. `products` bucket'ı varsa devam edin
3. Yoksa yeni bucket oluşturun:
   - Name: `products`
   - Public: ✅ (Ürün görsellerine public erişim için)

## 📋 Oluşturulan Tablolar

### Kategori Sistemi
```sql
main_categories     -- Ana kategoriler (Makyaj, Cilt Bakımı, vb.)
sub_categories      -- Alt kategoriler (Foundation, Rimel, vb.)
brands              -- Markalar (Maybelline, L'Oréal, vb.)
```

### Ürün Özellikleri
```sql
attribute_categories -- Özellik kategorileri (Yaş grubu, Cilt tipi)
attribute_values     -- Özellik değerleri (Normal, Kuru, Yağlı)
product_attributes   -- Ürün-özellik bağlantıları
```

### Güncellenmiş Products Tablosu
```sql
products            -- Ürünler (genişletilmiş kolonlarla)
product_details     -- Görünüm (join'li veriler)
```

## 🔧 Yeni Özellikler

### Profesyonel Ürün Yükleme
- 📝 5 adımlı form (Temel Bilgiler → Fiyat/Stok → Özellikler → Görseller → SEO)
- 🏷️ Kategori hiyerarşisi (Ana + Alt kategori)
- 🏢 Marka yönetimi
- 📦 Stok takibi
- 🎨 Renk, boy, cilt tipi gibi özellikler
- 📸 Çoklu görsel yükleme
- 🔍 SEO optimizasyonu

### Dinamik Breadcrumb
- 🧭 Otomatik breadcrumb oluşturma
- 📍 Kategori yolunu gösterme
- 🔗 Tıklanabilir navigasyon
- 📱 Responsive tasarım

### Gelişmiş Kategori Sistemi
- 🗂️ Ana kategori + Alt kategori hiyerarşisi
- 🏷️ Marka bazlı filtreleme
- 🎯 Ürün özelliklerine göre filtreleme
- 📊 Category sayfaları

## ✅ Kontrol Listesi

Kurulum tamamlandıktan sonra kontrol edin:

- [ ] Supabase SQL Editor'da `database_setup.sql` çalıştırıldı
- [ ] Supabase SQL Editor'da `update_products_table.sql` çalıştırıldı
- [ ] `products` storage bucket'ı mevcut ve public
- [ ] Ana sayfada kategoriler görünüyor
- [ ] Ürün yükleme sayfası (/protected) çalışıyor
- [ ] Breadcrumb görünüyor
- [ ] Kategori sayfaları çalışıyor

## 🐛 Sorun Giderme

### Hata: "relation does not exist"
- `database_setup.sql` dosyasını önce çalıştırdığınızdan emin olun

### Hata: "column already exists"
- Bu normal, kod zaten `IF NOT EXISTS` kontrolü yapıyor

### Görseller görünmüyor
- Storage bucket'ının public olduğundan emin olun
- `NEXT_PUBLIC_SUPABASE_URL` environment variable'ının doğru olduğunu kontrol edin

### Kategoriler boş görünüyor
- `database_setup.sql` dosyasında INSERT komutlarının çalıştığından emin olun
- Supabase Dashboard'da `main_categories` tablosunu kontrol edin

## 📞 Destek

Sorun yaşıyorsanız:
1. Supabase Dashboard → SQL Editor → History'den çalıştırılan komutları kontrol edin
2. Browser Console'da JavaScript hataları kontrol edin  
3. Network tab'ında API çağrılarını kontrol edin

---

**Tebrikler! 🎉** Artık profesyonel kozmetik e-ticaret platformunuz hazır! 