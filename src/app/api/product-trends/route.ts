import { NextResponse, NextRequest } from 'next/server';
import { format } from 'date-fns';

interface ProductTrend {
  stockId: number | null;
  productName: string;
  productCode: string | null;
  categoryCode: string;
  categoryName: string;
  subCategory: string;
  brand: string;
  salesCount: number;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
  averageQuantityPerSale: number;
  firstSaleDate: string | null;
  lastSaleDate: string | null;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
  recentPeriodQuantity: number;
  previousPeriodQuantity: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = searchParams.get('limit') || '50';
  const sortBy = searchParams.get('sortBy') || 'quantity'; // quantity, revenue, frequency

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  // Tarih formatını düzelt
  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = startDate === today && endDate === today;

  // En çok satılan ürünleri tespit eden query
  const query = isToday
    ? `SELECT TOP ${limit}
         s.STOCKID,
         s.STOCKNAME,
         COALESCE(s.GROUPCODE, 'TANIMSIZ') AS categoryCode,
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
         END AS categoryName,
         COALESCE(s.SPECCODE1, 'GENEL') AS subCategory,
         CASE 
           WHEN s.SPECCODE2 IS NOT NULL AND LEN(s.SPECCODE2) > 0 
           THEN UPPER(LEFT(s.SPECCODE2, 1)) + LOWER(SUBSTRING(s.SPECCODE2, 2, LEN(s.SPECCODE2)))
           ELSE 'Marka Belirtilmemiş'
         END AS brand,
         s.STOCKNO AS productCode,
         COUNT(DISTINCT i.RECEIPTID) AS salesCount,
         SUM(ii.QUANTITY) AS totalQuantity,
         ISNULL(SUM(ii.TOTAL), 0) AS totalRevenue,
         ISNULL(AVG(ii.TOTAL), 0) AS averagePrice,
         ISNULL(AVG(ii.QUANTITY), 0) AS averageQuantityPerSale,
         MIN(i.TRANSDATE) AS firstSaleDate,
         MAX(i.TRANSDATE) AS lastSaleDate,
         -- Trend hesaplaması için son 7 gün vs önceki 7 gün karşılaştırması
         (SELECT ISNULL(SUM(ii2.QUANTITY), 0) 
          FROM VE_INVOICE i2 
          LEFT JOIN INVOICEITEM ii2 ON i2.RECEIPTID = ii2.RECEIPTID 
          WHERE ii2.STOCKID = s.STOCKID 
          AND i2.TRANSDATE >= DATEADD(DAY, -7, GETDATE())
          AND i2.TRANSDATE < GETDATE()
          AND i2.DEPOTID IN (24, 25)
         ) AS last7DaysQuantity,
         (SELECT ISNULL(SUM(ii3.QUANTITY), 0) 
          FROM VE_INVOICE i3 
          LEFT JOIN INVOICEITEM ii3 ON i3.RECEIPTID = ii3.RECEIPTID 
          WHERE ii3.STOCKID = s.STOCKID 
          AND i3.TRANSDATE >= DATEADD(DAY, -14, GETDATE())
          AND i3.TRANSDATE < DATEADD(DAY, -7, GETDATE())
          AND i3.DEPOTID IN (24, 25)
         ) AS previous7DaysQuantity
       FROM VE_INVOICE i
       LEFT JOIN INVOICEITEM ii ON i.RECEIPTID = ii.RECEIPTID
       LEFT JOIN VE_STOCK s ON ii.STOCKID = s.STOCKID
       WHERE i.TRANSDATE = convert(date, GETDATE())
         AND s.STOCKID IS NOT NULL
         AND ii.QUANTITY > 0
          AND i.DEPOTID IN (24, 25, 26)
       GROUP BY s.STOCKID, s.STOCKNAME, s.GROUPCODE, s.SPECCODE1, s.SPECCODE2, s.STOCKNO
       ORDER BY ${sortBy === 'revenue' ? 'totalRevenue' : sortBy === 'frequency' ? 'salesCount' : 'totalQuantity'} DESC`
    : `SELECT TOP ${limit}
         s.STOCKID,
         s.STOCKNAME,
         COALESCE(s.GROUPCODE, 'TANIMSIZ') AS categoryCode,
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
         END AS categoryName,
         COALESCE(s.SPECCODE1, 'GENEL') AS subCategory,
         CASE 
           WHEN s.SPECCODE2 IS NOT NULL AND LEN(s.SPECCODE2) > 0 
           THEN UPPER(LEFT(s.SPECCODE2, 1)) + LOWER(SUBSTRING(s.SPECCODE2, 2, LEN(s.SPECCODE2)))
           ELSE 'Marka Belirtilmemiş'
         END AS brand,
         s.STOCKNO AS productCode,
         COUNT(DISTINCT i.RECEIPTID) AS salesCount,
         SUM(ii.QUANTITY) AS totalQuantity,
         ISNULL(SUM(ii.TOTAL), 0) AS totalRevenue,
         ISNULL(AVG(ii.TOTAL), 0) AS averagePrice,
         ISNULL(AVG(ii.QUANTITY), 0) AS averageQuantityPerSale,
         MIN(i.TRANSDATE) AS firstSaleDate,
         MAX(i.TRANSDATE) AS lastSaleDate,
         -- Trend hesaplaması için dönem içi ilk yarı vs ikinci yarı karşılaştırması
         (SELECT ISNULL(SUM(ii2.QUANTITY), 0) 
          FROM VE_INVOICE i2 
          LEFT JOIN INVOICEITEM ii2 ON i2.RECEIPTID = ii2.RECEIPTID 
          WHERE ii2.STOCKID = s.STOCKID 
          AND i2.TRANSDATE >= DATEADD(DAY, -DATEDIFF(DAY, '${startDate}', '${endDate}')/2, '${endDate}')
          AND i2.TRANSDATE <= '${endDate}'
          AND i2.DEPOTID IN (24, 25)
         ) AS recentPeriodQuantity,
         (SELECT ISNULL(SUM(ii3.QUANTITY), 0) 
          FROM VE_INVOICE i3 
          LEFT JOIN INVOICEITEM ii3 ON i3.RECEIPTID = ii3.RECEIPTID 
          WHERE ii3.STOCKID = s.STOCKID 
          AND i3.TRANSDATE >= '${startDate}'
          AND i3.TRANSDATE < DATEADD(DAY, -DATEDIFF(DAY, '${startDate}', '${endDate}')/2, '${endDate}')
          AND i3.DEPOTID IN (24, 25)
         ) AS earlierPeriodQuantity
       FROM VE_INVOICE i
       LEFT JOIN INVOICEITEM ii ON i.RECEIPTID = ii.RECEIPTID
       LEFT JOIN VE_STOCK s ON ii.STOCKID = s.STOCKID
       WHERE i.TRANSDATE BETWEEN '${startDate}' AND '${endDate}'
         AND s.STOCKID IS NOT NULL
         AND ii.QUANTITY > 0
          AND i.DEPOTID IN (24, 25, 26)
       GROUP BY s.STOCKID, s.STOCKNAME, s.GROUPCODE, s.SPECCODE1, s.SPECCODE2, s.STOCKNO
       ORDER BY ${sortBy === 'revenue' ? 'totalRevenue' : sortBy === 'frequency' ? 'salesCount' : 'totalQuantity'} DESC`;

