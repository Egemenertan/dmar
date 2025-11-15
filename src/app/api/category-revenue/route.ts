import { NextResponse, NextRequest } from 'next/server';
import { format } from 'date-fns';

interface CategoryRevenue {
  mainCategoryCode: string;
  mainCategoryName: string;
  subCategoryCode: string;
  subCategoryName: string;
  brand: string | null;
  itemCount: number;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
  categoryCode: string;
  categoryName: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  // Tarih formatını düzelt - M yerine MM kullan
  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = startDate === today && endDate === today;

  // Gerçek ürün kategorilerini almak için INVOICEITEM ile VE_STOCK JOIN'i yapalım
  // Eğer bu çalışmazsa STOCKCATEGORY tablosunu da deneyeceğiz
  // VE_STOCK tablosunda GROUPCODE ve SPECCODE alanlarında gerçek kategori bilgileri olmalı
  const query = isToday
    ? `SELECT 
         COALESCE(s.GROUPCODE, 'TANIMSIZ') AS mainCategoryCode,
         CASE 
           WHEN s.GROUPCODE = 'GIDA' OR s.GROUPCODE LIKE '%GIDA%' OR s.GROUPCODE LIKE '%FOOD%' THEN 'Gıda Ürünleri'
           WHEN s.GROUPCODE = 'ICECEK' OR s.GROUPCODE LIKE '%ICECEK%' OR s.GROUPCODE LIKE '%DRINK%' THEN 'İçecekler'
           WHEN s.GROUPCODE = 'TEMIZLIK' OR s.GROUPCODE LIKE '%TEMIZLIK%' OR s.GROUPCODE LIKE '%CLEAN%' THEN 'Temizlik Ürünleri'
           WHEN s.GROUPCODE = 'KOZMETIK' OR s.GROUPCODE LIKE '%KOZMETIK%' OR s.GROUPCODE LIKE '%COSMET%' THEN 'Kozmetik & Kişisel Bakım'
           WHEN s.GROUPCODE = 'ELEKTRONIK' OR s.GROUPCODE LIKE '%ELEKTRON%' OR s.GROUPCODE LIKE '%ELECTRONIC%' THEN 'Elektronik'
           WHEN s.GROUPCODE = 'GIYIM' OR s.GROUPCODE LIKE '%GIYIM%' OR s.GROUPCODE LIKE '%CLOTH%' THEN 'Giyim & Aksesuar'
           WHEN s.GROUPCODE = 'EV' OR s.GROUPCODE LIKE '%EV%' OR s.GROUPCODE LIKE '%HOME%' THEN 'Ev & Yaşam'
           WHEN s.GROUPCODE = 'KITAP' OR s.GROUPCODE LIKE '%KITAP%' OR s.GROUPCODE LIKE '%BOOK%' THEN 'Kitap & Kırtasiye'
           WHEN s.GROUPCODE = 'SPOR' OR s.GROUPCODE LIKE '%SPOR%' OR s.GROUPCODE LIKE '%SPORT%' THEN 'Spor & Outdoor'
           WHEN s.GROUPCODE = 'OYUNCAK' OR s.GROUPCODE LIKE '%OYUNCAK%' OR s.GROUPCODE LIKE '%TOY%' THEN 'Oyuncak & Hobi'
           WHEN s.GROUPCODE = 'OTOMOBIL' OR s.GROUPCODE LIKE '%OTO%' OR s.GROUPCODE LIKE '%AUTO%' THEN 'Otomotiv'
           WHEN s.GROUPCODE = 'SAGLIK' OR s.GROUPCODE LIKE '%SAGLIK%' OR s.GROUPCODE LIKE '%HEALTH%' THEN 'Sağlık & Medikal'
           WHEN s.GROUPCODE IS NOT NULL THEN UPPER(LEFT(s.GROUPCODE, 1)) + LOWER(SUBSTRING(s.GROUPCODE, 2, LEN(s.GROUPCODE)))
           ELSE 'Tanımsız Kategori' 
         END AS mainCategoryName,
         COALESCE(s.SPECCODE1, 'GENEL') AS subCategoryCode,
         CASE 
           WHEN s.SPECCODE1 = 'SUT' OR s.SPECCODE1 LIKE '%SUT%' OR s.SPECCODE1 LIKE '%MILK%' THEN 'Süt Ürünleri'
           WHEN s.SPECCODE1 = 'ET' OR s.SPECCODE1 LIKE '%ET%' OR s.SPECCODE1 LIKE '%MEAT%' THEN 'Et & Et Ürünleri'
           WHEN s.SPECCODE1 = 'MEYVE' OR s.SPECCODE1 LIKE '%MEYVE%' OR s.SPECCODE1 LIKE '%FRUIT%' THEN 'Meyve & Sebze'
           WHEN s.SPECCODE1 = 'EKMEK' OR s.SPECCODE1 LIKE '%EKMEK%' OR s.SPECCODE1 LIKE '%BREAD%' THEN 'Ekmek & Unlu Mamüller'
           WHEN s.SPECCODE1 = 'DETERJAN' OR s.SPECCODE1 LIKE '%DETERJAN%' THEN 'Deterjan & Temizlik'
           WHEN s.SPECCODE1 = 'SAMPUAN' OR s.SPECCODE1 LIKE '%SAMPUAN%' OR s.SPECCODE1 LIKE '%SHAMPOO%' THEN 'Şampuan & Saç Bakımı'
           WHEN s.SPECCODE1 = 'TELEFON' OR s.SPECCODE1 LIKE '%TELEFON%' OR s.SPECCODE1 LIKE '%PHONE%' THEN 'Telefon & Aksesuar'
           WHEN s.SPECCODE1 = 'BILGISAYAR' OR s.SPECCODE1 LIKE '%BILGISAYAR%' OR s.SPECCODE1 LIKE '%COMPUTER%' THEN 'Bilgisayar & Tablet'
           WHEN s.SPECCODE1 = 'PANTOLON' OR s.SPECCODE1 LIKE '%PANTOLON%' OR s.SPECCODE1 LIKE '%PANT%' THEN 'Pantolon & Alt Giyim'
           WHEN s.SPECCODE1 = 'GOMLEK' OR s.SPECCODE1 LIKE '%GOMLEK%' OR s.SPECCODE1 LIKE '%SHIRT%' THEN 'Gömlek & Üst Giyim'
           WHEN s.SPECCODE1 IS NOT NULL THEN UPPER(LEFT(s.SPECCODE1, 1)) + LOWER(SUBSTRING(s.SPECCODE1, 2, LEN(s.SPECCODE1)))
           ELSE 'Genel Alt Kategori' 
         END AS subCategoryName,
         CASE 
           WHEN s.SPECCODE2 IS NOT NULL AND LEN(s.SPECCODE2) > 0 
           THEN UPPER(LEFT(s.SPECCODE2, 1)) + LOWER(SUBSTRING(s.SPECCODE2, 2, LEN(s.SPECCODE2)))
           ELSE 'Marka Belirtilmemiş'
         END AS brand,
         COUNT(DISTINCT i.RECEIPTID) AS itemCount,
         COUNT(*) AS totalQuantity,
         ISNULL(SUM(i.TOTAL), 0) AS totalRevenue,
         ISNULL(AVG(i.TOTAL), 0) AS averagePrice
       FROM VE_INVOICE i
       LEFT JOIN INVOICEITEM ii ON i.RECEIPTID = ii.RECEIPTID
       LEFT JOIN VE_STOCK s ON ii.STOCKID = s.STOCKID
       WHERE i.TRANSDATE = convert(date, GETDATE())
         AND s.STOCKID IS NOT NULL
         AND i.DEPOTID IN (24, 25)
       GROUP BY s.GROUPCODE, s.SPECCODE1, s.SPECCODE2
       ORDER BY totalRevenue DESC`
    : `SELECT 
         COALESCE(s.GROUPCODE, 'TANIMSIZ') AS mainCategoryCode,
         CASE 
           WHEN s.GROUPCODE = 'GIDA' OR s.GROUPCODE LIKE '%GIDA%' OR s.GROUPCODE LIKE '%FOOD%' THEN 'Gıda Ürünleri'
           WHEN s.GROUPCODE = 'ICECEK' OR s.GROUPCODE LIKE '%ICECEK%' OR s.GROUPCODE LIKE '%DRINK%' THEN 'İçecekler'
           WHEN s.GROUPCODE = 'TEMIZLIK' OR s.GROUPCODE LIKE '%TEMIZLIK%' OR s.GROUPCODE LIKE '%CLEAN%' THEN 'Temizlik Ürünleri'
           WHEN s.GROUPCODE = 'KOZMETIK' OR s.GROUPCODE LIKE '%KOZMETIK%' OR s.GROUPCODE LIKE '%COSMET%' THEN 'Kozmetik & Kişisel Bakım'
           WHEN s.GROUPCODE = 'ELEKTRONIK' OR s.GROUPCODE LIKE '%ELEKTRON%' OR s.GROUPCODE LIKE '%ELECTRONIC%' THEN 'Elektronik'
           WHEN s.GROUPCODE = 'GIYIM' OR s.GROUPCODE LIKE '%GIYIM%' OR s.GROUPCODE LIKE '%CLOTH%' THEN 'Giyim & Aksesuar'
           WHEN s.GROUPCODE = 'EV' OR s.GROUPCODE LIKE '%EV%' OR s.GROUPCODE LIKE '%HOME%' THEN 'Ev & Yaşam'
           WHEN s.GROUPCODE = 'KITAP' OR s.GROUPCODE LIKE '%KITAP%' OR s.GROUPCODE LIKE '%BOOK%' THEN 'Kitap & Kırtasiye'
           WHEN s.GROUPCODE = 'SPOR' OR s.GROUPCODE LIKE '%SPOR%' OR s.GROUPCODE LIKE '%SPORT%' THEN 'Spor & Outdoor'
           WHEN s.GROUPCODE = 'OYUNCAK' OR s.GROUPCODE LIKE '%OYUNCAK%' OR s.GROUPCODE LIKE '%TOY%' THEN 'Oyuncak & Hobi'
           WHEN s.GROUPCODE = 'OTOMOBIL' OR s.GROUPCODE LIKE '%OTO%' OR s.GROUPCODE LIKE '%AUTO%' THEN 'Otomotiv'
           WHEN s.GROUPCODE = 'SAGLIK' OR s.GROUPCODE LIKE '%SAGLIK%' OR s.GROUPCODE LIKE '%HEALTH%' THEN 'Sağlık & Medikal'
           WHEN s.GROUPCODE IS NOT NULL THEN UPPER(LEFT(s.GROUPCODE, 1)) + LOWER(SUBSTRING(s.GROUPCODE, 2, LEN(s.GROUPCODE)))
           ELSE 'Tanımsız Kategori' 
         END AS mainCategoryName,
         COALESCE(s.SPECCODE1, 'GENEL') AS subCategoryCode,
         CASE 
           WHEN s.SPECCODE1 = 'SUT' OR s.SPECCODE1 LIKE '%SUT%' OR s.SPECCODE1 LIKE '%MILK%' THEN 'Süt Ürünleri'
           WHEN s.SPECCODE1 = 'ET' OR s.SPECCODE1 LIKE '%ET%' OR s.SPECCODE1 LIKE '%MEAT%' THEN 'Et & Et Ürünleri'
           WHEN s.SPECCODE1 = 'MEYVE' OR s.SPECCODE1 LIKE '%MEYVE%' OR s.SPECCODE1 LIKE '%FRUIT%' THEN 'Meyve & Sebze'
           WHEN s.SPECCODE1 = 'EKMEK' OR s.SPECCODE1 LIKE '%EKMEK%' OR s.SPECCODE1 LIKE '%BREAD%' THEN 'Ekmek & Unlu Mamüller'
           WHEN s.SPECCODE1 = 'DETERJAN' OR s.SPECCODE1 LIKE '%DETERJAN%' THEN 'Deterjan & Temizlik'
           WHEN s.SPECCODE1 = 'SAMPUAN' OR s.SPECCODE1 LIKE '%SAMPUAN%' OR s.SPECCODE1 LIKE '%SHAMPOO%' THEN 'Şampuan & Saç Bakımı'
           WHEN s.SPECCODE1 = 'TELEFON' OR s.SPECCODE1 LIKE '%TELEFON%' OR s.SPECCODE1 LIKE '%PHONE%' THEN 'Telefon & Aksesuar'
           WHEN s.SPECCODE1 = 'BILGISAYAR' OR s.SPECCODE1 LIKE '%BILGISAYAR%' OR s.SPECCODE1 LIKE '%COMPUTER%' THEN 'Bilgisayar & Tablet'
           WHEN s.SPECCODE1 = 'PANTOLON' OR s.SPECCODE1 LIKE '%PANTOLON%' OR s.SPECCODE1 LIKE '%PANT%' THEN 'Pantolon & Alt Giyim'
           WHEN s.SPECCODE1 = 'GOMLEK' OR s.SPECCODE1 LIKE '%GOMLEK%' OR s.SPECCODE1 LIKE '%SHIRT%' THEN 'Gömlek & Üst Giyim'
           WHEN s.SPECCODE1 IS NOT NULL THEN UPPER(LEFT(s.SPECCODE1, 1)) + LOWER(SUBSTRING(s.SPECCODE1, 2, LEN(s.SPECCODE1)))
           ELSE 'Genel Alt Kategori' 
         END AS subCategoryName,
         CASE 
           WHEN s.SPECCODE2 IS NOT NULL AND LEN(s.SPECCODE2) > 0 
           THEN UPPER(LEFT(s.SPECCODE2, 1)) + LOWER(SUBSTRING(s.SPECCODE2, 2, LEN(s.SPECCODE2)))
           ELSE 'Marka Belirtilmemiş'
         END AS brand,
         COUNT(DISTINCT i.RECEIPTID) AS itemCount,
         COUNT(*) AS totalQuantity,
         ISNULL(SUM(i.TOTAL), 0) AS totalRevenue,
         ISNULL(AVG(i.TOTAL), 0) AS averagePrice
       FROM VE_INVOICE i
       LEFT JOIN INVOICEITEM ii ON i.RECEIPTID = ii.RECEIPTID
       LEFT JOIN VE_STOCK s ON ii.STOCKID = s.STOCKID
       WHERE i.TRANSDATE BETWEEN '${startDate}' AND '${endDate}'
         AND s.STOCKID IS NOT NULL
         AND i.DEPOTID IN (24, 25)
       GROUP BY s.GROUPCODE, s.SPECCODE1, s.SPECCODE2
       ORDER BY totalRevenue DESC`;

