import { NextResponse, NextRequest } from 'next/server';

interface StockCodeItem {
  stockCode: string;
  uploadedPurchasePrice?: number;
  uploadedSalesPrice?: number;
  uploadedDate?: string;
}

interface ProductPriceData {
  stockId: number;
  stockCode: string;
  stockName: string;
  categoryCode: string | null;
  subCategory: string | null;
  currentPurchasePrice: number | null;
  currentSalesPrice: number | null;
  avgSalesPrice30Days: number | null;
  currentMargin: number | null;
  lastUpdateDate: string | null;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Price Comparison API - Request received');
    const body = await request.json();
    console.log('Price Comparison API - Body parsed:', { itemCount: body?.stockCodes?.length });
    const { stockCodes } = body as { stockCodes: StockCodeItem[] };

    if (!stockCodes || !Array.isArray(stockCodes) || stockCodes.length === 0) {
      console.error('Price Comparison API - Invalid stockCodes');
      return NextResponse.json(
        { error: 'stockCodes array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Stok kodlarını SQL için hazırla
    const stockCodeList = stockCodes
      .map(item => `'${item.stockCode.replace(/'/g, "''")}'`)
      .join(',');

    // API'den güncel fiyat verilerini çek
    // Alış fiyatı: STOCKPRICETYPEID = 24 (ALIM FİYATI)
    // Satış fiyatı: STOCKPRICETYPEID = 23 (SATIŞ FİYATI) - STOCKPRICE'dan çek!
    const query = `SELECT s.STOCKID, s.STOCKNO, s.STOCKNAME, s.GROUPCODE, s.SPECCODE1, (SELECT TOP 1 sp.PRICE FROM STOCKPRICE sp WHERE sp.STOCKID = s.STOCKID AND sp.STOCKPRICETYPEID = 24 ORDER BY sp.INSERTDATE DESC) AS currentPurchasePrice, (SELECT TOP 1 sp.PRICE FROM STOCKPRICE sp WHERE sp.STOCKID = s.STOCKID AND sp.STOCKPRICETYPEID = 23 ORDER BY sp.INSERTDATE DESC) AS currentSalesPrice, (SELECT AVG(ii.PRICE) FROM INVOICEITEM ii JOIN VE_INVOICE i ON ii.RECEIPTID = i.RECEIPTID WHERE ii.STOCKID = s.STOCKID AND i.TRANSDATE >= DATEADD(DAY, -30, GETDATE()) AND i.TRANSTYPE = 101 AND i.STATUS != 4) AS avgSalesPrice30Days, (SELECT TOP 1 i.TRANSDATE FROM VE_INVOICE i JOIN INVOICEITEM ii ON i.RECEIPTID = ii.RECEIPTID WHERE ii.STOCKID = s.STOCKID AND i.TRANSTYPE = 101 ORDER BY i.TRANSDATE DESC) AS lastUpdateDate FROM VE_STOCK s WHERE s.STOCKNO IN (${stockCodeList})`;

    console.log('Price Comparison API - Query:', query);

    const response = await fetch(
      'http://185.110.241.184:8640/TrexIntegrationService/REST/GetJson',
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Query: query,
          ApiKey: '8059858119',
          ReturnSchema: false,
        }),
      }
    );