  try {
    console.log('Product Trends API - Query:', query);
    console.log('Product Trends API - Date range:', startDate, 'to', endDate);
    console.log('Product Trends API - Sort by:', sortBy, 'Limit:', limit);
    
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

    console.log('Product Trends API - Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Product Trends API - Error response:', errorText);
      throw new Error(`API call failed with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Product Trends API - Raw data:', data);
    
    let productTrends: ProductTrend[] = [];

    if (typeof data === 'string') {
      try {
        const parsedData = JSON.parse(data);
        console.log('Product Trends API - Parsed data:', parsedData);
        
        if (Array.isArray(parsedData)) {
          productTrends = parsedData.map(item => {
            // Trend hesaplaması
            const recentQuantity = isToday ? item.last7DaysQuantity : item.recentPeriodQuantity;
            const previousQuantity = isToday ? item.previous7DaysQuantity : item.earlierPeriodQuantity;
            
            let trendDirection: 'up' | 'down' | 'stable' = 'stable';
            let trendPercentage = 0;
            
            if (previousQuantity > 0) {
              trendPercentage = ((recentQuantity - previousQuantity) / previousQuantity) * 100;
              if (trendPercentage > 5) trendDirection = 'up';
              else if (trendPercentage < -5) trendDirection = 'down';
            } else if (recentQuantity > 0) {
              trendDirection = 'up';
              trendPercentage = 100;
            }

            return {
              stockId: item.STOCKID || null,
              productName: item.STOCKNAME || 'Tanımsız Ürün',
              productCode: item.productCode || null,
              categoryCode: item.categoryCode || 'TANIMSIZ',
              categoryName: item.categoryName || 'Tanımsız Kategori',
              subCategory: item.subCategory || 'Genel',
              brand: item.brand || 'Marka Belirtilmemiş',
              salesCount: item.salesCount || 0,
              totalQuantity: item.totalQuantity || 0,
              totalRevenue: item.totalRevenue || 0,
              averagePrice: item.averagePrice || 0,
              averageQuantityPerSale: item.averageQuantityPerSale || 0,
              firstSaleDate: item.firstSaleDate || null,
              lastSaleDate: item.lastSaleDate || null,
              trendDirection,
              trendPercentage: Math.round(trendPercentage * 100) / 100,
              recentPeriodQuantity: recentQuantity || 0,
              previousPeriodQuantity: previousQuantity || 0
            };
          });
        }
      } catch (e) {
        console.error("Error parsing product trends data:", e);
        console.error("Raw data that failed to parse:", data);
      }
    } else if (data && typeof data === 'object' && 'Message' in data) {
      console.error("API Error fetching product trends:", (data as Record<string, unknown>).Message);
    }

    console.log('Product Trends API - Final result:', productTrends);
    return NextResponse.json(productTrends);
  } catch (error) {
    console.error('Failed to fetch product trends:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch product trends', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