  try {
    console.log('Category Revenue API - Query:', query);
    console.log('Category Revenue API - Date range:', startDate, 'to', endDate);
    
    const response = await fetch('http://185.110.241.184:8640/TrexIntegrationService/REST/GetJson', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Query: query,
        ApiKey: '8059858119',
        ReturnSchema: false,
      }),
    });

    console.log('Category Revenue API - Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Category Revenue API - Error response:', errorText);
      throw new Error(`API call failed with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Category Revenue API - Raw data:', data);
    
    let categoryRevenue: CategoryRevenue[] = [];

    if (typeof data === 'string') {
      try {
        const parsedData = JSON.parse(data);
        console.log('Category Revenue API - Parsed data:', parsedData);
        
        if (Array.isArray(parsedData)) {
          categoryRevenue = parsedData.map(item => ({
            mainCategoryCode: item.mainCategoryCode || 'TANIMSIZ',
            mainCategoryName: item.mainCategoryName || 'Tanımsız Kategori',
            subCategoryCode: item.subCategoryCode || 'GENEL',
            subCategoryName: item.subCategoryName || 'Genel',
            brand: item.brand || null,
            itemCount: item.itemCount || 0,
            totalQuantity: item.totalQuantity || 0,
            totalRevenue: item.totalRevenue || 0,
            averagePrice: item.averagePrice || 0,
            // Backward compatibility için eski alanları da ekle
            categoryCode: item.mainCategoryCode || 'TANIMSIZ',
            categoryName: `${item.mainCategoryName || 'Tanımsız'} > ${item.subCategoryName || 'Genel'}`
          }));
        }
      } catch (e) {
        console.error("Error parsing category revenue data:", e);
        console.error("Raw data that failed to parse:", data);
      }
    } else if (data && typeof data === 'object' && 'Message' in data) {
      console.error("API Error fetching category revenue:", (data as Record<string, unknown>).Message);
    }

    console.log('Category Revenue API - Final result:', categoryRevenue);
    return NextResponse.json(categoryRevenue);
  } catch (error) {
    console.error('Failed to fetch category revenue:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch category revenue', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
