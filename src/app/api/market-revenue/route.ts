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

  const query = isToday
      ? `SELECT
            d.DEPOTNAME AS marketName,
            ISNULL(SUM(CASE WHEN i.TRANSTYPE = 101 AND i.STATUS != 4 THEN i.TOTAL ELSE 0 END), 0) AS totalRevenue,
            ISNULL(SUM(CASE WHEN i.TRANSTYPE = 104 THEN i.TOTAL ELSE 0 END), 0) AS totalReturns,
            ISNULL(COUNT(CASE WHEN i.TRANSTYPE = 101 AND i.STATUS != 4 THEN 1 END), 0) AS totalOrders,
            ISNULL(COUNT(CASE WHEN i.TRANSTYPE = 104 THEN 1 END), 0) AS totalReturnOrders,
            ISNULL(COUNT(CASE WHEN i.STATUS = 4 THEN 1 END), 0) AS totalCancelledOrders,
            ISNULL(SUM(CASE WHEN i.STATUS = 4 THEN i.TOTAL ELSE 0 END), 0) AS totalCancelledAmount,
            ISNULL(SUM(CASE WHEN i.TRANSTYPE = 101 AND i.STATUS != 4 THEN i.TOTAL ELSE 0 END), 0) - ISNULL(SUM(CASE WHEN i.TRANSTYPE = 104 THEN i.TOTAL ELSE 0 END), 0) AS netRevenue
          FROM VE_INVOICE i
          JOIN VE_DEPOT d ON i.DEPOTID = d.DEPOTID
          WHERE i.TRANSDATE = convert(date, GETDATE())
            AND i.DEPOTID IN (24, 25)
            AND (i.TRANSTYPE IN (101, 104) OR i.STATUS = 4)
          GROUP BY d.DEPOTNAME`
      : `SELECT
            d.DEPOTNAME AS marketName,
            ISNULL(SUM(CASE WHEN i.TRANSTYPE = 101 AND i.STATUS != 4 THEN i.TOTAL ELSE 0 END), 0) AS totalRevenue,
            ISNULL(SUM(CASE WHEN i.TRANSTYPE = 104 THEN i.TOTAL ELSE 0 END), 0) AS totalReturns,
            ISNULL(COUNT(CASE WHEN i.TRANSTYPE = 101 AND i.STATUS != 4 THEN 1 END), 0) AS totalOrders,
            ISNULL(COUNT(CASE WHEN i.TRANSTYPE = 104 THEN 1 END), 0) AS totalReturnOrders,
            ISNULL(COUNT(CASE WHEN i.STATUS = 4 THEN 1 END), 0) AS totalCancelledOrders,
            ISNULL(SUM(CASE WHEN i.STATUS = 4 THEN i.TOTAL ELSE 0 END), 0) AS totalCancelledAmount,
            ISNULL(SUM(CASE WHEN i.TRANSTYPE = 101 AND i.STATUS != 4 THEN i.TOTAL ELSE 0 END), 0) - ISNULL(SUM(CASE WHEN i.TRANSTYPE = 104 THEN i.TOTAL ELSE 0 END), 0) AS netRevenue
          FROM VE_INVOICE i
          JOIN VE_DEPOT d ON i.DEPOTID = d.DEPOTID
          WHERE i.TRANSDATE BETWEEN '${startDate}' AND '${endDate}'
            AND i.DEPOTID IN (24, 25)
            AND (i.TRANSTYPE IN (101, 104) OR i.STATUS = 4)
          GROUP BY d.DEPOTNAME`;

  try {
    const res = await fetch('http://185.110.241.184:8640/TrexIntegrationService/REST/GetJson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Query: query, ApiKey: '8059858119', ReturnSchema: false }),
    }).then(res => res.json());

    let marketRevenue = [];
    if (typeof res === 'string') {
      try {
        const parsedData = JSON.parse(res);
        if (Array.isArray(parsedData)) {
          marketRevenue = parsedData;
        }
      } catch (e) {
        console.error("Error parsing market revenue data:", e);
      }
    } else if (res && typeof res === 'object' && 'Message' in res) {
      console.error("API Error fetching market revenue:", (res as Record<string, unknown>).Message);
    }

    return NextResponse.json(marketRevenue);
  } catch (error) {
    console.error('Failed to fetch market revenue:', error);
    return NextResponse.json({ error: 'Failed to fetch market revenue' }, { status: 500 });
  }
}
