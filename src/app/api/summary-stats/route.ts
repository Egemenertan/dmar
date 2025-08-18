import { NextResponse, NextRequest } from 'next/server';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  const today = format(new Date(), 'yyyy-d-M');
  const isToday = startDate === today && endDate === today;

  // Tüm satışlar (pozitif ve negatif tutarlarla)
  const revenueQuery = isToday
      ? `SELECT 
         ISNULL(SUM(CASE WHEN TRANSTYPE = 101 THEN TOTAL ELSE 0 END), 0) AS TotalRevenue,
         ISNULL(SUM(CASE WHEN TRANSTYPE = 104 THEN TOTAL ELSE 0 END), 0) AS TotalReturns,
         ISNULL(COUNT(CASE WHEN TRANSTYPE = 101 THEN 1 END), 0) AS TotalOrders,
         ISNULL(COUNT(CASE WHEN TRANSTYPE = 104 THEN 1 END), 0) AS TotalReturnOrders
        FROM VE_INVOICE WHERE TRANSDATE = convert(date, GETDATE()) AND DEPOTID IN (24, 25) AND TRANSTYPE IN (101, 104)`
      : `SELECT 
         ISNULL(SUM(CASE WHEN TRANSTYPE = 101 THEN TOTAL ELSE 0 END), 0) AS TotalRevenue,
         ISNULL(SUM(CASE WHEN TRANSTYPE = 104 THEN TOTAL ELSE 0 END), 0) AS TotalReturns,
         ISNULL(COUNT(CASE WHEN TRANSTYPE = 101 THEN 1 END), 0) AS TotalOrders,
         ISNULL(COUNT(CASE WHEN TRANSTYPE = 104 THEN 1 END), 0) AS TotalReturnOrders
        FROM VE_INVOICE WHERE TRANSDATE BETWEEN '${startDate}' AND '${endDate}' AND DEPOTID IN (24, 25) AND TRANSTYPE IN (101, 104)`;
  
  try {
    const response = await fetch('http://46.30.179.216:8640/TrexIntegrationService/REST/GetJson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Query: revenueQuery, ApiKey: '8059858119', ReturnSchema: false }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    let result = {};
    
    if (typeof data === 'string') {
      try {
        const parsedData = JSON.parse(data);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          result = parsedData[0];
        }
      } catch (e) {
        console.error("Error parsing summary stats data:", e);
      }
    } else if (data && typeof data === 'object' && 'Message' in data) {
      console.error("API Error fetching summary stats:", data.Message);
    }

    const totalRevenue = result.TotalRevenue || 0;
    const totalReturns = result.TotalReturns || 0;
    const totalOrders = result.TotalOrders || 0;
    const totalReturnOrders = result.TotalReturnOrders || 0;

    return NextResponse.json({
      totalRevenue,
      totalReturns,
      totalOrders,
      totalReturnOrders,
      netRevenue: totalRevenue - totalReturns,
    });
  } catch (error) {
    console.error('Failed to fetch summary stats:', error);
    return NextResponse.json({ error: 'Failed to fetch summary stats' }, { status: 500 });
  }
}
