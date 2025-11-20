import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stockCode, stockName, purchasePrice, salesPrice } = body;

    console.log('💰 Update Stock Price API - CLEAN START');
    console.log('📦 Stock:', stockCode, stockName);
    console.log('💵 Purchase:', purchasePrice, 'Sales:', salesPrice);

    if (!stockCode || !purchasePrice || !salesPrice) {
      return NextResponse.json(
        { error: 'Stock code, purchase price, and sales price are required' },
        { status: 400 }
      );
    }

    // Mevcut ürün bilgilerini çekelim
    const getStockQuery = `SELECT STOCKID, STOCKNO, STOCKNAME, UNITNAME FROM VE_STOCK WHERE STOCKNO = '${stockCode}'`;
    
    console.log('🔍 Getting stock details...');
    
    const stockResponse = await fetch('http://185.110.241.184:8640/TrexIntegrationService/REST/GetJson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ApiKey: '8059858119',
        Query: getStockQuery,
        ReturnSchema: false,
      }),
    });

    if (!stockResponse.ok) {
      throw new Error('Stock query failed');
    }

    const stockText = await stockResponse.text();
    let stockResult = JSON.parse(stockText);
    
    // Double-encoded check
    if (typeof stockResult === 'string') {
      stockResult = JSON.parse(stockResult);
    }

    if (!stockResult || !Array.isArray(stockResult) || stockResult.length === 0) {
      throw new Error('Stock not found: ' + stockCode);
    }

    const stock = stockResult[0];
    const stockId = stock.STOCKID;
    console.log('✅ Stock found:', stock);
    console.log('📌 STOCKID:', stockId);

    // ÖNCE ExecuteSQL3 ile direkt UPDATE deneyelim
    // Tam sizin verdiğiniz format
    const updatePurchaseSql = `UPDATE STOCKPRICE SET PRICE=${purchasePrice} WHERE STOCKID=${stockId} AND STOCKPRICETYPEID=24`;
    const updateSalesSql = `UPDATE STOCKPRICE SET PRICE=${salesPrice} WHERE STOCKID=${stockId} AND STOCKPRICETYPEID=23`;

    console.log('📝 SQL Purchase:', updatePurchaseSql);
    console.log('📝 SQL Sales:', updateSalesSql);

    // ExecuteSQL3 SOAP ile UPDATE - doğru parametre adı: strSQL
    const executeSqlEnvelope = `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
  <Body>
    <ExecuteSQL3 xmlns="http://tempuri.org/">
      <strSQL>${updatePurchaseSql}; ${updateSalesSql}</strSQL>
      <ApiKey>8059858119</ApiKey>
    </ExecuteSQL3>
  </Body>
</Envelope>`;

    console.log('📤 Sending ExecuteSQL3 request...');

    const execResponse = await fetch('http://185.110.241.184:8640/TrexIntegrationService', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/ITrexWebService/ExecuteSQL3',
      },
      body: executeSqlEnvelope,
    });

    const execResponseText = await execResponse.text();
    console.log('📡 ExecuteSQL3 Status:', execResponse.status);
    console.log('📄 ExecuteSQL3 Response:', execResponseText);

    // Başarılı mı kontrol et
    if (execResponse.ok && !execResponseText.includes('Fault') && !execResponseText.includes('fault')) {
      console.log('✅ ExecuteSQL3 SUCCESS! Price updated via SQL!');
      return NextResponse.json({
        success: true,
        message: 'Fiyatlar başarıyla güncellendi (ExecuteSQL3)',
        stockCode,
        purchasePrice,
        salesPrice,
        method: 'ExecuteSQL3',
      });
    }

    console.log('⚠️ ExecuteSQL3 failed, trying AddStockCard...');

    // AddStockCard SOAP - TAM DOKÜMANTASYON UYUMLU
    // ZORUNLU alanlar: ApiKey, CurrCode (ana), StockName, StockNo, UnitName
    // StockCardPriceItem: CurrCode (ZORUNLU!), Price, StockPriceTypeNo (ZORUNLU!)
    const soapEnvelope = `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
  <Body>
    <AddStockCard xmlns="http://tempuri.org/">
      <newStockCard>
        <ApiKey xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">8059858119</ApiKey>
        <CompanyId xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">11</CompanyId>
        <CurrCode xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">TL</CurrCode>
        <StockCardPrice xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">
          <StockCardPriceItem>
            <CurrCode xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">TL</CurrCode>
            <Price xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">${purchasePrice}</Price>
            <StockPriceTypeNo xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">24</StockPriceTypeNo>
          </StockCardPriceItem>
          <StockCardPriceItem>
            <CurrCode xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">TL</CurrCode>
            <Price xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">${salesPrice}</Price>
            <StockPriceTypeNo xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">23</StockPriceTypeNo>
          </StockCardPriceItem>
        </StockCardPrice>
        <StockName xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">${stock.STOCKNAME}</StockName>
        <StockNo xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">${stock.STOCKNO}</StockNo>
        <UnitName xmlns="http://schemas.datacontract.org/2004/07/TrexEntegrasyon.WinSvc.Model">${stock.UNITNAME || 'ADET'}</UnitName>
      </newStockCard>
    </AddStockCard>
  </Body>
</Envelope>`;

    console.log('📤 Sending AddStockCard SOAP request...');

    const soapResponse = await fetch('http://185.110.241.184:8640/TrexIntegrationService', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/ITrexWebService/AddStockCard',
      },
      body: soapEnvelope,
    });

    const soapResponseText = await soapResponse.text();
    console.log('📡 SOAP Status:', soapResponse.status);
    console.log('📄 SOAP Response:', soapResponseText);

    // Response analizi
    if (soapResponseText.includes('<AddStockCardResult>')) {
      const match = soapResponseText.match(/<AddStockCardResult>(.+?)<\/AddStockCardResult>/);
      const result = match ? match[1] : 'unknown';
      
      console.log('🔢 AddStockCardResult:', result);

      // -999 kontrolü: Belki aslında başarılı ama stok zaten var mesajı
      // Veritabanını kontrol edelim - fiyat güncellenmiş mi?
      if (result === '-999' || result === 'True' || parseInt(result) > 0) {
        console.log('📊 Checking if price was actually updated...');
        
        // 1 saniye bekle (veritabanı sync için)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fiyatı kontrol et
        const checkPriceQuery = `
          SELECT TOP 1 PRICE, INSERTDATE 
          FROM STOCKPRICE 
          WHERE STOCKID = ${stock.STOCKID} 
          AND STOCKPRICETYPEID = 24 
          ORDER BY INSERTDATE DESC
        `;
        
        const checkResponse = await fetch('http://185.110.241.184:8640/TrexIntegrationService/REST/GetJson', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ApiKey: '8059858119',
            Query: checkPriceQuery,
            ReturnSchema: false,
          }),
        });

        if (checkResponse.ok) {
          const checkText = await checkResponse.text();
          let checkResult = JSON.parse(checkText);
          if (typeof checkResult === 'string') {
            checkResult = JSON.parse(checkResult);
          }
          
          console.log('💰 Latest purchase price:', checkResult);
          
          if (checkResult && checkResult.length > 0 && checkResult[0].PRICE == purchasePrice) {
            console.log('✅ SUCCESS! Price was updated!');
            return NextResponse.json({
              success: true,
              message: 'Fiyatlar başarıyla güncellendi!',
              stockCode,
              purchasePrice,
              salesPrice,
              verified: true,
            });
          }
        }
        
        // Fiyat güncellenmediyse
        console.log('⚠️ Result is -999: Stock exists but price not updated');
        return NextResponse.json({
          success: false,
          error: 'API limitation',
          message: 'AddStockCard stok kartını buldu ancak fiyatları güncelleyemedi.',
          details: 'Sysmond masaüstü yazılımından manuel güncelleme yapmak gerekiyor.',
          stockCode,
          requestedPurchasePrice: purchasePrice,
          requestedSalesPrice: salesPrice,
        }, { status: 501 });
      }
    }

    // Diğer hatalar
    if (soapResponseText.includes('Fault') || soapResponseText.includes('fault')) {
      console.error('❌ SOAP Fault:', soapResponseText.substring(0, 500));
      throw new Error('SOAP request failed: ' + soapResponseText.substring(0, 200));
    }

    return NextResponse.json({
      success: false,
      error: 'Unexpected response',
      details: soapResponseText.substring(0, 200),
    }, { status: 500 });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { 
        error: 'Price update failed', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