    console.log('Price Comparison API - Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Price Comparison API - Error response:', errorText);
      throw new Error(`API call failed with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Price Comparison API - Raw data:', data);

    let productsData: ProductPriceData[] = [];

    if (typeof data === 'string') {
      try {
        const parsedData = JSON.parse(data);
        console.log('Price Comparison API - Parsed data:', parsedData);

        if (Array.isArray(parsedData)) {
          productsData = parsedData.map((item) => {
            const purchasePrice = item.currentPurchasePrice || 0;
            const salesPrice = item.currentSalesPrice || 0;
            const margin =
              purchasePrice > 0 && salesPrice > 0
                ? ((salesPrice - purchasePrice) / purchasePrice) * 100
                : null;

            return {
              stockId: item.STOCKID || null,
              stockCode: item.STOCKNO || '',
              stockName: item.STOCKNAME || 'Tanımsız Ürün',
              categoryCode: item.GROUPCODE || null,
              subCategory: item.SPECCODE1 || null,
              currentPurchasePrice: purchasePrice,
              currentSalesPrice: salesPrice,
              avgSalesPrice30Days: item.avgSalesPrice30Days || null,
              currentMargin: margin,
              lastUpdateDate: item.lastUpdateDate || null,
            };
          });
        }
      } catch (e) {
        console.error('Error parsing price comparison data:', e);
        console.error('Raw data that failed to parse:', data);
      }
    } else if (data && typeof data === 'object' && 'Message' in data) {
      console.error(
        'API Error fetching price comparison:',
        (data as Record<string, unknown>).Message
      );
    }

    console.log('Price Comparison API - Final result:', productsData);

    // Yüklenen verilerle eşleştirme yap
    const comparisonResult = stockCodes.map((uploadedItem) => {
      const apiData = productsData.find(
        (p) => p.stockCode === uploadedItem.stockCode
      );

      if (!apiData) {
        return {
          stockCode: uploadedItem.stockCode,
          found: false,
          uploaded: uploadedItem,
          current: null,
          comparison: null,
        };
      }

      // Kar marjı hesaplamaları
      const uploadedMargin =
        uploadedItem.uploadedPurchasePrice &&
        uploadedItem.uploadedSalesPrice &&
        uploadedItem.uploadedPurchasePrice > 0
          ? ((uploadedItem.uploadedSalesPrice - uploadedItem.uploadedPurchasePrice) /
              uploadedItem.uploadedPurchasePrice) *
            100
          : null;

      // Fiyat farkları hesaplama
      // ALIŞ FİYATI: Yüklenen - Güncel (pozitif = yüklenen daha yüksek = KÖTÜ)
      const purchasePriceDiff =
        uploadedItem.uploadedPurchasePrice && apiData.currentPurchasePrice
          ? uploadedItem.uploadedPurchasePrice - apiData.currentPurchasePrice
          : null;

      const purchasePriceDiffPercent =
        purchasePriceDiff !== null && apiData.currentPurchasePrice
          ? (purchasePriceDiff / apiData.currentPurchasePrice) * 100
          : null;

      const salesPriceDiff =
        uploadedItem.uploadedSalesPrice && apiData.currentSalesPrice
          ? apiData.currentSalesPrice - uploadedItem.uploadedSalesPrice
          : null;

      const salesPriceDiffPercent =
        salesPriceDiff !== null && uploadedItem.uploadedSalesPrice
          ? (salesPriceDiff / uploadedItem.uploadedSalesPrice) * 100
          : null;

      const marginDiff =
        uploadedMargin !== null && apiData.currentMargin !== null
          ? apiData.currentMargin - uploadedMargin
          : null;

      // Akıllı öneri hesaplama
      // 1. Güncel kar marjını hesapla
      const currentMarginPercent = apiData.currentMargin || 0;
      
      // 2. Yüklenen alış fiyatı varsa ve güncel alış fiyatından farklıysa
      let suggestedSalesPrice = null;
      if (
        uploadedItem.uploadedPurchasePrice &&
        apiData.currentPurchasePrice &&
        uploadedItem.uploadedPurchasePrice !== apiData.currentPurchasePrice &&
        currentMarginPercent > 0
      ) {
        // Güncel marjı yüklenen alış fiyatına uygula
        suggestedSalesPrice = 
          uploadedItem.uploadedPurchasePrice * (1 + currentMarginPercent / 100);
      }

      // Öneri metni oluştur
      let recommendation = '';
      if (purchasePriceDiffPercent !== null) {
        if (Math.abs(purchasePriceDiffPercent) > 10) {
          if (purchasePriceDiffPercent > 0) {
            recommendation = `Alış fiyatı %${purchasePriceDiffPercent.toFixed(1)} artmış. Satış fiyatını güncellemeyi düşünün.`;
          } else {
            recommendation = `Alış fiyatı %${Math.abs(purchasePriceDiffPercent).toFixed(1)} düşmüş. Rekabetçi fiyatlandırma fırsatı.`;
          }
        }
      }

      if (marginDiff !== null && Math.abs(marginDiff) > 5) {
        if (marginDiff > 0) {
          recommendation += ` Kar marjınız artabilir (%${marginDiff.toFixed(1)}).`;
        } else {
          recommendation += ` Kar marjınız azalabilir (%${Math.abs(marginDiff).toFixed(1)}).`;
        }
      }

      return {
        stockCode: uploadedItem.stockCode,
        found: true,
        uploaded: {
          ...uploadedItem,
          calculatedMargin: uploadedMargin,
        },
        current: apiData,
        comparison: {
          purchasePriceDiff,
          purchasePriceDiffPercent,
          salesPriceDiff,
          salesPriceDiffPercent,
          marginDiff,
          recommendation: recommendation || 'Fiyatlar stabil görünüyor.',
          suggestedSalesPrice,
        },
      };
    });

    // Özet istatistikler
    const summary = {
      totalProducts: comparisonResult.length,
      foundProducts: comparisonResult.filter((r) => r.found).length,
      notFoundProducts: comparisonResult.filter((r) => !r.found).length,
      avgPurchasePriceDiff:
        comparisonResult
          .filter((r) => r.comparison?.purchasePriceDiff !== null)
          .reduce((sum, r) => sum + (r.comparison?.purchasePriceDiff || 0), 0) /
          comparisonResult.filter((r) => r.comparison?.purchasePriceDiff !== null).length || 0,
      avgSalesPriceDiff:
        comparisonResult
          .filter((r) => r.comparison?.salesPriceDiff !== null)
          .reduce((sum, r) => sum + (r.comparison?.salesPriceDiff || 0), 0) /
          comparisonResult.filter((r) => r.comparison?.salesPriceDiff !== null).length || 0,
      productsWithPriceIncrease: comparisonResult.filter(
        (r) => r.comparison?.purchasePriceDiff && r.comparison.purchasePriceDiff > 0
      ).length,
      productsWithPriceDecrease: comparisonResult.filter(
        (r) => r.comparison?.purchasePriceDiff && r.comparison.purchasePriceDiff < 0
      ).length,
      productsNeedingUpdate: comparisonResult.filter(
        (r) =>
          r.comparison?.purchasePriceDiffPercent &&
          Math.abs(r.comparison.purchasePriceDiffPercent) > 5
      ).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      products: comparisonResult,
    });
  } catch (error) {
    console.error('Failed to fetch price comparison:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch price comparison',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

