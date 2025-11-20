# Fiyat Karşılaştırma ve Analiz Sistemi

## Genel Bakış

Bu sistem, CSV veya Excel dosyalarından yüklenen ürün fiyat bilgilerini API'den çekilen güncel verilerle karşılaştırarak detaylı analiz ve raporlama sunar.

## Özellikler

### 1. Dosya Yükleme ve Parse
- **Desteklenen Formatlar:** CSV, XLSX, XLS
- **Sütun Eşleştirme:** Kullanıcı hangi sütunun ne olduğunu seçebilir
- **Validasyon:** Stok kodu zorunlu, diğer alanlar opsiyonel
- **Önizleme:** İlk 5 satır önizleme ile doğrulama

### 2. Karşılaştırma ve Analiz
- **Güncel Veriler:** API'den canlı fiyat bilgileri çekilir
- **Fiyat Farkları:** Alış ve satış fiyatlarındaki değişimler hesaplanır
- **Kar Marjı Analizi:** Mevcut ve yüklenen veriler arasında kar marjı karşılaştırması
- **Akıllı Öneriler:** Sistem otomatik olarak güncelleme önerileri oluşturur

### 3. Görselleştirme
- **Özet İstatistikler:** Toplam ürün, bulunan ürün, güncelleme gereken ürün sayıları
- **Bar Chart:** İlk 10 ürün için fiyat karşılaştırması
- **Line Chart:** Kar marjı karşılaştırması
- **Pie Chart:** Fiyat değişim dağılımı

### 4. Aksiyon ve Raporlama
- **Excel Export:** Tüm karşılaştırma verilerini Excel olarak indir
- **Öneri Gönderme:** Güncelleme gereken ürünler için otomatik öneri oluşturma
- **Supabase Entegrasyonu:** Öneriler veritabanına kaydedilir

## Kullanım

### Adım 1: Dosya Hazırlama

CSV veya Excel dosyanız şu sütunları içermelidir (sütun isimleri farklı olabilir):

```
Stok Kodu | Alış Fiyatı | Satış Fiyatı | Tarih
---------|------------|--------------|-------
ST001    | 100.00     | 150.00       | 2024-01-15
ST002    | 200.50     | 280.00       | 2024-01-15
```

**Zorunlu Sütun:**
- Stok Kodu

**Opsiyonel Sütunlar:**
- Alış Fiyatı
- Satış Fiyatı
- Tarih

### Adım 2: Dosya Yükleme

1. Sidebar'dan "Fiyat Karşılaştırma" menüsüne tıklayın
2. Dosyanızı sürükleyip bırakın veya seçin
3. Sütun eşleştirmesini yapın
4. Önizlemeyi kontrol edin
5. "Onayla ve Karşılaştır" butonuna tıklayın

### Adım 3: Analiz İnceleme

Sistem otomatik olarak şunları sunar:

- **Özet Kartlar:** Temel istatistikler
- **Grafikler:** Görsel analiz
- **Detaylı Tablo:** Ürün bazında karşılaştırma
- **Öneriler:** Her ürün için akıllı öneriler

### Adım 4: Aksiyon Alma

#### Excel İndir
```
Tüm karşılaştırma verisini Excel formatında indirin
```

#### Öneri Gönder
```
%5'ten fazla fiyat farkı olan ürünler için otomatik öneri oluşturur
Öneriler Supabase'e kaydedilir ve takip edilebilir
```

## Teknik Detaylar

### API Endpoint'leri

#### 1. Fiyat Karşılaştırma
```typescript
POST /api/price-comparison
Body: {
  stockCodes: [
    {
      stockCode: string,
      uploadedPurchasePrice?: number,
      uploadedSalesPrice?: number,
      uploadedDate?: string
    }
  ]
}
Response: {
  success: boolean,
  summary: SummaryStats,
  products: ComparisonResult[]
}
```

#### 2. Öneri Gönderme
```typescript
POST /api/price-update-suggestions
Headers: { Authorization: "Bearer <token>" }
Body: {
  suggestions: Suggestion[],
  fileName: string,
  totalProducts: number,
  avgPriceDifference: number,
  analysisData: object
}
```

### Supabase Tabloları

#### price_comparisons
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- upload_date (timestamp)
- file_name (text)
- total_products (integer)
- avg_price_difference (decimal)
- analysis_data (jsonb)
- created_at (timestamp)
```

#### price_update_suggestions
```sql
- id (uuid, primary key)
- comparison_id (uuid, foreign key)
- stock_code (text)
- current_purchase_price (decimal)
- suggested_purchase_price (decimal)
- current_sales_price (decimal)
- suggested_sales_price (decimal)
- reason (text)
- status (text: pending/approved/rejected)
- created_by (uuid)
- created_at (timestamp)
```

## Renk Kodları

- 🟢 **Yeşil:** Fiyat azalmış (avantajlı)
- 🔴 **Kırmızı:** Fiyat artmış (güncelleme gerekebilir)
- 🟡 **Sarı:** %5'ten az değişim (stabil)
- ⚪ **Gri:** Veri eksik

## Örnek CSV Formatı

```csv
Stok Kodu,Alış Fiyatı,Satış Fiyatı,Tarih
ST001,100.00,150.00,2024-01-15
ST002,200.50,280.00,2024-01-15
ST003,50.00,75.00,2024-01-15
```

## Örnek Excel Formatı

| Stok Kodu | Alış Fiyatı | Satış Fiyatı | Tarih      |
|-----------|-------------|--------------|------------|
| ST001     | 100.00      | 150.00       | 2024-01-15 |
| ST002     | 200.50      | 280.00       | 2024-01-15 |
| ST003     | 50.00       | 75.00        | 2024-01-15 |

## Performans Notları

- Sistem aynı anda 1000+ ürünü işleyebilir
- API sorgusu optimize edilmiştir
- Büyük dosyalarda yükleme süresi dosya boyutuna bağlıdır
- Grafikler ilk 10 ürünle sınırlıdır (performans için)

## Sorun Giderme

### "Stok Kodu bulunamadı" Hatası
- API'de bu stok koduna ait ürün yok
- Stok kodu yazım hatası olabilir
- STOCKNO alanını kontrol edin

### "Öneri gönderilemedi" Hatası
- Giriş yapmış olduğunuzdan emin olun
- İnternet bağlantınızı kontrol edin
- Supabase bağlantısını kontrol edin

### Dosya Yükleme Sorunları
- Dosya formatını kontrol edin (.csv, .xlsx, .xls)
- Dosya boyutunu kontrol edin (max 10MB önerilir)
- Excel dosyasında birden fazla sayfa varsa ilk sayfa kullanılır

## Güvenlik

- Tüm API istekleri authentication gerektirir
- Row Level Security (RLS) Supabase'de aktif
- Kullanıcılar sadece kendi önerilerini görebilir/düzenleyebilir

## Gelecek Geliştirmeler

- [ ] PDF export özelliği
- [ ] E-posta ile öneri bildirimi
- [ ] Toplu fiyat güncelleme (API'ye direkt yazma)
- [ ] Geçmiş karşılaştırmaları görüntüleme
- [ ] Fiyat trend grafiği (zaman serisi)
- [ ] Kategori bazında filtreleme

