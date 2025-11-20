import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      stockCode, 
      stockName, 
      purchasePrice, 
      salesPrice,
      currency = 'TL'
    } = body;

    console.log('📦 Yeni ürün ekleme isteği:', { stockCode, stockName, purchasePrice, salesPrice });

    if (!stockCode || !stockName || !purchasePrice || !salesPrice) {
      return NextResponse.json(
        { error: 'stockCode, stockName, purchasePrice, and salesPrice are required' },
        { status: 400 }
      );
    }

    // GetObject metodu ile INSERT SQL sorgusu kullanalım
    // Önce ürünü STOCK tablosuna ekle
    const insertStockQuery = `
      INSERT INTO STOCK (STOCKNO, STOCKNAME, UNITID)
      VALUES ('${stockCode}', '${stockName}', 1)
    `;

    // Sonra fiyatları STOCKPRICE tablosuna ekle
    const insertPurchasePriceQuery = `
      INSERT INTO STOCKPRICE (STOCKID, PRICE, PRICETYPE, CURRCODE)
      SELECT STOCKID, ${purchasePrice}, 1, '${currency}'
      FROM STOCK
      WHERE STOCKNO = '${stockCode}'
    `;

    const insertSalesPriceQuery = `
      INSERT INTO STOCKPRICE (STOCKID, PRICE, PRICETYPE, CURRCODE)
      SELECT STOCKID, ${salesPrice}, 2, '${currency}'
      FROM STOCK
      WHERE STOCKNO = '${stockCode}'
    `;

    console.log('📤 Ürün ekleme sorguları gönderiliyor...');

    // İlk olarak STOCK ekle
    const stockResponse = await fetch('http://185.110.241.184:8640/TrexIntegrationService/REST/GetObject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ApiKey: '8059858119',
        Query: insertStockQuery,
      }),
    });

    if (!stockResponse.ok) {
      const errorText = await stockResponse.text();
      console.error('❌ STOCK ekleme hatası:', errorText);
      throw new Error(`Stock insert failed: ${stockResponse.status} - ${errorText}`);
    }

    const stockResult = await stockResponse.json();
    console.log('✅ STOCK eklendi:', stockResult);

    // Alış fiyatı ekle
    const purchaseResponse = await fetch('http://185.110.241.184:8640/TrexIntegrationService/REST/GetObject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ApiKey: '8059858119',
        Query: insertPurchasePriceQuery,
      }),
    });

    if (!purchaseResponse.ok) {
      const errorText = await purchaseResponse.text();
      console.error('❌ Alış fiyatı ekleme hatası:', errorText);
      throw new Error(`Purchase price insert failed: ${purchaseResponse.status} - ${errorText}`);
    }

    // Satış fiyatı ekle
    const salesResponse = await fetch('http://185.110.241.184:8640/TrexIntegrationService/REST/GetObject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ApiKey: '8059858119',
        Query: insertSalesPriceQuery,
      }),
    });

    if (!salesResponse.ok) {
      const errorText = await salesResponse.text();
      console.error('❌ Satış fiyatı ekleme hatası:', errorText);
      throw new Error(`Sales price insert failed: ${salesResponse.status} - ${errorText}`);
    }

    const salesResult = await salesResponse.json();
    console.log('✅ Satış fiyatı eklendi:', salesResult);

    return NextResponse.json({ 
      success: true, 
      message: 'Ürün başarıyla eklendi',
      stockCode,
      stockName,
      purchasePrice,
      salesPrice
    });
  } catch (error) {
    console.error('❌ Ürün ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Ürün eklenemedi', details: (error as Error).message },
      { status: 500 }
    );
  }
}

